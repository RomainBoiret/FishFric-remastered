"use client";

import { useEffect } from "react";
import { OCEAN_PRESENCE_IDS, oceanAudio } from "@/lib/oceanAudio";

/**
 * Ties ocean ambience to what's on screen + scroll depth.
 * Samples `[data-ff-sound]` via rAF so CSS-animated subjects stay in sync.
 */
export function OceanSoundDirector() {
  useEffect(() => {
    let raf = 0;
    let alive = true;
    let lastSample = 0;

    const visibilityRatio = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const vw = window.innerWidth || 1;
      const visibleH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const visibleW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
      if (visibleH <= 0 || visibleW <= 0) return 0;
      const area = Math.max(1, rect.width * rect.height);
      return Math.min(1, (visibleH * visibleW) / area);
    };

    const sample = (now: number) => {
      if (!alive) return;
      raf = window.requestAnimationFrame(sample);
      if (now - lastSample < 80) return;
      lastSample = now;

      for (const id of OCEAN_PRESENCE_IDS) {
        let best = 0;
        document.querySelectorAll(`[data-ff-sound="${id}"]`).forEach((el) => {
          best = Math.max(best, visibilityRatio(el));
        });
        oceanAudio.setPresence(id, best);
      }

      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const depth =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      oceanAudio.setDepth(depth);
    };

    raf = window.requestAnimationFrame(sample);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      for (const id of OCEAN_PRESENCE_IDS) oceanAudio.setPresence(id, 0);
      oceanAudio.setDepth(0);
    };
  }, []);

  return null;
}
