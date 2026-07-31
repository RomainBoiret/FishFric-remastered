/** Pixel-art ocean life for the Atmosphere backdrop (Minecraft-ish blocks). */

export function PixelKelp({
  left,
  height,
  delay = "0s",
  tone = "green",
}: {
  left: string;
  height: number;
  delay?: string;
  tone?: "green" | "dark" | "teal";
}) {
  const colors =
    tone === "dark"
      ? ["#1a5c34", "#144a2a"]
      : tone === "teal"
        ? ["#2d8f83", "#1f6b62"]
        : ["#2d8f4a", "#247a3e"];

  return (
    <div
      className="ff-sway absolute bottom-[4.25rem] z-[2] flex flex-col-reverse items-center"
      style={{ left, animationDelay: delay }}
    >
      {Array.from({ length: height }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-3"
          style={{
            background: colors[i % 2],
            marginLeft: i % 3 === 0 ? 0 : i % 3 === 1 ? 3 : -2,
            opacity: 0.75 + (i / height) * 0.25,
          }}
        />
      ))}
    </div>
  );
}

export function Jellyfish({
  top,
  left,
  size = 28,
  delay = "0s",
  color = "#c9a0ff",
}: {
  top: string;
  left: string;
  size?: number;
  delay?: string;
  color?: string;
}) {
  return (
    <div
      className="ff-jelly absolute opacity-70"
      style={{ top, left, animationDelay: delay }}
    >
      <svg
        width={size}
        height={size * 1.35}
        viewBox="0 0 12 16"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="3" y="1" width="6" height="1" fill={color} />
        <rect x="2" y="2" width="8" height="4" fill={color} />
        <rect x="3" y="6" width="6" height="1" fill={color} opacity="0.85" />
        <rect x="4" y="3" width="2" height="2" fill="#ffffff" opacity="0.35" />
        <rect x="3" y="7" width="1" height="7" fill={color} opacity="0.55" />
        <rect x="5" y="7" width="1" height="8" fill={color} opacity="0.45" />
        <rect x="7" y="7" width="1" height="6" fill={color} opacity="0.5" />
        <rect x="9" y="7" width="1" height="7" fill={color} opacity="0.4" />
      </svg>
    </div>
  );
}

export function Starfish({
  left,
  bottom,
  color = "#ff8f70",
}: {
  left: string;
  bottom: string;
  color?: string;
}) {
  return (
    <div className="absolute z-[2]" style={{ left, bottom }} aria-hidden>
      <svg
        width="20"
        height="20"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
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
    </div>
  );
}

export function Squid({
  top,
  delay = "0s",
  dir = "left",
}: {
  top: string;
  delay?: string;
  dir?: "left" | "right";
}) {
  return (
    <div
      className={`ff-fish-lane ${dir === "right" ? "ff-fish-right" : "ff-fish-left"} absolute opacity-75`}
      style={{ top, animationDuration: "48s", animationDelay: delay }}
    >
      <svg
        width="36"
        height="28"
        viewBox="0 0 18 14"
        shapeRendering="crispEdges"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        <rect x="6" y="2" width="8" height="6" fill="#c9a0ff" />
        <rect x="7" y="1" width="6" height="1" fill="#d4b0ff" />
        <rect x="14" y="3" width="3" height="4" fill="#a070d8" />
        <rect x="8" y="3" width="2" height="2" fill="#1b1b1b" />
        <rect x="9" y="3" width="1" height="1" fill="#ffffff" />
        <rect x="6" y="8" width="1" height="5" fill="#a070d8" />
        <rect x="8" y="8" width="1" height="6" fill="#c9a0ff" />
        <rect x="10" y="8" width="1" height="5" fill="#a070d8" />
        <rect x="12" y="8" width="1" height="6" fill="#c9a0ff" />
      </svg>
    </div>
  );
}

