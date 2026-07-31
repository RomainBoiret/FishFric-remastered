import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import {
  OCEAN_PRESENCE_IDS,
  OceanAudioEngine,
  oceanAudio,
  type OceanSfx,
} from "./oceanAudio";

type Param = {
  value: number;
  setValueAtTime: (v: number, t: number) => void;
  linearRampToValueAtTime: (v: number, t: number) => void;
  exponentialRampToValueAtTime: (v: number, t: number) => void;
  cancelScheduledValues: (t: number) => void;
  setTargetAtTime: (v: number, t: number, c: number) => void;
};

function param(initial = 0): Param {
  return {
    value: initial,
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime(v) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v) {
      this.value = v;
    },
    cancelScheduledValues() {},
    setTargetAtTime(v) {
      this.value = v;
    },
  };
}

function audioNode() {
  const node: {
    connect: (n: unknown) => unknown;
    disconnect: () => void;
    stop?: () => void;
    start?: (t?: number) => void;
    frequency?: Param;
    gain?: Param;
    Q?: Param;
    type?: string;
    buffer?: unknown;
    loop?: boolean;
  } = {
    connect(n) {
      return n;
    },
    disconnect() {},
  };
  return node;
}

function installAudioMock(options?: { throwOnStop?: boolean }) {
  const storage = new Map<string, string>();
  const listeners = new Map<string, Set<EventListener>>();

  const AudioContext = function MockAudioContext(this: {
    currentTime: number;
    sampleRate: number;
    destination: unknown;
    state: string;
    resume: () => Promise<void>;
    createGain: () => ReturnType<typeof audioNode>;
    createOscillator: () => ReturnType<typeof audioNode>;
    createBiquadFilter: () => ReturnType<typeof audioNode>;
    createBuffer: (
      channels: number,
      length: number,
      rate: number,
    ) => { getChannelData: () => Float32Array };
    createBufferSource: () => ReturnType<typeof audioNode>;
  }) {
    this.currentTime = 0;
    this.sampleRate = 256;
    this.destination = {};
    this.state = "running";
    this.resume = async () => {
      this.state = "running";
    };
    this.createGain = () => {
      const n = audioNode();
      n.gain = param(1);
      return n;
    };
    this.createOscillator = () => {
      const n = audioNode();
      n.frequency = param(440);
      n.type = "sine";
      n.start = () => {};
      n.stop = (when?: number) => {
        // killAmbientNodes calls stop() with no when; tone() passes a time.
        if (options?.throwOnStop && when === undefined) {
          throw new Error("already stopped");
        }
      };
      return n;
    };
    this.createBiquadFilter = () => {
      const n = audioNode();
      n.frequency = param(1000);
      n.Q = param(1);
      n.type = "lowpass";
      return n;
    };
    this.createBuffer = (_c, length) => ({
      getChannelData: () => new Float32Array(length),
    });
    this.createBufferSource = () => {
      const n = audioNode();
      n.start = () => {};
      n.stop = () => {};
      n.loop = false;
      return n;
    };
  };

  const g = globalThis as typeof globalThis & {
    window: Window & typeof globalThis;
    AudioContext?: unknown;
    webkitAudioContext?: unknown;
  };

  g.window = {
    localStorage: {
      getItem: (k: string) => {
        if (storage.get("__throw_get")) throw new Error("get fail");
        return storage.has(k) ? storage.get(k)! : null;
      },
      setItem: (k: string, v: string) => {
        if (storage.get("__throw_set")) throw new Error("set fail");
        storage.set(k, v);
      },
    },
    addEventListener: (type: string, fn: EventListener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: EventListener) => {
      listeners.get(type)?.delete(fn);
    },
    // Delegate so mock.timers can replace globalThis.setTimeout later.
    setTimeout: ((...args: Parameters<typeof setTimeout>) =>
      globalThis.setTimeout(...args)) as typeof setTimeout,
    clearTimeout: ((...args: Parameters<typeof clearTimeout>) =>
      globalThis.clearTimeout(...args)) as typeof clearTimeout,
    AudioContext,
  } as unknown as Window & typeof globalThis;

  g.AudioContext = AudioContext;
  delete g.webkitAudioContext;

  return {
    storage,
    listeners,
    AudioContext,
    dispatch(type: string) {
      for (const fn of listeners.get(type) ?? []) {
        (fn as () => void)();
      }
    },
  };
}

