"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import RangeBrush from "./RangeBrush";
import SearchBox from "@/components/SearchBox";

const OTHER_PERIODS = ["1D", "5D", "1M", "6M"] as const;
const YEAR_PERIODS = ["1Y", "2Y", "3Y", "4Y", "5Y"] as const;
const RANGES = [...OTHER_PERIODS, ...YEAR_PERIODS] as const;
type RangeKey = (typeof RANGES)[number];

const MA_CONFIG = [
  { key: "ma5", label: "5D", period: 5, color: "#f59e0b" },
  { key: "ma30", label: "30D", period: 30, color: "#3b82f6" },
  { key: "ma126", label: "6M", period: 126, color: "#a855f7" },
] as const;

const STALE_MS = 15 * 60 * 1000;

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ApiResponse = {
  symbol: string;
  range: RangeKey;
  interval: string;
  candles: Candle[];
  fetchedAt: number;
};

function computeSMA(candles: Candle[], period: number) {
  if (candles.length < period) return [];
  const points: { time: UTCTimestamp; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      points.push({
        time: candles[i].time as UTCTimestamp,
        value: sum / period,
      });
    }
  }
  return points;
}

export default function StockChart({
  symbol: controlledSymbol,
  defaultRange = "1M",
}: {
  // When provided, the manual symbol input is hidden and the chart tracks
  // this ticker instead — used to embed the chart in a page that already
  // has its own company search (e.g. the /company/[ticker] dashboard).
  symbol?: string;
  defaultRange?: RangeKey;
} = {}) {
  const isEmbedded = !!controlledSymbol;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const maSeriesRef = useRef<Record<string, ISeriesApi<"Line">>>({});

  const initialSymbol = (controlledSymbol || "AAPL").toUpperCase();
  const [symbolInput, setSymbolInput] = useState(initialSymbol);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [range, setRange] = useState<RangeKey>(defaultRange);

  // Keep in sync if the embedding page navigates to a different company.
  useEffect(() => {
    if (controlledSymbol) {
      const next = controlledSymbol.toUpperCase();
      setSymbolInput(next);
      setSymbol(next);
    }
  }, [controlledSymbol]);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMAs, setVisibleMAs] = useState<Set<string>>(
    new Set(["ma5", "ma30", "ma126"])
  );
  const [now, setNow] = useState<number | null>(null);
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");

  const fetchData = useCallback(async (sym: string, rng: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stock/${sym}?range=${rng}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + whenever symbol/range changes
  useEffect(() => {
    // Intentional data-fetch effect keyed on symbol/range.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(symbol, range);
  }, [symbol, range, fetchData]);

  // Auto-refresh when data goes stale (tab refocus, or periodic check)
  useEffect(() => {
    const checkStale = () => {
      const nowMs = Date.now();
      setNow(nowMs);
      if (result && nowMs - result.fetchedAt > STALE_MS) {
        fetchData(symbol, range);
      }
    };
    checkStale();
    const interval = setInterval(checkStale, 60 * 1000);
    window.addEventListener("focus", checkStale);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkStale);
    };
  }, [result, symbol, range, fetchData]);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height: 420,
      layout: {
        background: { color: "transparent" },
        textColor: "#71717a",
      },
      grid: {
        vertLines: { color: "rgba(113,113,122,0.1)" },
        horzLines: { color: "rgba(113,113,122,0.1)" },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      visible: false,
    });
    priceLineSeriesRef.current = chart.addSeries(LineSeries, {
      color: "#2563eb",
      lineWidth: 2,
      priceLineVisible: false,
    });
    maSeriesRef.current = Object.fromEntries(
      MA_CONFIG.map((ma) => [
        ma.key,
        chart.addSeries(LineSeries, {
          color: ma.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        }),
      ])
    );

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({ width });
        chart.timeScale().fitContent();
      }
    });
    resizeObserver.observe(containerRef.current);
    chart.applyOptions({ width: containerRef.current.clientWidth });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Push data into series whenever it changes
  useEffect(() => {
    if (!result || !candleSeriesRef.current || !priceLineSeriesRef.current) return;
    const candles = result.candles as Candle[];
    candleSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    priceLineSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.close,
      }))
    );
    candleSeriesRef.current.applyOptions({
      visible: chartType === "candlestick",
    });
    priceLineSeriesRef.current.applyOptions({ visible: chartType === "line" });

    const isDaily = result.interval === "1d";
    for (const ma of MA_CONFIG) {
      const series = maSeriesRef.current[ma.key];
      if (!series) continue;
      const showThisMA = isDaily && visibleMAs.has(ma.key);
      series.setData(showThisMA ? computeSMA(candles, ma.period) : []);
    }

    chartRef.current?.timeScale().fitContent();
  }, [result, visibleMAs, chartType]);

  const toggleMA = (key: string) => {
    setVisibleMAs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isDailyInterval = result?.interval === "1d";

  const lastUpdatedLabel = useMemo(() => {
    if (!result || now == null) return null;
    const secondsAgo = Math.floor((now - result.fetchedAt) / 1000);
    if (secondsAgo < 60) return "just now";
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo} min ago`;
  }, [result, now]);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSymbol(symbolInput.trim().toUpperCase());
        }}
      >
        {!isEmbedded && (
          <>
            <SearchBox
              compact
              onSelect={(t) => {
                setSymbolInput(t);
                setSymbol(t);
              }}
              placeholder="Symbol or company"
              inputClassName="rounded border border-black/10 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm uppercase w-40"
            />
            <button
              type="submit"
              className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-medium"
            >
              Load
            </button>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="Other periods">
            {OTHER_PERIODS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1.5 text-sm font-medium ${
                  range === r
                    ? "bg-foreground text-background"
                    : "bg-black/[.04] dark:bg-white/[.08] text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="h-5 w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <div className="flex gap-1" role="group" aria-label="Years">
            {YEAR_PERIODS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1.5 text-sm font-medium ${
                  range === r
                    ? "bg-foreground text-background"
                    : "bg-black/[.04] dark:bg-white/[.08] text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          {(["line", "candlestick"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setChartType(type)}
              className={`rounded px-2.5 py-1.5 text-sm font-medium capitalize ${
                chartType === type
                  ? "bg-foreground text-background"
                  : "bg-black/[.04] dark:bg-white/[.08] text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => fetchData(symbol, range)}
          disabled={loading}
          className="ml-auto rounded border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {MA_CONFIG.map((ma) => (
          <label
            key={ma.key}
            className={`flex items-center gap-1.5 ${
              !isDailyInterval ? "opacity-40" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={visibleMAs.has(ma.key)}
              disabled={!isDailyInterval}
              onChange={() => toggleMA(ma.key)}
            />
            <span style={{ color: ma.color }}>{ma.label} MA</span>
          </label>
        ))}
        {!isDailyInterval && result && (
          <span className="text-zinc-400 text-xs">
            (moving averages need daily candles — switch to 1M/6M/1Y/2Y)
          </span>
        )}
        {lastUpdatedLabel && (
          <span className="text-zinc-400 text-xs ml-auto">
            Updated {lastUpdatedLabel}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded border border-black/10 dark:border-white/15"
      />

      {result && result.candles.length > 1 && (
        <RangeBrush candles={result.candles} chartRef={chartRef} />
      )}
    </div>
  );
}
