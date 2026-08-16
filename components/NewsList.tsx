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
}: {
  news: NewsItem[];
  now: number;
}) {
  if (news.length === 0) {
    return <p className="text-sm text-muted">No recent news found.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {news.map((n, i) => (
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
  );
}
