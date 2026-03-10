export interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

export function Block({ x, y, width, height, fill }: BlockProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
      />
      <rect
        x={x + 5}
        y={y + 5}
        rx={4}
        ry={4}
        width={width - 10}
        height={height - 10}
        fill="rgba(255,255,255,0.5)"
        stroke="rgba(0,0,0,1)"
        strokeWidth={2}
      />
    </g>
  );
}
