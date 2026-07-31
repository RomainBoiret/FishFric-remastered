import { PixelFish } from "@/components/brand/PixelFish";
import { HeroParallax } from "@/components/brand/HeroParallax";
import {
  EggBannerPlane,
  EggBoatHit,
  EggStarfish,
} from "@/components/brand/EasterEggs";
import { TreasureChest } from "@/components/brand/TreasureChest";
import {
  Bubble,
  Coral,
  Crab,
  FishingBoat,
  Jellyfish,
  LightRays,
  PixelKelp,
  Seabed,
  SeagullsFront,
  SeaTurtle,
  Shark,
  Squid,
  Starfish,
  Stingray,
  SkyClouds,
  SurfaceWaves,
  Whale,
  YellowSubmarine,
} from "@/components/brand/OceanLife";

type AtmosphereProps = {
  variant?: "hero" | "app";
};

/** Floor height: flush with the top of the sand shelf (see Seabed). */
const FLOOR = "4.25rem";

/** Shallow → mid → deep lanes (percent from top). */
const FISH = [
  { top: "22%", size: 18, color: "#ffe08a", fin: "#e0aa2c", duration: "26s", delay: "-4s", dir: "right" as const },
  { top: "28%", size: 22, color: "#5ec8e8", fin: "#2f6f9f", duration: "32s", delay: "-14s", dir: "left" as const },
  { top: "36%", size: 26, color: "#f2a63a", fin: "#e85d4c", duration: "28s", delay: "0s", dir: "right" as const },
  { top: "44%", size: 16, color: "#7ed957", fin: "#3c8527", duration: "36s", delay: "-8s", dir: "left" as const },
  { top: "52%", size: 30, color: "#e05a9a", fin: "#a03060", duration: "34s", delay: "-20s", dir: "right" as const },
  { top: "58%", size: 20, color: "#c9a0ff", fin: "#7a50b8", duration: "30s", delay: "-12s", dir: "left" as const },
  { top: "64%", size: 24, color: "#5ec8e8", fin: "#1a5a7a", duration: "40s", delay: "-26s", dir: "right" as const },
  { top: "70%", size: 14, color: "#f2a63a", fin: "#c87820", duration: "24s", delay: "-3s", dir: "left" as const },
  { top: "76%", size: 28, color: "#7ed957", fin: "#2d6b1a", duration: "38s", delay: "-16s", dir: "right" as const },
  { top: "82%", size: 18, color: "#ff8f70", fin: "#c44b3a", duration: "33s", delay: "-9s", dir: "left" as const },
];

const BUBBLES = [
  { left: "10%", size: 5, delay: "0s", duration: "12s" },
  { left: "18%", size: 4, delay: "1.5s", duration: "14s" },
  { left: "27%", size: 6, delay: "3s", duration: "11s" },
  { left: "39%", size: 4, delay: "0.8s", duration: "15s" },
  { left: "48%", size: 7, delay: "4.2s", duration: "13s" },
  { left: "57%", size: 4, delay: "2.2s", duration: "16s" },
  { left: "66%", size: 5, delay: "5s", duration: "12s" },
  { left: "74%", size: 6, delay: "1.1s", duration: "14s" },
  { left: "83%", size: 4, delay: "6.5s", duration: "10s" },
  { left: "91%", size: 5, delay: "3.8s", duration: "13s" },
  { left: "33%", size: 3, delay: "7s", duration: "11s" },
  { left: "61%", size: 3, delay: "8.5s", duration: "15s" },
];

const KELP = [
  { left: "4%", height: 12, delay: "0.1s", tone: "dark" as const },
  { left: "9%", height: 16, delay: "0.6s", tone: "green" as const },
  { left: "14%", height: 10, delay: "1.1s", tone: "teal" as const },
  { left: "22%", height: 14, delay: "0.3s", tone: "green" as const },
  { left: "27%", height: 8, delay: "0.9s", tone: "dark" as const },
  { left: "68%", height: 11, delay: "0.4s", tone: "teal" as const },
  { left: "74%", height: 15, delay: "0.8s", tone: "green" as const },
  { left: "80%", height: 9, delay: "1.3s", tone: "dark" as const },
  { left: "86%", height: 13, delay: "0.2s", tone: "green" as const },
  { left: "92%", height: 11, delay: "1s", tone: "teal" as const },
];

