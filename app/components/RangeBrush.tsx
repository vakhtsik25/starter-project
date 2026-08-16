"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IChartApi } from "lightweight-charts";

type Candle = { time: number; close: number };

const MIN_WINDOW_FRAC = 0.03;

export default function RangeBrush({
  candles,
  chartRef,
}: {
  candles: Candle[];
  chartRef: React.RefObject<IChartApi | null>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(1);
  const dragState = useRef<{
    mode: "left" | "right" | "move";
    startFrac: number;
    startLeft: number;
    startRight: number;
  } | null>(null);

  // Reset selection to full range whenever a new dataset loads
  useEffect(() => {
    // Intentional: resets the brush window when a new symbol/range loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeft(0);
    setRight(1);
  }, [candles]);

  // Push the current selection to the chart
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length < 2) return;
    const n = candles.length;
    chart.timeScale().setVisibleLogicalRange({
      from: left * (n - 1),
      to: right * (n - 1),
    });
  }, [left, right, candles, chartRef]);

  const fracFromClientX = (clientX: number, track: HTMLDivElement) => {
    const rect = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const startDrag = (mode: "left" | "right" | "move", e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      mode,
      startFrac: fracFromClientX(e.clientX, track),
      startLeft: left,
      startRight: right,
    };
  };

  const handleLeftPointerDown = (e: React.PointerEvent) => startDrag("left", e);
  const handleRightPointerDown = (e: React.PointerEvent) => startDrag("right", e);
  const handleMovePointerDown = (e: React.PointerEvent) => startDrag("move", e);

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragState.current;
    const track = trackRef.current;
    if (!drag || !track) return;
    const frac = fracFromClientX(e.clientX, track);
    const delta = frac - drag.startFrac;

    if (drag.mode === "left") {
      const next = Math.min(drag.startRight - MIN_WINDOW_FRAC, Math.max(0, drag.startLeft + delta));
      setLeft(next);
    } else if (drag.mode === "right") {
      const next = Math.max(drag.startLeft + MIN_WINDOW_FRAC, Math.min(1, drag.startRight + delta));
      setRight(next);
    } else {
      const width = drag.startRight - drag.startLeft;
      let next = drag.startLeft + delta;
      next = Math.min(Math.max(0, next), 1 - width);
      setLeft(next);
      setRight(next + width);
    }
  };

  const onPointerUp = () => {
    dragState.current = null;
  };

  const sparklinePoints = useMemo(() => {
    if (candles.length < 2) return "";
    const closes = candles.map((c) => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;
    return closes
      .map((c, i) => {
        const x = (i / (closes.length - 1)) * 100;
        const y = 32 - ((c - min) / span) * 28;
        return `${x},${y}`;
      })
      .join(" ");
  }, [candles]);

  return (
    <div
      ref={trackRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative w-full h-12 select-none rounded border border-border bg-background/40 overflow-hidden touch-none"
    >
      {sparklinePoints && (
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <polyline
            points={sparklinePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="text-muted"
          />
        </svg>
      )}

      <div
        onPointerDown={handleMovePointerDown}
        className="absolute inset-y-0 bg-accent/15 border-x-2 border-accent cursor-grab active:cursor-grabbing"
        style={{ left: `${left * 100}%`, width: `${(right - left) * 100}%` }}
      />
      <div
        onPointerDown={handleLeftPointerDown}
        className="absolute inset-y-0 w-2 -ml-1 cursor-ew-resize"
        style={{ left: `${left * 100}%` }}
      />
      <div
        onPointerDown={handleRightPointerDown}
        className="absolute inset-y-0 w-2 -ml-1 cursor-ew-resize"
        style={{ left: `${right * 100}%` }}
      />
    </div>
  );
}
