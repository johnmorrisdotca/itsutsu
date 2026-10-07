"use client";

import { usePathname } from "next/navigation";

import { sitePathOf } from "./strangerPath";

/**
 * `usePathname()`, for a component that may be drawn into a page kept ahead of
 * time for readers with no session. Use this one, never the bare hook, in
 * anything a stranger's page draws: see `strangerPath.ts` for why the two
 * differ, and `strangerCache.coverage.test.ts`, which fails for the bare hook.
 */
export function useSitePathname(): string {
  return sitePathOf(usePathname());
}
