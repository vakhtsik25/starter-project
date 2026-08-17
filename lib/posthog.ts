"use client";

import posthog from "posthog-js";

let initialized = false;

// No-ops when the project key isn't configured (local dev without a
// PostHog account, or a build/preview where env vars aren't set yet) so
// the experiment page never crashes for lack of analytics.
function ensureInit() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized || typeof window === "undefined") return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  ensureInit();
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identify(distinctId: string, properties?: Record<string, unknown>) {
  ensureInit();
  if (!initialized) return;
  posthog.identify(distinctId, properties);
}
