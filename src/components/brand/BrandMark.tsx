/** Cubic pixel fish mark */
export function BrandMark({
  className = "",
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="2" y="2" width="4" height="3" fill="currentColor" />
      <rect x="3" y="5" width="3" height="1" fill="currentColor" />
      <rect x="5" y="1" width="2" height="2" fill="currentColor" />
      <rect
        x="0"
        y="2"
        width="2"
        height="1"
        fill="currentColor"
        opacity="0.85"
      />
      <rect
        x="0"
        y="4"
        width="2"
        height="1"
        fill="currentColor"
        opacity="0.85"
      />
      <rect x="6" y="2" width="1" height="1" fill="#1b1b1b" />
    </svg>
  );
}