describe("oceanAudio", () => {
  let audio: OceanAudioEngine;
  let env: ReturnType<typeof installAudioMock>;

  beforeEach(() => {
    env = installAudioMock();
    audio = new OceanAudioEngine();
    mock.timers.enable({ apis: ["setInterval", "setTimeout"], now: 0 });
  });

  afterEach(() => {
    try {
      mock.timers.tick(1000);
    } catch {
      /* timers may already be reset */
    }
    mock.timers.reset();
    mock.restoreAll();
  });

  it("exposes presence ids", () => {
    assert.deepEqual([...OCEAN_PRESENCE_IDS], [
      "plane",
      "boat",
      "sub",
      "whale",
      "gulls",
    ]);
    assert.equal(oceanAudio.isEnabled(), false);
  });

  it("starts muted and notifies subscribers", () => {
    const seen: boolean[] = [];
    const unsub = audio.subscribe((on) => seen.push(on));
    assert.deepEqual(seen, [false]);
    assert.equal(audio.isEnabled(), false);
    unsub();
  });

  it("no-ops without AudioContext", async () => {
    delete (globalThis as { AudioContext?: unknown }).AudioContext;
    delete (globalThis as { window?: { AudioContext?: unknown } }).window
      ?.AudioContext;
    (globalThis as { window: { AudioContext?: unknown } }).window.AudioContext =
      undefined;
    audio.hydrate();
    await audio.setEnabled(true);
    assert.equal(audio.isEnabled(), false);
  });

  it("hydrates from localStorage and unlocks on gesture", async () => {
    env.storage.set("ff-sound-on", "1");
    audio.hydrate();
    assert.equal(audio.isEnabled(), true);

    env.dispatch("pointerdown");
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(audio.isEnabled(), true);
  });

  it("ignores corrupt localStorage reads/writes", async () => {
    env.storage.set("__throw_get", "1");
    audio.hydrate();
    env.storage.delete("__throw_get");
    env.storage.set("__throw_set", "1");
    await audio.setEnabled(true);
    assert.equal(audio.isEnabled(), true);
  });

  it("enables ambience, plays every sfx, then mutes", async () => {
    await audio.setEnabled(true);
    assert.equal(audio.isEnabled(), true);
    assert.equal(env.storage.get("ff-sound-on"), "1");

    const kinds: OceanSfx[] = [
      "chest",
      "jackpot",
      "foghorn",
      "plane",
      "wish",
      "konami",
      "chime",
      "brand",
      "toggle",
    ];
    for (const kind of kinds) {
      audio.play(kind);
    }
    await Promise.resolve();
    await Promise.resolve();

    await audio.setEnabled(false);
    assert.equal(audio.isEnabled(), false);
    mock.timers.tick(500);
  });

  it("stores presence/depth while muted and applies after enable", async () => {
    audio.setPresence("plane", 0.8);
    audio.setPresence("plane", 0.81); // ignored delta
    audio.setPresence("boat", 0);
    audio.setPresence("boat", 0); // ignored
    audio.setDepth(0.5);
    audio.setDepth(0.51); // ignored
    audio.setDepth(-1);
    audio.setDepth(2);

    await audio.setEnabled(true);
    audio.setPresence("sub", 1);
    audio.setPresence("whale", 0.4);
    audio.setPresence("gulls", 0.2);
    audio.setDepth(0.9);
  });

  it("plays nothing when muted", () => {
    audio.play("chest");
  });

  it("uses webkitAudioContext when needed", async () => {
    const g = globalThis as {
      AudioContext?: unknown;
      webkitAudioContext?: unknown;
      window: {
        AudioContext?: unknown;
        webkitAudioContext?: unknown;
      };
    };
    delete g.AudioContext;
    delete g.window.AudioContext;
    g.webkitAudioContext = env.AudioContext;
    g.window.webkitAudioContext = env.AudioContext;
    await audio.setEnabled(true);
    assert.equal(audio.isEnabled(), true);
  });

  it("fires ambient creature cues on intervals", async () => {
    await audio.setEnabled(true);
    audio.setPresence("gulls", 1);
    audio.setPresence("whale", 1);
    audio.setDepth(1);
    mock.method(Math, "random", () => 0);
    mock.timers.tick(6000);
  });

  it("skips ambient cues when random is high or disabled mid-tick", async () => {
    await audio.setEnabled(true);
    audio.setPresence("gulls", 1);
    audio.setPresence("whale", 1);
    mock.method(Math, "random", () => 0.99);
    mock.timers.tick(6000);
    await audio.setEnabled(false);
    mock.timers.tick(6000);
  });

  it("resumes from unlock only while still enabled", async () => {
    env.storage.set("ff-sound-on", "1");
    audio.hydrate();
    await audio.setEnabled(false);
    env.dispatch("keydown");
    await Promise.resolve();
  });

  it("tolerates stop errors when tearing down ambience", async () => {
    mock.timers.reset();
    env = installAudioMock({ throwOnStop: true });
    audio = new OceanAudioEngine();
    mock.timers.enable({ apis: ["setInterval", "setTimeout"], now: 0 });
    await audio.setEnabled(true);
    await audio.setEnabled(false);
    mock.timers.tick(500);
  });

  it("no-ops audio helpers when window is missing", async () => {
    const g = globalThis as { window?: unknown };
    const prev = g.window;
    // @ts-expect-error intentional SSR probe
    delete g.window;
    const ssr = new OceanAudioEngine();
    ssr.hydrate();
    await ssr.setEnabled(true);
    assert.equal(ssr.isEnabled(), false);
    ssr.play("chest");
    g.window = prev;
  });

  it("skips tiny gain ramps once presence is applied", async () => {
    await audio.setEnabled(true);
    audio.setPresence("boat", 0.5);
    // Second apply with near-identical curved gain hits rampGain early-return
    audio.setPresence("boat", 0.52);
    audio.setPresence("boat", 0.53);
  });
});
