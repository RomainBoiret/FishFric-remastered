/**
 * Procedural ocean audio (Web Audio) - no asset files.
 * Muted by default; unlocks on user gesture via SoundToggle.
 * Presence layers fade with on-screen subjects; depth follows scroll.
 */

export type OceanSfx =
  | "chest"
  | "jackpot"
  | "foghorn"
  | "plane"
  | "wish"
  | "konami"
  | "chime"
  | "brand"
  | "toggle";

export type OceanPresence = "plane" | "boat" | "sub" | "whale" | "gulls";

const STORAGE_KEY = "ff-sound-on";
export const OCEAN_PRESENCE_IDS = [
  "plane",
  "boat",
  "sub",
  "whale",
  "gulls",
] as const satisfies readonly OceanPresence[];

type Listener = (enabled: boolean) => void;

function canUseAudio() {
  return typeof window !== "undefined" && typeof AudioContext !== "undefined";
}

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredEnabled(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function rampGain(g: GainNode, value: number, ctx: AudioContext, sec = 0.45) {
  const now = ctx.currentTime;
  const target = value < 0.001 ? 0.0001 : value;
  // Avoid restarting ramps every sample tick
  if (Math.abs(g.gain.value - target) < 0.008) return;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
  g.gain.linearRampToValueAtTime(target, now + sec);
}

class OceanAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private bubbleTimer: ReturnType<typeof setInterval> | null = null;
  private gullCryTimer: ReturnType<typeof setInterval> | null = null;
  private whaleCallTimer: ReturnType<typeof setInterval> | null = null;
  private enabled = false;
  private listeners = new Set<Listener>();
  private ready = false;
  private unlockCleanup: (() => void) | null = null;

  private presenceGain = new Map<OceanPresence, GainNode>();
  private presenceAmount = new Map<OceanPresence, number>();
  private depthGain: GainNode | null = null;
  private depthFilter: BiquadFilterNode | null = null;
  private depthDroneGain: GainNode | null = null;
  private baseNoiseFilter: BiquadFilterNode | null = null;
  private depthAmount = 0;

  isEnabled() {
    return this.enabled;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.enabled);
    return () => {
      this.listeners.delete(fn);
    };
  }

  hydrate() {
    if (!canUseAudio()) return;
    this.enabled = readStoredEnabled();
    this.emit();
    if (this.enabled) this.armUnlock();
  }

  async setEnabled(on: boolean) {
    if (!canUseAudio()) return;
    this.enabled = on;
    writeStoredEnabled(on);
    this.emit();

    if (on) {
      this.clearUnlock();
      await this.ensureGraph();
      await this.ctx!.resume();
      const now = this.ctx!.currentTime;
      this.master!.gain.cancelScheduledValues(now);
      this.master!.gain.setValueAtTime(this.master!.gain.value || 0.0001, now);
      this.master!.gain.linearRampToValueAtTime(0.9, now + 0.25);
      this.startAmbience();
      this.play("toggle");
      // Re-apply last known presence / depth after graph rebuild
      for (const id of OCEAN_PRESENCE_IDS) {
        this.applyPresence(id, this.presenceAmount.get(id) ?? 0);
      }
      this.applyDepth(this.depthAmount);
    } else {
      this.clearUnlock();
      this.stopAmbience();
      if (this.master && this.ctx) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.master.gain.value, now);
        this.master.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      }
    }
  }

  /** 0 = off-screen, 1 = fully in view (IntersectionObserver ratio). */
  setPresence(id: OceanPresence, amount: number) {
    const next = Math.min(1, Math.max(0, amount));
    const prev = this.presenceAmount.get(id) ?? 0;
    if (Math.abs(next - prev) < 0.03 && next !== 0 && prev !== 0) return;
    if (next === 0 && prev === 0) return;
    this.presenceAmount.set(id, next);
    if (!this.enabled || !this.ready || !this.ctx) return;
    this.applyPresence(id, next);
  }

  /** 0 = top of page, 1 = bottom (deep). */
  setDepth(amount: number) {
    const next = Math.min(1, Math.max(0, amount));
    if (Math.abs(next - this.depthAmount) < 0.02) return;
    this.depthAmount = next;
    if (!this.enabled || !this.ready || !this.ctx) return;
    this.applyDepth(next);
  }

  play(kind: OceanSfx) {
    if (!this.enabled || !canUseAudio()) return;
    void this.ensureGraph().then(() => {
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
      void this.ctx.resume();
      const t = this.ctx.currentTime;
      switch (kind) {
        case "chest":
          this.coinArp(t, false);
          break;
        case "jackpot":
          this.coinArp(t, true);
          break;
        case "foghorn":
          this.foghorn(t);
          break;
        case "plane":
          this.planeBuzz(t);
          break;
        case "wish":
          this.sparkle(t, 880);
          break;
        case "konami":
          this.sparkle(t, 660);
          this.sparkle(t + 0.12, 990);
          this.sparkle(t + 0.24, 1320);
          break;
        case "chime":
          this.softChime(t);
          break;
        case "brand":
          this.blip(t, 720);
          break;
        case "toggle":
          this.blip(t, 520);
          break;
      }
    });
  }

  private armUnlock() {
    this.clearUnlock();
    const unlock = () => {
      this.clearUnlock();
      if (!this.enabled) return;
      void this.resumeAmbience();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    this.unlockCleanup = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }

  private clearUnlock() {
    this.unlockCleanup?.();
    this.unlockCleanup = null;
  }

  private async resumeAmbience() {
    if (!this.enabled) return;
    await this.ensureGraph();
    await this.ctx!.resume();
    if (this.master) this.master.gain.value = 0.9;
    this.startAmbience();
    for (const id of OCEAN_PRESENCE_IDS) {
      this.applyPresence(id, this.presenceAmount.get(id) ?? 0);
    }
    this.applyDepth(this.depthAmount);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.enabled);
  }

  private async ensureGraph() {
    if (this.ready && this.ctx) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1;
    this.sfxGain.connect(this.master);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0;
    this.ambienceGain.connect(this.master);

    this.ready = true;
  }

  private startAmbience() {
    if (!this.ctx || !this.ambienceGain) return;
    this.stopAmbience(false);

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Soft underwater drone
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.1;
    drone.connect(droneGain);
    droneGain.connect(this.ambienceGain);
    drone.start(now);
    this.ambientNodes.push(drone, droneGain);

    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 82;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humGain);
    humGain.connect(this.ambienceGain);
    hum.start(now);
    this.ambientNodes.push(hum, humGain);

    // Filtered noise = distant waves / water
    const noise = this.makeNoiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    this.baseNoiseFilter = filter;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.16;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ambienceGain);
    noise.start(now);
    lfo.start(now);
    this.ambientNodes.push(noise, filter, noiseGain, lfo, lfoGain);

    this.buildPresenceLayers(now);
    this.buildDepthLayer(now);

    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setValueAtTime(0, now);
    this.ambienceGain.gain.linearRampToValueAtTime(1, now + 1.4);

    this.bubbleTimer = setInterval(() => {
      if (!this.enabled) return;
      // More bubbles as you go deeper
      const chance = 0.45 + this.depthAmount * 0.35;
      if (Math.random() < chance) this.softBubble();
    }, 2000);

    this.gullCryTimer = setInterval(() => {
      if (!this.enabled) return;
      const amt = this.presenceAmount.get("gulls") ?? 0;
      if (amt > 0.15 && Math.random() < 0.6) this.gullCry();
    }, 2400);

    this.whaleCallTimer = setInterval(() => {
      if (!this.enabled) return;
      const amt = this.presenceAmount.get("whale") ?? 0;
      if (amt > 0.12 && Math.random() < 0.55) this.whaleCall();
    }, 5600);
  }

  private buildPresenceLayers(now: number) {
    if (!this.ctx || !this.ambienceGain) return;
    const ctx = this.ctx;
    this.presenceGain.clear();

    for (const id of OCEAN_PRESENCE_IDS) {
      const bus = ctx.createGain();
      bus.gain.value = 0.0001;
      bus.connect(this.ambienceGain);
      this.presenceGain.set(id, bus);
      this.ambientNodes.push(bus);
    }

    // --- Plane prop ---
    {
      const bus = this.presenceGain.get("plane")!;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 195;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 620;
      filter.Q.value = 3.5;
      const g = ctx.createGain();
      g.gain.value = 0.12;
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 18;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 22;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(g);
      g.connect(bus);
      osc.start(now);
      lfo.start(now);
      this.ambientNodes.push(osc, filter, g, lfo, lfoG);
    }

    // --- Boat hull / idle ---
    {
      const bus = this.presenceGain.get("boat")!;
      const wave = this.makeNoiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 280;
      filter.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.value = 0.14;
      wave.connect(filter);
      filter.connect(g);
      g.connect(bus);
      wave.start(now);

      const idle = ctx.createOscillator();
      idle.type = "triangle";
      idle.frequency.value = 62;
      const idleG = ctx.createGain();
      idleG.gain.value = 0.07;
      idle.connect(idleG);
      idleG.connect(bus);
      idle.start(now);
      this.ambientNodes.push(wave, filter, g, idle, idleG);
    }

    // --- Sub propeller ---
    {
      const bus = this.presenceGain.get("sub")!;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 48;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 220;
      const g = ctx.createGain();
      g.gain.value = 0.12;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 3.2;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 8;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(g);
      g.connect(bus);
      osc.start(now);
      lfo.start(now);

      const elec = ctx.createOscillator();
      elec.type = "sine";
      elec.frequency.value = 140;
      const elecG = ctx.createGain();
      elecG.gain.value = 0.05;
      elec.connect(elecG);
      elecG.connect(bus);
      elec.start(now);
      this.ambientNodes.push(osc, filter, g, lfo, lfoG, elec, elecG);
    }

    // --- Whale bed (soft continuous) ---
    {
      const bus = this.presenceGain.get("whale")!;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 38;
      const g = ctx.createGain();
      g.gain.value = 0.1;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 6;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      osc.connect(g);
      g.connect(bus);
      osc.start(now);
      lfo.start(now);
      this.ambientNodes.push(osc, g, lfo, lfoG);
    }

    // --- Gulls breeze bed ---
    {
      const bus = this.presenceGain.get("gulls")!;
      const wind = this.makeNoiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.value = 0.08;
      wind.connect(filter);
      filter.connect(g);
      g.connect(bus);
      wind.start(now);
      this.ambientNodes.push(wind, filter, g);
    }
  }

  private buildDepthLayer(now: number) {
    if (!this.ctx || !this.ambienceGain) return;
    const ctx = this.ctx;

    const bus = ctx.createGain();
    bus.gain.value = 0.0001;
    bus.connect(this.ambienceGain);
    this.depthGain = bus;
    this.ambientNodes.push(bus);

    const rumble = this.makeNoiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 90;
    filter.Q.value = 0.6;
    this.depthFilter = filter;
    const g = ctx.createGain();
    g.gain.value = 0.28;
    rumble.connect(filter);
    filter.connect(g);
    g.connect(bus);
    rumble.start(now);

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 32;
    const droneG = ctx.createGain();
    droneG.gain.value = 0.0001;
    this.depthDroneGain = droneG;
    drone.connect(droneG);
    droneG.connect(bus);
    drone.start(now);

    this.ambientNodes.push(rumble, filter, g, drone, droneG);
  }

  private applyPresence(id: OceanPresence, amount: number) {
    const bus = this.presenceGain.get(id);
    if (!bus || !this.ctx) return;
    // Gentle curve so presence comes in earlier / louder
    const curved = amount * (0.35 + 0.65 * amount);
    const peaks: Record<OceanPresence, number> = {
      plane: 1.35,
      boat: 1.05,
      sub: 1.2,
      whale: 1.15,
      gulls: 1,
    };
    rampGain(bus, curved * peaks[id], this.ctx, 0.4);
  }

  private applyDepth(amount: number) {
    if (!this.ctx) return;
    if (this.depthGain) {
      const bed = Math.max(0, (amount - 0.08) / 0.92);
      rampGain(this.depthGain, bed * 1.15, this.ctx, 0.5);
    }
    if (this.depthDroneGain) {
      rampGain(this.depthDroneGain, amount * 0.16, this.ctx, 0.5);
    }
    if (this.depthFilter) {
      const now = this.ctx.currentTime;
      const hz = 110 - amount * 70;
      this.depthFilter.frequency.cancelScheduledValues(now);
      this.depthFilter.frequency.setTargetAtTime(hz, now, 0.4);
    }
    if (this.baseNoiseFilter) {
      const now = this.ctx.currentTime;
      // Surface bright → deep muffled
      const hz = 480 - amount * 280;
      this.baseNoiseFilter.frequency.cancelScheduledValues(now);
      this.baseNoiseFilter.frequency.setTargetAtTime(hz, now, 0.5);
    }
  }

  private makeNoiseSource() {
    const ctx = this.ctx!;
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    return noise;
  }

  private stopAmbience(fade = true) {
    if (this.bubbleTimer) {
      clearInterval(this.bubbleTimer);
      this.bubbleTimer = null;
    }
    if (this.gullCryTimer) {
      clearInterval(this.gullCryTimer);
      this.gullCryTimer = null;
    }
    if (this.whaleCallTimer) {
      clearInterval(this.whaleCallTimer);
      this.whaleCallTimer = null;
    }
    this.presenceGain.clear();
    this.depthGain = null;
    this.depthFilter = null;
    this.depthDroneGain = null;
    this.baseNoiseFilter = null;

    const ctx = this.ctx;
    const gain = this.ambienceGain;
    if (ctx && gain && fade) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      window.setTimeout(() => this.killAmbientNodes(), 400);
    } else {
      this.killAmbientNodes();
      if (gain) gain.gain.value = 0;
    }
  }

  private killAmbientNodes() {
    for (const node of this.ambientNodes) {
      try {
        if ("stop" in node && typeof node.stop === "function") {
          node.stop();
        }
        node.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.ambientNodes = [];
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    dest: AudioNode,
  ) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  private coinArp(t: number, rich: boolean) {
    if (!this.sfxGain) return;
    const notes = rich
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      this.tone(
        f,
        t + i * 0.07,
        rich ? 0.35 : 0.22,
        "triangle",
        0.22,
        this.sfxGain!,
      );
      this.tone(f * 2, t + i * 0.07, 0.18, "sine", 0.08, this.sfxGain!);
    });
  }

  private foghorn(t: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.38, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.4);
    this.tone(165, t + 0.05, 1.1, "sine", 0.12, this.sfxGain);
  }

  private planeBuzz(t: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(240, t + 0.25);
    osc.frequency.linearRampToValueAtTime(160, t + 0.55);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500;
    filter.Q.value = 2;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  private sparkle(t: number, base: number) {
    if (!this.sfxGain) return;
    this.tone(base, t, 0.28, "sine", 0.16, this.sfxGain);
    this.tone(base * 1.5, t + 0.04, 0.22, "triangle", 0.1, this.sfxGain);
    this.tone(base * 2, t + 0.08, 0.18, "sine", 0.06, this.sfxGain);
  }

  private softChime(t: number) {
    if (!this.sfxGain) return;
    this.tone(440, t, 0.35, "sine", 0.15, this.sfxGain);
    this.tone(554.37, t + 0.08, 0.4, "sine", 0.12, this.sfxGain);
  }

  private blip(t: number, freq: number) {
    if (!this.sfxGain) return;
    this.tone(freq, t, 0.12, "triangle", 0.14, this.sfxGain);
  }

  private softBubble() {
    if (!this.ctx || !this.ambienceGain || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    const f0 = 280 + Math.random() * 420 - this.depthAmount * 80;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(80, f0 * 1.55),
      t + 0.12,
    );
    const peak = 0.06 + this.depthAmount * 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g);
    g.connect(this.ambienceGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  private gullCry() {
    if (!this.ctx || !this.ambienceGain) return;
    const bus = this.presenceGain.get("gulls");
    if (!bus) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "triangle";
    const f0 = 880 + Math.random() * 220;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f0 * 1.35, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.85, t + 0.28);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  private whaleCall() {
    if (!this.ctx) return;
    const bus = this.presenceGain.get("whale");
    if (!bus) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(55, t + 1.6);
    osc.frequency.linearRampToValueAtTime(70, t + 2.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.12, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 2.7);
  }
}

export const oceanAudio = new OceanAudioEngine();
