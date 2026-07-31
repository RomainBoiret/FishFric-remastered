"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

const LOOT = [
  {
    title: "+1 doubloon",
    body: "Credited to Belle Isle. Ledger balanced.",
  },
  {
    title: "Shark Card ping",
    body: "Declined: item too shiny for the reef.",
  },
  {
    title: "HMAC seal",
    body: "Treasure signed. One-time clear only.",
  },
  {
    title: "P2P bottle",
    body: "Returned full of coins. Question: “Who clicked?”",
  },
  {
    title: "Idle loot",
    body: "Found in the tide log between transfers.",
  },
  {
    title: "Cheque catch",
    body: "Face amount = ∞ sparkles. Payee: you.",
  },
  {
    title: "Savings flex",
    body: "APR 0.0% - pride: 100%.",
  },
  {
    title: "Reef approves",
    body: "All entries reconcile. The ocean is calm.",
  },
] as const;

const JACKPOT = {
  title: "Jackpot · Belle Isle vault",
  body: "You cracked the idle chest. ∞ doubloons credited (demo only). The reef will never forget this click.",
};

const SPARK_COLORS = [
  "#f0c040",
  "#ffe08a",
  "#5ec8e8",
  "#e05a9a",
  "#7ed957",
  "#ffffff",
] as const;

type Particle = {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
  rot: number;
  size: number;
  kind: "coin" | "gem" | "star";
};

type TreasureChestProps = {
  left?: string;
  bottom?: string;
};

const JACKPOT_AT = 5;
const STORAGE_KEY = "ff-chest-opens";

