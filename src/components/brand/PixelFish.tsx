/** Minecraft-style tropical fish (pixel blocks) */
export function PixelFish({
  color = "#f2a63a",
  fin = "#e85d4c",
  size = 24,
  facing = "right",
}: {
  color?: string;
  fin?: string;
  size?: number;
  facing?: "left" | "right";
}) {
  return (
    <svg
      width={size * 1.5}
      height={size}
      viewBox="0 0 12 8"
      shapeRendering="crispEdges"
      aria-hidden
      style={{
        imageRendering: "pixelated",
        transform: facing === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <rect x="2" y="2" width="7" height="4" fill={color} />
      <rect x="3" y="1" width="4" height="1" fill={color} />
      <rect x="3" y="6" width="4" height="1" fill={color} />
      <rect x="0" y="2" width="2" height="1" fill={fin} />
      <rect x="0" y="5" width="2" height="1" fill={fin} />
      <rect x="1" y="3" width="1" height="2" fill={fin} />
      <rect x="9" y="3" width="2" height="2" fill={color} />
      <rect x="8" y="3" width="1" height="1" fill="#1b1b1b" />
    </svg>
  );
}
