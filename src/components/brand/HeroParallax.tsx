"use client";

import { useEffect } from "react";

/**
 * Drives subtle hero parallax via --ff-scroll (px).
 * transform-only consumers; no layout thrash.
 */
export function HeroParallax() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = -1;

    const apply = () => {
      raf = 0;
      if (reduced.matches) {
        root.style.setProperty("--ff-scroll", "0");
        return;
      }
      const y = window.scrollY;
      if (y === last) return;
      last = y;
      /* Cap so deep scroll doesn't yank layers */
      root.style.setProperty("--ff-scroll", `${Math.min(y, 420)}`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", apply);
    return () => {
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", apply);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty("--ff-scroll");
    };
  }, []);

  return null;
}