export function TreasureChest({
  left = "46%",
  bottom = "4.25rem",
}: TreasureChestProps) {
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [burst, setBurst] = useState(false);
  const [combo, setCombo] = useState(0);
  const [loot, setLoot] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [particles, setParticles] = useState<Particle[]>([]);
  const [jackpot, setJackpot] = useState(false);
  const [mounted, setMounted] = useState(false);
  const opens = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = Number(sessionStorage.getItem(STORAGE_KEY) || "0");
      if (Number.isFinite(saved) && saved > 0) {
        opens.current = saved;
        setIsOpen(true);
      }
    } catch {
      /* ignore */
    }
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (comboTimer.current) clearTimeout(comboTimer.current);
    };
  }, []);

  const spawnParticles = useCallback((count: number, big: boolean) => {
    const next: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * (0.15 + Math.random() * 0.7)) * (Math.random() < 0.5 ? 1 : -1);
      const dist = (big ? 36 : 22) + Math.random() * (big ? 48 : 28);
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        x: Math.cos(angle) * dist * (Math.random() < 0.5 ? -1 : 1),
        y: -Math.abs(Math.sin(angle) * dist) - 8 - Math.random() * 24,
        color: SPARK_COLORS[i % SPARK_COLORS.length],
        delay: i * 0.025,
        rot: -40 + Math.random() * 80,
        size: big ? 7 + (i % 3) * 2 : 5 + (i % 2) * 2,
        kind: (["coin", "gem", "star"] as const)[i % 3],
      };
    });
    setParticles(next);
  }, []);

  const onOpenLoot = useCallback(() => {
    opens.current += 1;
    try {
      sessionStorage.setItem(STORAGE_KEY, String(opens.current));
    } catch {
      /* ignore */
    }

    setIsOpen(true);
    setBurst(true);

    const nextCombo = combo + 1;
    setCombo(nextCombo);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 2200);

    const isJackpot =
      opens.current === JACKPOT_AT ||
      (opens.current > JACKPOT_AT && opens.current % 8 === 0);

    if (isJackpot) {
      setLoot(JACKPOT);
      spawnParticles(22, true);
      setJackpot(true);
    } else {
      const entry = LOOT[(opens.current - 1) % LOOT.length];
      setLoot(entry);
      spawnParticles(10 + Math.min(nextCombo, 6), false);
    }

    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setBurst(false);
      setLoot(null);
      setParticles([]);
    }, isJackpot ? 4200 : 2800);
  }, [combo, spawnParticles]);

  const closeJackpot = useCallback(() => setJackpot(false), []);

  useEffect(() => {
    if (!jackpot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeJackpot();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jackpot, closeJackpot]);

  return (
    <div
      className="absolute z-[2]"
      style={{ left, bottom }}
    >
      <button
        type="button"
        className={`ff-chest-hit ff-chest-glow ${burst ? "ff-chest-pop" : ""} ${
          isOpen ? "" : "ff-chest-is-closed"
        }`}
        onClick={onOpenLoot}
        aria-labelledby={labelId}
        title="Tap for loot"
      >
        <span id={labelId} className="ff-sr-only">
          Secret treasure chest - click for loot
        </span>
        <svg
          width="64"
          height="52"
          viewBox="0 0 28 22"
          shapeRendering="crispEdges"
          style={{ imageRendering: "pixelated" }}
          aria-hidden
        >
          <rect x="2" y="20" width="24" height="2" fill="#071218" opacity="0.45" />
          <rect x="3" y="10" width="22" height="10" fill="#8a5a1a" />
          <rect x="4" y="11" width="20" height="8" fill="#b8860b" />
          <rect x="3" y="14" width="22" height="2" fill="#e0aa2c" />
          <rect x="12" y="13" width="4" height="4" fill="#f0c040" />
          <rect x="13" y="14" width="2" height="2" fill="#5a3a10" />
          {isOpen ? (
            <g>
              <rect x="4" y="1" width="20" height="5" fill="#8a5a1a" />
              <rect x="5" y="2" width="18" height="3" fill="#6a4210" />
              <rect x="10" y="3" width="3" height="3" fill="#ffe08a" />
              <rect x="14" y="4" width="2" height="2" fill="#5ec8e8" />
              <rect x="16" y="3" width="2" height="2" fill="#e05a9a" />
            </g>
          ) : (
            <g>
              <rect x="3" y="6" width="22" height="5" fill="#a06a1a" />
              <rect x="4" y="7" width="20" height="3" fill="#c9962e" />
            </g>
          )}
          <rect x="3" y="9" width="22" height="1" fill="#5a3a10" />
          <rect x="3" y="18" width="22" height="1" fill="#5a3a10" />
        </svg>
      </button>

      {combo > 1 ? (
        <span className="ff-chest-combo" aria-hidden>
          x{combo}
        </span>
      ) : null}

      {particles.map((p) => (
        <span
          key={p.id}
          className={`ff-chest-spark ff-chest-spark-${p.kind}`}
          style={
            {
              "--ff-spark-x": `${p.x}px`,
              "--ff-spark-y": `${p.y}px`,
              "--ff-spark-rot": `${p.rot}deg`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              background: p.color,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}

      {loot ? (
        <div className="ff-chest-loot" role="status" aria-live="polite">
          <p className="ff-chest-loot-title">{loot.title}</p>
          <p className="ff-chest-loot-body">{loot.body}</p>
        </div>
      ) : null}

      {mounted && jackpot
        ? createPortal(
            <div className="ff-chest-jackpot" role="dialog" aria-modal="true">
              <button
                type="button"
                className="ff-chest-jackpot-backdrop"
                aria-label="Close"
                onClick={closeJackpot}
              />
              <div className="ff-chest-jackpot-card">
                <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
                  Easter egg
                </p>
                <h2 className="ff-display text-2xl text-white sm:text-3xl">
                  {JACKPOT.title}
                </h2>
                <p className="ff-docs-copy text-base">{JACKPOT.body}</p>
                <div className="ff-chest-jackpot-coins" aria-hidden>
                  {Array.from({ length: 12 }, (_, i) => (
                    <span
                      key={i}
                      className="ff-chest-jackpot-coin"
                      style={{
                        left: `${8 + (i % 6) * 15}%`,
                        animationDelay: `${i * 0.08}s`,
                        background: SPARK_COLORS[i % SPARK_COLORS.length],
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="ff-btn ff-btn-danger"
                  onClick={closeJackpot}
                >
                  Stash it
                  <span aria-hidden> ›</span>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
