"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  LineType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import RangeBrush from "./RangeBrush";
import SearchBox from "@/components/SearchBox";
import { readCssVar, watchThemeChange, hexToRgba } from "@/lib/theme-colors";

const OTHER_PERIODS = ["1D", "5D", "1M", "6M"] as const;
const YEAR_PERIODS = ["1Y", "2Y", "3Y", "4Y", "5Y"] as const;
const RANGES = [...OTHER_PERIODS, ...YEAR_PERIODS] as const;
type RangeKey = (typeof RANGES)[number];

// Colors resolved from CSS vars at runtime (see getChartColors) — these
// var names double as the Tailwind classes used in the legend below, so
// the line color and its label always match.
const MA_CONFIG = [
  { key: "ma5", label: "5D", period: 5, varName: "--chart-series-1", twClass: "text-chart-series-1" },
  { key: "ma30", label: "30D", period: 30, varName: "--chart-series-2", twClass: "text-chart-series-2" },
  { key: "ma126", label: "6M", period: 126, varName: "--chart-series-3", twClass: "text-chart-series-3" },
] as const;

// lightweight-charts renders to <canvas> and needs literal resolved color
// strings, not living CSS var() references — read the theme's current
// values once here, and again whenever the theme toggle flips.
function getChartColors() {
  const accent = readCssVar("--accent");
  return {
    text: readCssVar("--muted"),
    grid: readCssVar("--border"),
    positive: readCssVar("--positive"),
    negative: readCssVar("--negative"),
    accent,
    // Gradient wash under the price line — the dataviz skill's area-fill
    // spec (~10% opacity, never a saturated block), stepping up slightly at
    // the top since this is the chart's one hero series, fading to nothing.
    areaTop: hexToRgba(accent, 0.16),
    areaBottom: hexToRgba(accent, 0),
    ma: MA_CONFIG.map((ma) => readCssVar(ma.varName)),
  };
}

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
  const priceLineSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
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
    const colors = getChartColors();
    const chart = createChart(containerRef.current, {
      height: 420,
      layout: {
        background: { color: "transparent" },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: colors.positive,
      downColor: colors.negative,
      borderVisible: false,
      wickUpColor: colors.positive,
      wickDownColor: colors.negative,
      visible: false,
    });
    priceLineSeriesRef.current = chart.addSeries(AreaSeries, {
      lineColor: colors.accent,
      topColor: colors.areaTop,
      bottomColor: colors.areaBottom,
      lineWidth: 2,
      lineType: LineType.Curved,
      priceLineVisible: false,
    });
    maSeriesRef.current = Object.fromEntries(
      MA_CONFIG.map((ma, i) => [
        ma.key,
        chart.addSeries(LineSeries, {
          color: colors.ma[i],
          lineWidth: 2,
          lineType: LineType.Curved,
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

    // Re-resolve and reapply colors whenever the theme toggle flips.
    const stopWatching = watchThemeChange(() => {
      const next = getChartColors();
      chart.applyOptions({
        layout: { textColor: next.text },
        grid: {
          vertLines: { color: next.grid },
          horzLines: { color: next.grid },
        },
      });
      candleSeriesRef.current?.applyOptions({
        upColor: next.positive,
        downColor: next.negative,
        wickUpColor: next.positive,
        wickDownColor: next.negative,
      });
      priceLineSeriesRef.current?.applyOptions({
        lineColor: next.accent,
        topColor: next.areaTop,
        bottomColor: next.areaBottom,
      });
      MA_CONFIG.forEach((ma, i) => {
        maSeriesRef.current[ma.key]?.applyOptions({ color: next.ma[i] });
      });
    });

    return () => {
      resizeObserver.disconnect();
      stopWatching();
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
              inputClassName="rounded border border-border bg-transparent px-3 py-1.5 text-sm uppercase w-40"
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
                    : "bg-background text-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <div className="flex gap-1" role="group" aria-label="Years">
            {YEAR_PERIODS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1.5 text-sm font-medium ${
                  range === r
                    ? "bg-foreground text-background"
                    : "bg-background text-muted"
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
                  : "bg-background text-muted"
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
          className="ml-auto rounded border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
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
            <span className={`font-medium ${ma.twClass}`}>{ma.label} MA</span>
          </label>
        ))}
        {!isDailyInterval && result && (
          <span className="text-muted text-xs">
            (moving averages need daily candles — switch to 1M/6M/1Y/2Y)
          </span>
        )}
        {lastUpdatedLabel && (
          <span className="text-muted text-xs ml-auto">
            Updated {lastUpdatedLabel}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-negative bg-negative/10 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded border border-border"
      />

      {result && result.candles.length > 1 && (
        <RangeBrush candles={result.candles} chartRef={chartRef} />
      )}
    </div>
  );
}
