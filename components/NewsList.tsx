"use client";

import { useState } from "react";

export type NewsItem = {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
};

function timeAgo(iso: string, now: number) {
  const seconds = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NewsList({
  news,
  now,
  initialCount,
}: {
  news: NewsItem[];
  now: number;
  /** Cap the list to this many items with a "Show more" toggle. Omit to always show all. */
  initialCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (news.length === 0) {
    return <p className="text-sm text-muted">No recent news found.</p>;
  }

  const isCapped = initialCount != null && news.length > initialCount;
  const visible = isCapped && !expanded ? news.slice(0, initialCount) : news;

  return (
    <>
      <ul className="divide-y divide-border">
        {visible.map((n, i) => (
          <li key={i} className="py-3">
            <a
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              {n.title}
            </a>
            <p className="mt-1 text-xs text-muted">
              {n.publisher} · {timeAgo(n.publishedAt, now)}
            </p>
          </li>
        ))}
      </ul>
      {isCapped && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm font-medium text-accent hover:underline"
        >
          Show {news.length - initialCount!} more
        </button>
      )}
    </>
  );
}
