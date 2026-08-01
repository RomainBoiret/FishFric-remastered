"use client";

import { oceanAudio } from "@/lib/oceanAudio";
import { useIsClient } from "@/lib/use-is-client";
import { useEffect, useState } from "react";

/** Header control: ocean ambience + SFX off by default. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const mounted = useIsClient();

  useEffect(() => {
    oceanAudio.hydrate();
    return oceanAudio.subscribe(setEnabled);
  }, []);

  if (!mounted) {
    return (
      <span
        className={`ff-sound-toggle is-muted ${className}`}
        aria-hidden
      >
        <SoundIcon on={false} />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`ff-sound-toggle ${enabled ? "is-on" : "is-muted"} ${className}`}
      onClick={() => {
        void oceanAudio.setEnabled(!enabled);
      }}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute ocean sounds" : "Enable ocean sounds"}
      title={enabled ? "Mute ocean sounds" : "Enable ocean sounds"}
    >
      <SoundIcon on={enabled} />
    </button>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      shapeRendering="crispEdges"
      aria-hidden
      style={{ imageRendering: "pixelated" }}
    >
      {/* Speaker body */}
      <rect x="2" y="6" width="3" height="6" fill="currentColor" />
      <rect x="5" y="5" width="2" height="8" fill="currentColor" />
      <rect x="7" y="4" width="2" height="10" fill="currentColor" />
      {on ? (
        <>
          <rect x="11" y="7" width="1" height="4" fill="currentColor" opacity="0.9" />
          <rect x="13" y="5" width="1" height="8" fill="currentColor" opacity="0.75" />
          <rect x="15" y="3" width="1" height="12" fill="currentColor" opacity="0.55" />
        </>
      ) : (
        <>
          <rect x="11" y="5" width="1" height="1" fill="currentColor" />
          <rect x="12" y="6" width="1" height="1" fill="currentColor" />
          <rect x="13" y="7" width="1" height="1" fill="currentColor" />
          <rect x="14" y="8" width="1" height="1" fill="currentColor" />
          <rect x="13" y="9" width="1" height="1" fill="currentColor" />
          <rect x="12" y="10" width="1" height="1" fill="currentColor" />
          <rect x="11" y="11" width="1" height="1" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
