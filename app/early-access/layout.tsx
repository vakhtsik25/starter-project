import Link from "next/link";

// Deliberately minimal — brand only, no tabs to the rest of the site.
// This is a focused acquisition funnel; a full nav would just give
// visitors a way to wander off before completing it.
export default function EarlyAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="sticky top-4 z-50 mx-4 mt-4 sm:mx-6 lg:mx-8">
        <header className="mx-auto max-w-6xl rounded-2xl border border-foreground/10 bg-surface/70 px-4 py-2.5 shadow-xl backdrop-blur-xl backdrop-saturate-150">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            FinLens
          </Link>
        </header>
      </div>
      {children}
    </>
  );
}
