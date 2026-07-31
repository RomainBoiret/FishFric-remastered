"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { oceanAudio } from "@/lib/oceanAudio";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
] as const;

const WORD_EGGS: { word: string; tone: "gold" | "teal" | "coral" }[] = [
  { word: "fric", tone: "gold" },
  { word: "reef", tone: "teal" },
  { word: "doubloon", tone: "coral" },
];

const SPARK_COLORS = [
  "#f0c040",
  "#ffe08a",
  "#5ec8e8",
  "#e05a9a",
  "#7ed957",
  "#ffffff",
] as const;

const GEM_PALETTE = [
  { color: "#5ec8e8", glow: "rgba(94, 200, 232, 0.75)" }, // sapphire
  { color: "#7ed957", glow: "rgba(126, 217, 87, 0.7)" }, // emerald
  { color: "#e05a9a", glow: "rgba(224, 90, 154, 0.7)" }, // ruby
  { color: "#c9a0ff", glow: "rgba(201, 160, 255, 0.75)" }, // amethyst
  { color: "#f0c040", glow: "rgba(240, 192, 64, 0.75)" }, // topaz
  { color: "#ff8f70", glow: "rgba(255, 143, 112, 0.7)" }, // coral
  { color: "#ffffff", glow: "rgba(255, 255, 255, 0.65)" }, // diamond
] as const;

type EggSpark = {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
  rot: number;
  size: number;
};

type RainGem = {
  id: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  sway: number;
  color: string;
  glow: string;
  spin: number;
  shape: "diamond" | "hex" | "cut";
};

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

function makeSparks(count: number, spread = 42): EggSpark[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const dist = 18 + Math.random() * spread;
    return {
      id: `${Date.now()}-${i}-${Math.random()}`,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 10,
      color: SPARK_COLORS[i % SPARK_COLORS.length]!,
      delay: i * 0.03,
      rot: -50 + Math.random() * 100,
      size: 5 + (i % 3) * 2,
    };
  });
}

const GEM_SHAPES = ["diamond", "hex", "cut"] as const;

function makeRainGems(count: number): RainGem[] {
  return Array.from({ length: count }, (_, i) => {
    const gem = GEM_PALETTE[i % GEM_PALETTE.length]!;
    return {
      id: `${Date.now()}-${i}-${Math.random()}`,
      left: 2 + Math.random() * 96,
      size: 12 + Math.floor(Math.random() * 14),
      delay: Math.random() * 1.4,
      duration: 3.6 + Math.random() * 1.8,
      sway: 16 + Math.random() * 28,
      color: gem.color,
      glow: gem.glow,
      spin: 0.55 + Math.random() * 0.75,
      shape: GEM_SHAPES[i % GEM_SHAPES.length]!,
    };
  });
}

function LocalSparks({ sparks }: { sparks: EggSpark[] }) {
  return sparks.map((p) => (
    <span
      key={p.id}
      className="ff-egg-spark"
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
  ));
}

/** Console + keyboard eggs + konami gem rain (sky → sand, page space). */
export function EasterEggsHost() {
  const konamiIdx = useRef(0);
  const typed = useRef("");
  const [mounted, setMounted] = useState(false);
  const [gems, setGems] = useState<RainGem[] | null>(null);
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line no-console
    console.log(
      "%c><(((º>  Fish&Fric  <º)))><",
      "color:#e0aa2c;font-weight:bold;font-size:14px;",
    );
    // eslint-disable-next-line no-console
    console.log(
      "%cPsst - try the chest, the plane, the boat, a starfish… or type reef. Flip the speaker icon for ocean sounds.",
      "color:#5ec8e8;",
    );
  }, []);

  const startRain = useCallback(() => {
    const root =
      (document.querySelector("[data-ff-atmosphere]") as HTMLElement | null) ??
      null;
    setStage(root);
    setGems(makeRainGems(34));
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setGems(null);
      setStage(null);
    }, 7800);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) {
        konamiIdx.current = 0;
        typed.current = "";
        return;
      }

      if (e.code === KONAMI[konamiIdx.current]) {
        konamiIdx.current += 1;
        if (konamiIdx.current >= KONAMI.length) {
          konamiIdx.current = 0;
          document.body.classList.add("ff-egg-konami");
          window.setTimeout(
            () => document.body.classList.remove("ff-egg-konami"),
            1800,
          );
          oceanAudio.play("konami");
          startRain();
        }
      } else {
        konamiIdx.current = e.code === KONAMI[0] ? 1 : 0;
      }

      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        typed.current = (typed.current + e.key.toLowerCase()).slice(-12);
        for (const egg of WORD_EGGS) {
          if (typed.current.endsWith(egg.word)) {
            typed.current = "";
            document.body.classList.add(`ff-egg-word-${egg.tone}`);
            window.setTimeout(
              () => document.body.classList.remove(`ff-egg-word-${egg.tone}`),
              1600,
            );
            oceanAudio.play(egg.word === "doubloon" ? "konami" : "chime");
            if (egg.word === "doubloon") startRain();
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [startRain]);

  if (!mounted || !gems || !stage) return null;

  return createPortal(
    <div className="ff-egg-rain" aria-hidden>
      {gems.map((g) => (
        <span
          key={g.id}
          className="ff-egg-rain-gem"
          style={
            {
              left: `${g.left}%`,
              width: g.size,
              height: g.size,
              animationDelay: `${g.delay}s`,
              animationDuration: `${g.duration}s`,
              "--ff-gem-sway": `${g.sway}px`,
              "--ff-gem-spin": String(g.spin),
              "--ff-gem-glow": g.glow,
              "--ff-gem-delay": `${g.delay}s`,
              "--ff-gem-duration": `${g.duration}s`,
            } as CSSProperties
          }
        >
          <span
            className={`ff-egg-rain-gem-facet is-${g.shape}`}
            style={{ background: g.color }}
          />
        </span>
      ))}
    </div>,
    stage,
  );
}