export function Shark({
  top,
  delay = "0s",
  dir = "right",
  size = 1,
}: {
  top: string;
  delay?: string;
  dir?: "left" | "right";
  size?: number;
}) {
  const w = 64 * size;
  const h = 28 * size;
  return (
    <div
      className={`ff-fish-lane ${dir === "right" ? "ff-fish-right" : "ff-fish-left"} absolute opacity-80`}
      style={{ top, animationDuration: "38s", animationDelay: delay }}
    >
      <svg
        width={w}
        height={h}
        viewBox="0 0 32 14"
        shapeRendering="crispEdges"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Body */}
        <rect x="4" y="5" width="20" height="5" fill="#6a7a88" />
        <rect x="6" y="4" width="16" height="2" fill="#7a8a98" />
        <rect x="6" y="9" width="16" height="2" fill="#5a6a78" />
        {/* Nose */}
        <rect x="24" y="6" width="5" height="3" fill="#6a7a88" />
        <rect x="28" y="7" width="2" height="1" fill="#5a6a78" />
        {/* Dorsal fin */}
        <rect x="12" y="1" width="3" height="4" fill="#5a6a78" />
        <rect x="13" y="0" width="2" height="2" fill="#4a5a68" />
        {/* Tail */}
        <rect x="1" y="3" width="3" height="2" fill="#5a6a78" />
        <rect x="0" y="5" width="4" height="3" fill="#4a5a68" />
        <rect x="1" y="8" width="3" height="2" fill="#5a6a78" />
        {/* Pectoral */}
        <rect x="14" y="10" width="5" height="2" fill="#5a6a78" />
        {/* Eye + gill */}
        <rect x="23" y="6" width="2" height="2" fill="#1b1b1b" />
        <rect x="21" y="6" width="1" height="3" fill="#4a5a68" />
        {/* Belly */}
        <rect x="8" y="8" width="10" height="1" fill="#c8d0d8" />
      </svg>
    </div>
  );
}

export function Whale({
  top,
  delay = "0s",
  dir = "left",
}: {
  top: string;
  delay?: string;
  dir?: "left" | "right";
}) {
  return (
    <div
      className={`ff-fish-lane ${dir === "right" ? "ff-fish-right" : "ff-fish-left"} absolute opacity-70`}
      style={{ top, animationDuration: "70s", animationDelay: delay }}
    >
      <svg
        width="120"
        height="48"
        viewBox="0 0 60 24"
        shapeRendering="crispEdges"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Body */}
        <rect x="8" y="8" width="38" height="10" fill="#3a4a6a" />
        <rect x="12" y="6" width="30" height="4" fill="#4a5a7a" />
        <rect x="14" y="16" width="28" height="3" fill="#2a3a5a" />
        {/* Head */}
        <rect x="44" y="9" width="10" height="8" fill="#3a4a6a" />
        <rect x="52" y="11" width="5" height="5" fill="#4a5a7a" />
        {/* Eye */}
        <rect x="48" y="11" width="2" height="2" fill="#1b1b1b" />
        <rect x="49" y="11" width="1" height="1" fill="#ffffff" />
        {/* Tail */}
        <rect x="2" y="4" width="6" height="3" fill="#2a3a5a" />
        <rect x="0" y="7" width="8" height="5" fill="#3a4a6a" />
        <rect x="2" y="12" width="6" height="3" fill="#2a3a5a" />
        {/* Flipper */}
        <rect x="22" y="17" width="8" height="3" fill="#2a3a5a" />
        <rect x="24" y="19" width="5" height="2" fill="#1a2a4a" />
        {/* Spout puff */}
        <rect x="46" y="2" width="2" height="4" fill="#a8c0c9" opacity="0.55" />
        <rect x="44" y="1" width="3" height="2" fill="#c8d8e0" opacity="0.4" />
        <rect x="48" y="1" width="3" height="2" fill="#c8d8e0" opacity="0.4" />
        {/* Belly */}
        <rect x="16" y="14" width="22" height="2" fill="#8a9ab0" />
      </svg>
    </div>
  );
}

