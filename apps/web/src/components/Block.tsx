export interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx?: number;
  ry?: number;
}

export function Block({ x, y, width, height, fill, rx, ry }: BlockProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={rx ?? 4}
        ry={ry ?? 4}
      />
    </g>
  );
}
