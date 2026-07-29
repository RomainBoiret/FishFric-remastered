import { PixelFish } from "@/components/brand/PixelFish";

type AtmosphereProps = {
  variant?: "hero" | "app";
  className?: string;
};

const FISH = [
  { top: "28%", size: 16, color: "#ffe08a", fin: "#e0aa2c", duration: "24s", delay: "-4s", dir: "right" as const },
  { top: "34%", size: 20, color: "#5ec8e8", fin: "#2f6f9f", duration: "30s", delay: "-14s", dir: "left" as const },
  { top: "40%", size: 24, color: "#f2a63a", fin: "#e85d4c", duration: "26s", delay: "0s", dir: "right" as const },
  { top: "46%", size: 18, color: "#7ed957", fin: "#3c8527", duration: "38s", delay: "-8s", dir: "left" as const },
  { top: "50%", size: 30, color: "#e05a9a", fin: "#a03060", duration: "34s", delay: "-20s", dir: "right" as const },
  { top: "54%", size: 22, color: "#c9a0ff", fin: "#7a50b8", duration: "28s", delay: "-12s", dir: "left" as const },
  { top: "58%", size: 26, color: "#5ec8e8", fin: "#1a5a7a", duration: "42s", delay: "-26s", dir: "right" as const },
  { top: "62%", size: 14, color: "#f2a63a", fin: "#c87820", duration: "22s", delay: "-3s", dir: "left" as const },
  { top: "66%", size: 28, color: "#7ed957", fin: "#2d6b1a", duration: "36s", delay: "-16s", dir: "right" as const },
  { top: "70%", size: 20, color: "#ff8f70", fin: "#c44b3a", duration: "32s", delay: "-9s", dir: "left" as const },
  { top: "74%", size: 24, color: "#6ee0d0", fin: "#2d8f83", duration: "40s", delay: "-22s", dir: "right" as const },
  { top: "78%", size: 16, color: "#e05a9a", fin: "#8a2858", duration: "27s", delay: "-5s", dir: "left" as const },
  { top: "82%", size: 22, color: "#c9a0ff", fin: "#5a3088", duration: "35s", delay: "-18s", dir: "right" as const },
  { top: "86%", size: 18, color: "#ffe08a", fin: "#b8860b", duration: "29s", delay: "-11s", dir: "left" as const },
];

function Kelp({ left, height, delay }: { left: string; height: number; delay: string }) {
  return (
    <div
      className="ff-sway absolute bottom-[11%] flex flex-col-reverse items-center"
      style={{ left, animationDelay: delay }}
    >
      {Array.from({ length: height }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-3"
          style={{
            background: i % 2 === 0 ? "#2d8f4a" : "#247a3e",
            marginLeft: i % 2 === 0 ? 0 : 4,
          }}
        />
      ))}
    </div>
  );
}

/** Minecraft ocean biome: sky → sea → deep water + tropical fish */
export function Atmosphere({ variant = "app", className = "" }: AtmosphereProps) {
  const fish = variant === "hero" ? FISH : FISH.slice(0, 3);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 ${
          variant === "hero" ? "ff-hero-wash" : "ff-app-wash"
        }`}
      />
      <div className="ff-pixel-grid absolute inset-0 opacity-50" />

      {variant === "hero" ? (
        <>
          <div className="ff-bob absolute left-[8%] top-[8%] h-8 w-24 bg-white/70" />
          <div className="ff-bob absolute left-[10%] top-[10%] h-6 w-16 bg-white/70 [animation-delay:0.6s]" />
          <div className="ff-bob absolute right-[16%] top-[12%] h-7 w-28 bg-white/65 [animation-delay:1.2s]" />
          <div className="ff-bob absolute right-[28%] top-[7%] h-5 w-16 bg-white/55 [animation-delay:1.8s]" />

          <div className="ff-shimmer absolute inset-x-0 top-[22%] h-1 bg-white/35" />

          {/* Coral / reef blocks */}
          <div className="absolute bottom-[14%] left-[6%] h-10 w-10 bg-[#e05a9a]" />
          <div className="absolute bottom-[14%] left-[6%] h-4 w-4 translate-x-8 -translate-y-4 bg-[#f2a63a]" />
          <div className="absolute bottom-[14%] right-[12%] h-8 w-12 bg-[#2d8f83]" />
          <div className="absolute bottom-[14%] right-[12%] h-4 w-4 -translate-y-4 bg-[#5ec8e8]" />

          <Kelp left="18%" height={8} delay="0.2s" />
          <Kelp left="24%" height={11} delay="0.7s" />
          <Kelp left="72%" height={9} delay="0.4s" />
          <Kelp left="78%" height={6} delay="1s" />

          <div className="absolute inset-x-0 bottom-[8%] flex h-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1"
                style={{
                  background:
                    i % 3 === 0 ? "#d4c48a" : i % 2 === 0 ? "#c2b280" : "#b8a56e",
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      {fish.map((f, i) => (
        <div
          key={i}
          className={`ff-fish-lane ${
            f.dir === "right" ? "ff-fish-right" : "ff-fish-left"
          }`}
          style={{
            top: f.top,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
        >
          <PixelFish
            color={f.color}
            fin={f.fin}
            size={f.size}
            facing={f.dir}
          />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b1a22] to-transparent" />
    </div>
  );
}