export function SeaTurtle({
  top,
  delay = "0s",
  dir = "right",
}: {
  top: string;
  delay?: string;
  dir?: "left" | "right";
}) {
  return (
    <div
      className={`ff-fish-lane ${dir === "right" ? "ff-fish-right" : "ff-fish-left"} absolute opacity-75`}
      style={{ top, animationDuration: "52s", animationDelay: delay }}
    >
      <svg
        width="48"
        height="28"
        viewBox="0 0 24 14"
        shapeRendering="crispEdges"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Shell */}
        <rect x="5" y="3" width="12" height="7" fill="#2d8f4a" />
        <rect x="7" y="2" width="8" height="2" fill="#3ca85a" />
        <rect x="7" y="4" width="3" height="3" fill="#1a6b34" />
        <rect x="12" y="4" width="3" height="3" fill="#247a3e" />
        <rect x="9" y="6" width="4" height="2" fill="#1a5c34" />
        {/* Head */}
        <rect x="17" y="5" width="4" height="3" fill="#7ed957" />
        <rect x="19" y="5" width="1" height="1" fill="#1b1b1b" />
        {/* Flippers */}
        <rect x="2" y="4" width="4" height="2" fill="#5ea83a" />
        <rect x="3" y="8" width="4" height="2" fill="#5ea83a" />
        <rect x="14" y="9" width="4" height="2" fill="#3c8527" />
        <rect x="8" y="10" width="3" height="2" fill="#3c8527" />
      </svg>
    </div>
  );
}

export function Stingray({
  top,
  delay = "0s",
  dir = "left",
}: {
  top: string;
  delay?: string;
  dir?: "left" | "right";
}) {
  return (
    <div
      className={`ff-fish-lane ${dir === "right" ? "ff-fish-right" : "ff-fish-left"} absolute opacity-65`}
      style={{ top, animationDuration: "44s", animationDelay: delay }}
    >
      <svg
        width="56"
        height="28"
        viewBox="0 0 28 14"
        shapeRendering="crispEdges"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Wings */}
        <rect x="4" y="5" width="16" height="4" fill="#7a50b8" />
        <rect x="6" y="3" width="12" height="3" fill="#9a70d0" />
        <rect x="8" y="2" width="8" height="2" fill="#c9a0ff" />
        <rect x="6" y="8" width="12" height="2" fill="#5a3088" />
        {/* Body / tail */}
        <rect x="10" y="4" width="6" height="5" fill="#8a60c0" />
        <rect x="20" y="6" width="6" height="2" fill="#6a40a0" />
        <rect x="25" y="5" width="2" height="1" fill="#5a3088" />
        {/* Eyes */}
        <rect x="11" y="4" width="1" height="1" fill="#1b1b1b" />
        <rect x="14" y="4" width="1" height="1" fill="#1b1b1b" />
      </svg>
    </div>
  );
}

/** Yellow submarine cruising mid-depth. */
export function YellowSubmarine({
  top,
  delay = "0s",
  dir = "right",
}: {
  top: string;
  delay?: string;
  dir?: "left" | "right";
}) {
  return (
    <div
      className={`ff-fish-lane ${dir === "right" ? "ff-fish-right" : "ff-fish-left"} absolute opacity-90`}
      style={{ top, animationDuration: "56s", animationDelay: delay }}
    >
      <svg
        width="140"
        height="70"
        viewBox="0 0 44 22"
        shapeRendering="crispEdges"
        className="h-14 w-auto sm:h-[4.5rem]"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* Hull */}
        <rect x="6" y="8" width="28" height="8" fill="#e0aa2c" />
        <rect x="8" y="7" width="24" height="2" fill="#f0c040" />
        <rect x="8" y="15" width="24" height="2" fill="#b8860b" />
        <rect x="10" y="16" width="20" height="1" fill="#8a6810" />
        {/* Nose */}
        <rect x="34" y="9" width="5" height="6" fill="#e0aa2c" />
        <rect x="38" y="10" width="3" height="4" fill="#f0c040" />
        {/* Conning tower */}
        <rect x="16" y="3" width="10" height="5" fill="#e0aa2c" />
        <rect x="17" y="2" width="8" height="2" fill="#f0c040" />
        {/* Periscope */}
        <rect x="22" y="0" width="2" height="3" fill="#5a6570" />
        <rect x="20" y="0" width="4" height="1" fill="#3a454f" />
        {/* Windows / portholes */}
        <rect x="12" y="10" width="3" height="3" fill="#5ec8e8" />
        <rect x="13" y="11" width="1" height="1" fill="#b8ecff" />
        <rect x="18" y="10" width="3" height="3" fill="#2f6f9f" />
        <rect x="19" y="11" width="1" height="1" fill="#5ec8e8" />
        <rect x="24" y="10" width="3" height="3" fill="#5ec8e8" />
        <rect x="25" y="11" width="1" height="1" fill="#b8ecff" />
        {/* Propeller */}
        <rect x="2" y="9" width="4" height="5" fill="#6a7580" />
        <rect x="1" y="8" width="2" height="2" fill="#8a95a0" />
        <rect x="1" y="13" width="2" height="2" fill="#8a95a0" />
        <rect x="0" y="10" width="2" height="3" fill="#4a5560" />
        {/* Fin */}
        <rect x="28" y="5" width="4" height="3" fill="#b8860b" />
        {/* Gold band */}
        <rect x="8" y="12" width="24" height="1" fill="#ffe08a" />
        {/* Tiny bubble trail */}
        <rect x="3" y="6" width="1" height="1" fill="#ffffff" opacity="0.45" />
        <rect x="1" y="4" width="1" height="1" fill="#ffffff" opacity="0.3" />
      </svg>
    </div>
  );
}

