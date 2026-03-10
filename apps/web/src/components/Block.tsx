export interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export function Block({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: BlockProps) {
  const innerProps = {
    ...(stroke !== undefined && strokeWidth !== undefined
      ? { stroke, strokeWidth }
      : {}),
  };
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
        {...innerProps}
      />
      <rect
        x={x + 5}
        y={y + 5}
        rx={4}
        ry={4}
        width={width - 10}
        height={height - 10}
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x={x + 10}
        y={y + 10}
        width={width - 20}
        height={height - 20}
        fill={fill}
        rx={4}
        ry={4}
        {...innerProps}
      />
      <rect
        x={x + 15}
        y={y + 15}
        rx={4}
        ry={4}
        width={width - 30}
        height={height - 30}
        fill="rgba(255,255,255,0.5)"
      />
    </g>
  );
}
