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
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      {...(stroke !== undefined && strokeWidth !== undefined
        ? { stroke, strokeWidth }
        : {})}
    />
  );
}