export function Crab({
  left,
  bottom,
  delay = "0s",
  dir = "right",
}: {
  left: string;
  bottom: string;
  delay?: string;
  dir?: "left" | "right";
}) {
  return (
    <div
      className={`ff-crab absolute z-[2] ${
        dir === "left" ? "ff-crab-left" : "ff-crab-right"
      }`}
      style={{ left, bottom, animationDelay: delay }}
      aria-hidden
    >
      <svg
        width="28"
        height="16"
        viewBox="0 0 14 8"
        shapeRendering="crispEdges"
        style={{
          imageRendering: "pixelated",
          transform: dir === "left" ? "scaleX(-1)" : undefined,
        }}
      >
        <rect x="3" y="2" width="8" height="4" fill="#e05a3a" />
        <rect x="4" y="1" width="6" height="1" fill="#f07050" />
        <rect x="5" y="3" width="1" height="1" fill="#1b1b1b" />
        <rect x="8" y="3" width="1" height="1" fill="#1b1b1b" />
        <rect x="0" y="1" width="3" height="1" fill="#c44b3a" />
        <rect x="0" y="2" width="1" height="2" fill="#c44b3a" />
        <rect x="11" y="1" width="3" height="1" fill="#c44b3a" />
        <rect x="13" y="2" width="1" height="2" fill="#c44b3a" />
        <rect x="3" y="6" width="1" height="2" fill="#a03828" />
        <rect x="6" y="6" width="1" height="2" fill="#a03828" />
        <rect x="9" y="6" width="1" height="2" fill="#a03828" />
      </svg>
    </div>
  );
}

export function Coral({
  left,
  bottom,
  palette = ["#e05a9a", "#f2a63a", "#5ec8e8"],
}: {
  left: string;
  bottom: string;
  palette?: [string, string, string];
}) {
  return (
    <div className="absolute z-[2]" style={{ left, bottom }} aria-hidden>
      <div className="relative h-12 w-14">
        <div
          className="absolute bottom-0 left-1 h-10 w-4"
          style={{ background: palette[0] }}
        />
        <div
          className="absolute bottom-6 left-3 h-4 w-4"
          style={{ background: palette[1] }}
        />
        <div
          className="absolute bottom-0 left-6 h-7 w-5"
          style={{ background: palette[2] }}
        />
        <div
          className="absolute bottom-5 left-8 h-3 w-3"
          style={{ background: palette[0] }}
        />
      </div>
    </div>
  );
}

export function Bubble({
  left,
  size,
  delay,
  duration,
  bottom = "4.25rem",
}: {
  left: string;
  size: number;
  delay: string;
  duration: string;
  bottom?: string;
}) {
  return (
    <div
      className="ff-bubble absolute z-[2] rounded-none border border-white/35 bg-white/20"
      style={{
        left,
        bottom,
        width: size,
        height: size,
        animationDelay: delay,
        animationDuration: duration,
      }}
    />
  );
}

/** Sand packed to the page bottom so it never floats.
 *  Total height must stay in sync with FLOOR in Atmosphere (4.25rem).
 */