/** Tow plane - tip + sparks on click. */
export function EggBannerPlane() {
  const [active, setActive] = useState(false);
  const [sparks, setSparks] = useState<EggSpark[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClick = () => {
    setActive(true);
    setSparks(makeSparks(12, 36));
    oceanAudio.play("plane");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setActive(false);
      setSparks([]);
    }, 1600);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div
      className={`ff-tow-lane ff-px-plane absolute inset-x-0 z-[1] ${
        active ? "is-egg-hailed" : ""
      }`}
      style={{
        top: "4.5rem",
        height: "clamp(3.75rem, 11vw, 5.25rem)",
      }}
      role="img"
      aria-label="Reef Update · Faune & Flore"
    >
      <div className="ff-tow-cruise" style={{ animationDelay: "-8s" }} data-ff-sound="plane">
        <div className="ff-tow-compose">
          <div className="ff-tow-banner" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/tow-banner-only.png"
              alt=""
              width={800}
              height={71}
              className="ff-tow-banner-sprite"
              draggable={false}
            />
          </div>
          <div className="ff-tow-plane">
            <div className="ff-tow-plane-tilt relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/tow-plane-only.png"
                alt=""
                width={143}
                height={71}
                className="ff-tow-plane-sprite"
                draggable={false}
              />
              <span className="ff-tow-prop" aria-hidden />
              <LocalSparks sparks={sparks} />
              <button
                type="button"
                className="ff-egg-hit"
                onClick={onClick}
                title="The engine purrs a little louder…"
                aria-label="Secret: hail the tow plane"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Invisible hit target over the fishing boat - ripples + foghorn. */
export function EggBoatHit() {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClick = () => {
    setActive(true);
    document.body.classList.add("ff-egg-boat-hail");
    oceanAudio.play("foghorn");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setActive(false);
      document.body.classList.remove("ff-egg-boat-hail");
    }, 1800);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      document.body.classList.remove("ff-egg-boat-hail");
    },
    [],
  );

  return (
    <button
      type="button"
      className={`ff-egg-boat ff-boat-anchor absolute z-[2] ${
        active ? "is-egg-hailed" : ""
      }`}
      onClick={onClick}
      title="Someone’s on the radio…"
      aria-label="Secret: hail Belle Isle"
    >
      <span
        className="ff-boat-float relative block w-full"
        style={{ aspectRatio: "128 / 56" }}
        aria-hidden
      >
        <span className="ff-egg-ripple ff-egg-ripple-a" />
        <span className="ff-egg-ripple ff-egg-ripple-b" />
        <span className="ff-egg-horn">bwomp</span>
      </span>
    </button>
  );
}

/** Clickable starfish - spin + wish sparks. */
export function EggStarfish({
  left,
  bottom,
  color = "#ff8f70",
}: {
  left: string;
  bottom: string;
  color?: string;
}) {
  const labelId = useId();
  const [wishing, setWishing] = useState(false);
  const [sparks, setSparks] = useState<EggSpark[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClick = () => {
    setWishing(true);
    setSparks(makeSparks(14, 48));
    oceanAudio.play("wish");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setWishing(false);
      setSparks([]);
    }, 1600);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      className={`ff-egg-starfish absolute z-[2] ${wishing ? "is-wishing" : ""}`}
      style={{ left, bottom }}
      onClick={onClick}
      title="Make a reef wish"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="ff-sr-only">
        Secret: wish on a starfish
      </span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
        aria-hidden
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="4" y="0" width="2" height="3" fill={color} />
        <rect x="0" y="4" width="3" height="2" fill={color} />
        <rect x="7" y="4" width="3" height="2" fill={color} />
        <rect x="1" y="7" width="2" height="3" fill={color} />
        <rect x="7" y="7" width="2" height="3" fill={color} />
        <rect x="3" y="3" width="4" height="4" fill={color} />
        <rect x="4" y="4" width="2" height="2" fill="#ffe0c8" opacity="0.7" />
      </svg>
      <LocalSparks sparks={sparks} />
      {wishing ? (
        <span className="ff-egg-wish" aria-hidden>
          +1
        </span>
      ) : null}
    </button>
  );
}

const BRAND_CLICKS = 5;
const BRAND_WINDOW_MS = 2200;

/** Brand link - blink animation after several quick clicks. */
export function EggBrandLink({
  href,
  className,
  children,
  "aria-current": ariaCurrent,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | undefined;
}) {
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blink, setBlink] = useState(false);

  const onClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (timer.current) clearTimeout(timer.current);
    clicks.current += 1;
    if (clicks.current >= BRAND_CLICKS) {
      e.preventDefault();
      clicks.current = 0;
      setBlink(true);
      oceanAudio.play("brand");
      window.setTimeout(() => setBlink(false), 1400);
      return;
    }
    timer.current = setTimeout(() => {
      clicks.current = 0;
    }, BRAND_WINDOW_MS);
  }, []);

  return (
    <Link
      href={href}
      className={`${className ?? ""} ${blink ? "ff-egg-brand-blink" : ""}`}
      aria-current={ariaCurrent}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