/**
 * Minecraft ocean biome: surface boat & waves → mid reef → sand floor,
 * with kelp, coral, jellyfish, bubbles, and a treasure chest.
 */
export function Atmosphere({ variant = "app" }: AtmosphereProps) {
  const rich = variant === "hero";
  const fish = rich ? FISH : FISH.slice(0, 5);

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className={`absolute inset-0 ${
            rich ? "ff-hero-wash" : "ff-app-wash"
          }`}
        />
        <div className="ff-pixel-grid absolute inset-0 opacity-[0.12]" />
        {rich ? <LightRays /> : null}
        {rich ? <HeroParallax /> : null}

        {/* Surface: clouds → gulls → plane → ocean → boat */}
        {rich ? (
          <>
            <SkyClouds />
            <SeagullsFront />
            <SurfaceWaves />
            <FishingBoat />
          </>
        ) : null}

        {/* Mid-depth life */}
        <Jellyfish top={rich ? "36%" : "28%"} left="15%" size={26} delay="0s" />
        <Jellyfish
          top={rich ? "52%" : "44%"}
          left="78%"
          size={22}
          delay="1.6s"
          color="#6ee0d0"
        />
        {rich ? (
          <Jellyfish
            top="64%"
            left="42%"
            size={18}
            delay="2.8s"
            color="#a8c0ff"
          />
        ) : null}
        <Squid top={rich ? "58%" : "50%"} delay="-10s" dir="left" />
        {rich ? <Squid top="72%" delay="-28s" dir="right" /> : null}

        <Shark
          top={rich ? "42%" : "38%"}
          delay="-6s"
          dir="right"
          size={rich ? 1 : 0.85}
        />
        {rich ? (
          <Shark top="68%" delay="-22s" dir="left" size={0.75} />
        ) : null}

        {rich ? <Whale top="78%" delay="-15s" dir="left" /> : null}
        <SeaTurtle top={rich ? "48%" : "42%"} delay="-18s" dir="right" />
        {rich ? <Stingray top="60%" delay="-30s" dir="left" /> : null}
        {!rich ? <Stingray top="55%" delay="-12s" dir="right" /> : null}
        <YellowSubmarine
          top={rich ? "54%" : "46%"}
          delay="-8s"
          dir="right"
        />

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
              opacity: 0.55 + (i / fish.length) * 0.35,
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

        {BUBBLES.slice(0, rich ? BUBBLES.length : 5).map((b, i) => (
          <Bubble key={i} {...b} bottom={FLOOR} />
        ))}

        {/* Seafloor biome - sand flush to bottom */}
        <Seabed />
        <Coral left="6%" bottom={FLOOR} />
        <Coral
          left="58%"
          bottom={FLOOR}
          palette={["#2d8f83", "#e05a9a", "#f2a63a"]}
        />
        {rich ? (
          <Coral
            left="38%"
            bottom={FLOOR}
            palette={["#5ec8e8", "#2f6f9f", "#e05a9a"]}
          />
        ) : null}

        {(rich ? KELP : KELP.filter((_, i) => i % 2 === 0)).map((k) => (
          <PixelKelp key={k.left} {...k} />
        ))}

        <Starfish left="70%" bottom={FLOOR} color="#f2a63a" />
        {rich ? <Starfish left="16%" bottom={FLOOR} color="#e05a9a" /> : null}
        <Crab left="30%" bottom={FLOOR} delay="0s" dir="right" />
        {rich ? (
          <Crab left="82%" bottom={FLOOR} delay="-4s" dir="left" />
        ) : null}

        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/12 to-transparent" />
      </div>

      {/* Above page content so clicks reach easter eggs; below site header (z-20). */}
      <div
        data-ff-atmosphere
        className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
      >
        {rich ? <EggBannerPlane /> : null}
        {rich ? <EggBoatHit /> : null}
        <EggStarfish left="34%" bottom={FLOOR} />
        <TreasureChest left={rich ? "47%" : "14%"} bottom={FLOOR} />
      </div>
    </>
  );
}