export function Seabed() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[1] h-[4.25rem]">
      {/* Bright sand surface (top) */}
      <div className="flex h-4 w-full">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{
              background:
                i % 4 === 0
                  ? "#d4c48a"
                  : i % 3 === 0
                    ? "#e0d4a0"
                    : i % 2 === 0
                      ? "#c2b280"
                      : "#b8a56e",
            }}
          />
        ))}
      </div>
      <div className="flex h-5 w-full">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{
              background:
                i % 3 === 0
                  ? "#a89860"
                  : i % 2 === 0
                    ? "#8a7a4e"
                    : "#9a8a58",
            }}
          />
        ))}
      </div>
      <div className="flex h-8 w-full">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{
              background:
                i % 4 === 0
                  ? "#6e6140"
                  : i % 2 === 0
                    ? "#5a5030"
                    : "#4a4030",
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-[3.15rem] left-[8%] h-2 w-3 bg-[#6a7a82]/80" />
      <div className="absolute bottom-[3.05rem] left-[32%] h-2 w-2 bg-[#5a6a72]/80" />
      <div className="absolute bottom-[3.2rem] right-[22%] h-2 w-4 bg-[#7a8a92]/80" />
      <div className="absolute bottom-[3.1rem] right-[40%] h-2 w-2 bg-[#4a5a62]/80" />
    </div>
  );
}

export function LightRays() {
  return (
    <div className="ff-rays pointer-events-none absolute inset-x-0 top-0 h-[50%] opacity-25" />
  );
}

type PixelCloudProps = {
  variant?: "a" | "b" | "c";
  className?: string;
};

