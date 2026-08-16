"use client";

import { useEffect, useState } from "react";

// Kept in sync with the inline script in app/layout.tsx — same key, same
// convention (only "dark" is ever written; absence means light).
const STORAGE_KEY = "theme";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border/60 transition-colors ${
        isDark ? "bg-accent" : "bg-background/60"
      }`}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: isDark ? "translateX(22px)" : "translateX(4px)" }}
      />
    </button>
  );
}
