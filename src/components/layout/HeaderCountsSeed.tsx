"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";

import type { HeaderCounts } from "@/lib/history/headerCounts";

import { MINE_KEY } from "@/components/mine/mine.constants";

/**
 * HANDS THE PAGE'S OWN COUNTS TO THE BADGE AND THE STRIP. Draws nothing: it
 * writes what the server worked out while rendering this page into SWR's
 * cache under the key both read (`MINE_KEY`), without asking the server again.
 * Every page view and every client-side navigation renders the header, so the
 * figures are as fresh as the page; a tab that comes back into focus still
 * asks the route (`revalidateOnFocus` on both readers).
 */
export function HeaderCountsSeed({ counts }: { counts: HeaderCounts | null }) {
  const { mutate } = useSWRConfig();
  useEffect(() => {
    if (counts !== null) void mutate(MINE_KEY, counts, { revalidate: false });
  }, [counts, mutate]);
  return null;
}