/** Soft indie pixel cloud (Stardew / Emerald / Sea of Stars vibe). */
function PixelCloud({ variant = "a", className = "" }: PixelCloudProps) {
  const tone = {
    hi: "#ffffff",
    mid: "#f4f9fd",
    shade: "#d8e8f4",
    deep: "#b7d0e4",
  };

  if (variant === "b") {
    return (
      <svg
        className={className}
        width="88"
        height="40"
        viewBox="0 0 88 40"
        shapeRendering="crispEdges"
        aria-hidden
      >
        <rect x="22" y="14" width="44" height="12" fill={tone.shade} />
        <rect x="14" y="10" width="52" height="10" fill={tone.mid} />
        <rect x="28" y="4" width="36" height="10" fill={tone.hi} />
        <rect x="34" y="2" width="20" height="6" fill={tone.hi} />
        <rect x="8" y="16" width="18" height="10" fill={tone.mid} />
        <rect x="58" y="16" width="22" height="10" fill={tone.mid} />
        <rect x="18" y="24" width="48" height="6" fill={tone.deep} />
        <rect x="40" y="6" width="4" height="2" fill={tone.mid} />
      </svg>
    );
  }

  if (variant === "c") {
    return (
      <svg
        className={className}
        width="72"
        height="34"
        viewBox="0 0 72 34"
        shapeRendering="crispEdges"
        aria-hidden
      >
        <rect x="16" y="12" width="40" height="10" fill={tone.shade} />
        <rect x="10" y="8" width="46" height="8" fill={tone.mid} />
        <rect x="20" y="2" width="28" height="10" fill={tone.hi} />
        <rect x="4" y="14" width="14" height="8" fill={tone.mid} />
        <rect x="50" y="14" width="16" height="8" fill={tone.mid} />
        <rect x="14" y="22" width="42" height="5" fill={tone.deep} />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width="128"
      height="52"
      viewBox="0 0 128 52"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="20" y="20" width="84" height="16" fill={tone.shade} />
      <rect x="12" y="12" width="92" height="14" fill={tone.mid} />
      <rect x="28" y="4" width="64" height="14" fill={tone.hi} />
      <rect x="40" y="0" width="36" height="10" fill={tone.hi} />
      <rect x="2" y="22" width="28" height="14" fill={tone.mid} />
      <rect x="90" y="16" width="34" height="16" fill={tone.mid} />
      <rect x="18" y="34" width="86" height="10" fill={tone.deep} />
      <rect x="48" y="8" width="8" height="2" fill={tone.mid} />
      <rect x="66" y="10" width="6" height="2" fill={tone.mid} />
      <rect x="34" y="14" width="4" height="2" fill="#f7fbff" />
      <rect x="72" y="6" width="4" height="2" fill="#f7fbff" />
    </svg>
  );
}

const SKY_CLOUDS = [
  {
    id: "c1",
    variant: "a" as const,
    style: { top: "12%", left: "3%" },
    size: "h-14 sm:h-16",
    visibility: "",
  },
  {
    id: "c2",
    variant: "b" as const,
    style: { top: "8%", right: "6%" },
    size: "h-12 sm:h-16",
    visibility: "",
  },
  {
    id: "c3",
    variant: "c" as const,
    style: { top: "28%", left: "38%" },
    size: "h-10 sm:h-12",
    visibility: "hidden sm:block",
  },
  {
    id: "c4",
    variant: "b" as const,
    style: { top: "42%", left: "8%" },
    size: "h-12 sm:h-14",
    visibility: "hidden md:block",
  },
  {
    id: "c5",
    variant: "a" as const,
    style: { top: "36%", right: "18%" },
    size: "h-10 sm:h-12",
    visibility: "",
  },
];

/** Pixel clouds parked in sky corners/edges (never clipped mid-drift). */
export function SkyClouds() {
  return (
    <div className="ff-cloud-layer ff-px-clouds pointer-events-none absolute inset-x-0 z-[1]">
      {SKY_CLOUDS.map((cloud) => (
        <div
          key={cloud.id}
          className={`ff-cloud-slot absolute ${cloud.visibility}`}
          style={cloud.style}
        >
          <div
            className={`ff-cloud ff-cloud-bob ${cloud.size}`}
            style={{ animationDelay: `${cloud.id.charCodeAt(1) % 5}s` }}
          >
            <PixelCloud variant={cloud.variant} className="h-full w-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Aerial tow — continuous left → right flyby across the sky.
 */
export function BannerPlane() {
  return (
    <div
      className="ff-tow-lane ff-px-plane pointer-events-none absolute inset-x-0 z-[3]"
      style={{
        top: "4.5rem",
        height: "clamp(3.75rem, 11vw, 5.25rem)",
      }}
      role="img"
      aria-label="Reef Update · Faune & Flore"
    >
      <div className="ff-tow-cruise" style={{ animationDelay: "-8s" }}>
        <div className="ff-tow-compose">
          <div className="ff-tow-banner">
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
            <div className="ff-tow-plane-tilt">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pixel-art water surface — irregular crest + sparse sparkles, scroll loop. */
export function SurfaceWaves() {
  return (
    <div
      className="ff-waterline pointer-events-none absolute inset-x-0 z-[4]"
      style={{ top: "calc(var(--ff-waterline) - 28px)" }}
      aria-hidden
    >
      <div className="ff-water-surface-scroll">
        <div className="ff-water-surface-tile" />
      </div>
    </div>
  );
}

/** Belle Isle — hull + deck crane; boom hangs cargo clear of the cabin. */
export function FishingBoat() {
  return (
    <div className="ff-boat-anchor pointer-events-none absolute z-[5]" aria-hidden>
      <div className="ff-boat-float relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/boat-simple.png"
          alt=""
          width={128}
          height={56}
          className="ff-boat-sprite"
          draggable={false}
        />
        {/*
          Crane sits on the foredeck (left). Boom reaches past the bow
          so the cable drops into open water, not through the cabin.
        */}
        <div className="ff-boat-crane">
          <svg
            className="ff-boat-crane-svg"
            viewBox="0 0 72 52"
            width="72"
            height="52"
            shapeRendering="crispEdges"
            aria-hidden
          >
            {/* Deck base plate */}
            <rect x="44" y="34" width="10" height="4" fill="#4a5a68" />
            <rect x="45" y="35" width="8" height="2" fill="#6a7a88" />
            {/* Mast */}
            <rect x="47" y="10" width="4" height="26" fill="#6a7a88" />
            <rect x="47" y="10" width="4" height="2" fill="#2a3844" />
            <rect x="46" y="12" width="6" height="2" fill="#5a6a78" />
            {/* Boom hinge on mast */}
            <rect x="46" y="11" width="6" height="6" fill="#5a6a78" />
            <rect x="47" y="12" width="4" height="4" fill="#e0aa2c" />
            {/* Boom angled up toward bow (stepped pixel diagonal) */}
            <rect x="40" y="11" width="8" height="4" fill="#8a9aa8" />
            <rect x="40" y="11" width="8" height="1" fill="#e8f0f6" />
            <rect x="34" y="9" width="8" height="4" fill="#8a9aa8" />
            <rect x="34" y="9" width="8" height="1" fill="#e8f0f6" />
            <rect x="28" y="7" width="8" height="4" fill="#8a9aa8" />
            <rect x="28" y="7" width="8" height="1" fill="#e8f0f6" />
            <rect x="22" y="5" width="8" height="4" fill="#8a9aa8" />
            <rect x="22" y="5" width="8" height="1" fill="#e8f0f6" />
            <rect x="16" y="3" width="8" height="4" fill="#8a9aa8" />
            <rect x="16" y="3" width="8" height="1" fill="#e8f0f6" />
            <rect x="12" y="2" width="6" height="4" fill="#8a9aa8" />
            <rect x="12" y="2" width="6" height="1" fill="#e8f0f6" />
            {/* Stay from mast top to mid-boom */}
            <rect x="42" y="10" width="5" height="1" fill="#c9b08a" />
            <rect x="36" y="8" width="6" height="1" fill="#c9b08a" />
            <rect x="30" y="6" width="6" height="1" fill="#a89068" />
            {/* Pulley block at raised boom tip */}
            <rect x="5" y="0" width="9" height="9" fill="#3a4854" />
            <rect x="6" y="1" width="7" height="7" fill="#8a9aa8" />
            <rect x="7" y="2" width="5" height="5" fill="#e0aa2c" />
            <rect x="8" y="3" width="3" height="3" fill="#8a6810" />
            {/* Short rope stub from pulley */}
            <rect x="9" y="9" width="2" height="3" fill="#c9b08a" />
            <rect x="9" y="12" width="2" height="3" fill="#2a3844" />
            <rect x="9" y="15" width="2" height="3" fill="#c9b08a" />
            <rect x="9" y="18" width="2" height="2" fill="#a89068" />
          </svg>
          {/* Anchor for the long cable — center of the rope stub under the pulley */}
          <span data-ff-crane-boom className="ff-boat-crane-tip" />
        </div>
      </div>
    </div>
  );
}

const SEAGULLS = [
  {
    key: "g1",
    style: {
      top: "18%",
      left: "48%",
      animationDuration: "10s",
      animationDelay: "-2s",
    },
    size: "h-11 sm:h-14",
    visibility: "",
  },
  {
    key: "g2",
    style: {
      top: "30%",
      left: "72%",
      animationDuration: "12s",
      animationDelay: "-5s",
    },
    size: "h-10 sm:h-12",
    visibility: "",
  },
  {
    key: "g3",
    style: {
      top: "48%",
      left: "56%",
      animationDuration: "14s",
      animationDelay: "-8s",
    },
    size: "h-9 sm:h-11",
    visibility: "hidden sm:block",
  },
  {
    key: "g4",
    style: {
      top: "22%",
      left: "22%",
      animationDuration: "11s",
      animationDelay: "-3s",
    },
    size: "h-8 sm:h-10",
    visibility: "hidden md:block",
  },
] as const;

function GullSprite({ size }: { size: string }) {
  return (
    <div className={`ff-gull-flap relative ${size} aspect-[28/18] min-w-[2.75rem]`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/gull-simple-a.png"
        alt=""
        width={56}
        height={36}
        className="ff-gull-frame ff-gull-frame-a h-full w-auto"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/gull-simple-b.png"
        alt=""
        width={56}
        height={36}
        className="ff-gull-frame ff-gull-frame-b absolute left-0 top-0 h-full w-auto"
        draggable={false}
      />
    </div>
  );
}

/** Ambient seagulls in the sky (away from the title). */
export function SeagullsFront() {
  return (
    <div
      className="ff-px-gulls-front pointer-events-none absolute inset-x-0 top-0 z-[2]"
      style={{ height: "calc(var(--ff-waterline) - 2rem)", paddingTop: "4.5rem" }}
      aria-hidden
    >
      {SEAGULLS.map((g) => (
        <div
          key={g.key}
          className={`ff-gull ${g.visibility}`}
          style={g.style}
        >
          <GullSprite size={g.size} />
        </div>
      ))}
    </div>
  );
}

