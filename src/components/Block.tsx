import { memo } from "react";

interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx?: number;
  ry?: number;
}

export const Block = memo(function Block({
  x,
  y,
  width,
  height,
  fill,
  rx,
  ry,
}: BlockProps) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={rx ?? 4}
      ry={ry ?? 4}
    />
  );
});
