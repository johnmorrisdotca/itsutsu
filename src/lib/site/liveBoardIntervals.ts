import "server-only";

import { unstable_cache } from "next/cache";

import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";

import { DEFAULT_SITE_SETTINGS } from "./site.constants";
import { liveBoardIntervalsFrom, siteSettingsFrom, storedFromRemote } from "./site";
import type { LiveBoardIntervals } from "./site.types";
import { readRemoteSettings } from "./siteSettingsWire";

/**
 * The tag every cached read of the site's settings carries, so a write from the
 * panel (`/api/site`) makes the next read fresh.
 */
export const SITE_SETTINGS_TAG = "site-settings";

/**
 * The settings, read from Sumilabu at most once every ten minutes per server
 * cache, or sooner when the panel writes one. Throws when the store cannot be
 * read, which `unstable_cache` never keeps, so a failed read is asked again on
 * the next page rather than remembered for ten minutes.
 */
const cachedSettings = unstable_cache(
  async () => siteSettingsFrom(storedFromRemote(await readRemoteSettings(sumilabuTarget("settings")))),
  ["site-settings-for-boards"],
  { revalidate: 600, tags: [SITE_SETTINGS_TAG] },
);

/**
 * How often a live board asks, as the operator has set it on the site panel,
 * read where the board's page renders and handed to the board as a prop.
 *
 * NEVER ON THE POLL. The poll route is one read (and a once-a-minute "seen"
 * stamp), and it stays that: a board picks up a change the next time its page
 * loads, which the panel says beside the two settings.
 *
 * CACHED ACROSS REQUESTS, unlike the rest of `siteStore.ts`, and for the reason
 * that file gives for not caching turned round. The settings live on Sumilabu,
 * so an uncached read is a request to another of this account's functions on
 * every board page — and a board page is loaded on every move that carries a
 * player on to their next game. The door is not busy enough to need a cache;
 * the board is. And the objection there — a cache the panel's write cannot
 * reach — does not hold for Next's data cache, which lives outside the process
 * and which the panel's write clears by tag (`revalidateTag` in `/api/site`).
 *
 * A store that cannot be read gives the defaults, which are the site's own
 * numbers (`POLL_FAST_MS`, `POLL_MS`) — never a faster board than those.
 */
export async function liveBoardIntervals(): Promise<LiveBoardIntervals> {
  try {
    return liveBoardIntervalsFrom(await cachedSettings());
  } catch (error) {
    console.error(`Live boards ask at the default intervals: the settings store could not be read. ${error instanceof Error ? error.message : String(error)}`);
    return liveBoardIntervalsFrom(DEFAULT_SITE_SETTINGS);
  }
}
