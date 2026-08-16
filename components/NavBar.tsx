"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import ThemeToggle from "@/components/ThemeToggle";

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted hover:bg-background hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname.startsWith("/company");
  const isStocks = pathname.startsWith("/stocks");
  const isScreener = pathname.startsWith("/screener");
  const isCompare = pathname.startsWith("/compare");
  const isPortfolio = pathname.startsWith("/portfolio");

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold text-foreground">
          Company Dossier
        </Link>

        <nav className="flex shrink-0 gap-1">
          <TabLink href="/" active={isHome}>
            Home
          </TabLink>
          <TabLink href="/stocks" active={isStocks}>
            Stocks
          </TabLink>
          <TabLink href="/screener" active={isScreener}>
            Screener
          </TabLink>
          <TabLink href="/compare" active={isCompare}>
            Compare
          </TabLink>
          <TabLink href="/portfolio" active={isPortfolio}>
            Portfolio
          </TabLink>
        </nav>

        <div className="min-w-[200px] max-w-sm flex-1">
          <SearchBox placeholder="Search company or ticker…" />
        </div>

        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
