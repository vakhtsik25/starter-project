import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Company Dossier",
  description:
    "Investor snapshots from the primary source — SEC EDGAR. Historical financials, filings, earnings calendar, and cash-rate comparisons for individual investors.",
};

// Runs before hydration so there's no flash of the wrong theme. Light is the
// default: the "dark" class is only ever added, never assumed, and we
// deliberately ignore prefers-color-scheme — the toggle is the only thing
// that puts a user in dark mode.
const themeInitScript = `
try {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme-init script below adds "dark" before hydration runs, which
      // always differs from what the server rendered — that's expected, not
      // a real mismatch, so we tell React not to warn about this one element.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
