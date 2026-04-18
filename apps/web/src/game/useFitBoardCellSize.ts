import { useState, useEffect, type RefObject } from "react";
import { BOARD_WIDTH, BOARD_HEIGHT } from "@shared/mod";

const MIN_CELL = 8;

/** Cell size so BOARD_WIDTH × BOARD_HEIGHT fits inside the observed element. */
export function useFitBoardCellSize(
  containerRef: RefObject<HTMLElement | null>,
) {
  const [cellSize, setCellSize] = useState(36);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const next = Math.min(w / BOARD_WIDTH, h / BOARD_HEIGHT);
      setCellSize(Math.max(MIN_CELL, Math.floor(next)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return cellSize;
}
