"use client";

import { useEffect, useState } from "react";

type Pt = { x: number; y: number };

/**
 * Long artistic crane cable: boat boom → Try it now hook.
 * Drawn in document space (absolute), so it scrolls with the page
 * and does not reflow on scroll.
 */
export function CraneCable() {
  const [pts, setPts] = useState<{ boom: Pt; hook: Pt } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let alive = true;

    const measure = () => {
      if (!alive) return;
      const boomEl = document.querySelector("[data-ff-crane-boom]");
      const hookEl = document.querySelector("[data-ff-crane-hook]");
      if (!boomEl || !hookEl) {
        setPts(null);
        return;
      }
      const boom = boomEl.getBoundingClientRect();
      const hook = hookEl.getBoundingClientRect();
      if ((boom.width === 0 && boom.height === 0) || hook.height === 0) {
        setPts(null);
        return;
      }

      const sx = window.scrollX;
      const sy = window.scrollY;
      const boomDoc = {
        x: boom.left + boom.width / 2 + sx,
        y: boom.top + boom.height / 2 + sy,
      };
      const hookDoc = {
        x: hook.left + hook.width / 2 + sx,
        y: hook.top + sy + 1,
      };

      if (hookDoc.y < boomDoc.y + 24) {
        setPts(null);
        return;
      }

      setPts({ boom: boomDoc, hook: hookDoc });
      setSize({
        w: Math.max(
          document.documentElement.scrollWidth,
          document.documentElement.clientWidth,
        ),
        h: Math.max(
          document.documentElement.scrollHeight,
          document.documentElement.clientHeight,
        ),
      });
    };

    measure();
    const t1 = window.setTimeout(measure, 100);
    const t2 = window.setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    ro?.observe(document.documentElement);

    return () => {
      alive = false;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      ro?.disconnect();
    };
  }, []);

  if (!pts || size.w === 0 || size.h === 0) return null;

  const { boom, hook } = pts;
  const midY = boom.y + (hook.y - boom.y) * 0.5;
  const d = `M ${boom.x} ${boom.y} C ${boom.x} ${midY}, ${hook.x} ${midY}, ${hook.x} ${hook.y}`;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={size.w}
      height={size.h}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="#1a2832"
        strokeWidth="5"
        strokeLinecap="square"
        opacity="0.9"
      />
      <path
        d={d}
        fill="none"
        stroke="#c9b08a"
        strokeWidth="2"
        strokeLinecap="square"
        strokeDasharray="6 5"
      />
    </svg>
  );
}
