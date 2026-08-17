"use client";

import { track as vercelTrack } from "@vercel/analytics";

type PropertyValue = string | number | boolean | null;

// Thin wrapper so the experiment page's call sites don't need to change —
// swap the implementation here if the analytics backend ever changes again.
export function track(event: string, properties?: Record<string, PropertyValue>) {
  vercelTrack(event, properties);
}
