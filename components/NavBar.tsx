"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/ProfileMenu";

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-muted hover:bg-surface/70 hover:text-foreground"
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
  const isEarnings = pathname.startsWith("/earnings-calendar");
  const isCompare = pathname.startsWith("/compare");
  const isPortfolio = pathname.startsWith("/portfolio");

  return (
    <div className="sticky top-4 z-50 mx-4 mt-4 sm:mx-6 lg:mx-8">
      <header className="mx-auto max-w-6xl rounded-2xl border border-foreground/10 bg-surface/70 shadow-xl backdrop-blur-xl backdrop-saturate-150">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight text-foreground">
            FinLens
          </Link>

          <nav className="flex shrink-0 gap-0.5 rounded-full bg-background/60 p-1">
            <TabLink href="/" active={isHome}>
              Home
            </TabLink>
            <TabLink href="/stocks" active={isStocks}>
              Stocks
            </TabLink>
            <TabLink href="/screener" active={isScreener}>
              Screener
            </TabLink>
            <TabLink href="/earnings-calendar" active={isEarnings}>
              Earnings
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

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>
      </header>
    </div>
  );
}
