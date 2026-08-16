"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { ticker: string; name: string };

export default function SearchBox({
  placeholder = "Search by ticker or company name…",
  autoFocus = false,
}: {
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/company/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setSuggestions(json.results || []);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(ticker: string) {
    setOpen(false);
    setQuery("");
    router.push(`/company/${ticker.toUpperCase()}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      go(suggestions[activeIndex].ticker);
    } else if (suggestions.length > 0) {
      go(suggestions[0].ticker);
    } else if (query.trim()) {
      go(query.trim());
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-foreground focus:border-accent focus:bg-surface focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-1.5 font-medium text-accent-foreground hover:opacity-90"
        >
          Search
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="bg-surface absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-border shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s.ticker}>
              <button
                type="button"
                onClick={() => go(s.ticker)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-background ${
                  i === activeIndex ? "bg-background" : ""
                }`}
              >
                <span className="text-foreground">{s.name}</span>
                <span className="ml-2 shrink-0 font-mono text-xs text-muted">
                  {s.ticker}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
