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
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-background"
    >
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
