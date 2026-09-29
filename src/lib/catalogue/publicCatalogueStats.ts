import "server-only";

import { unstable_cache } from "next/cache";

import { forReader } from "./catalogueReader";
import { fetchCatalogueStats } from "./catalogueStats";
import type { CatalogueStats } from "./catalogue.types";

/**
 * THE CATALOGUE'S FIGURES FOR A READER WITH NO SESSION, read from the database
 * at most once an hour.
 *
 * /games is the one open page that reads the database, and it is the page a
 * crawler is most likely to load. The production database sleeps after five
 * idle minutes and is billed for every minute it is awake, so five reads for
 * each stranger meant a visit every few minutes kept it awake round the clock:
 * in September 2026 it woke about every ten minutes through the night, 161
 * compute hours in twenty-two days. A member's visit reads their own row in
 * any case, so only the stranger's half is kept.
 *
 * WHAT IS KEPT HAS NO NAMES IN IT. `forReader(…, false)` runs inside the read,
 * so the copy in the cache is already the one a stranger is shown.
 *
 * AN HOUR, because a count of finished games an hour old is still a true thing
 * to tell somebody deciding whether to join, and "last played today" is decided
 * by the calendar day.
 *
 * NOT OUTSIDE PRODUCTION. The browser suite seeds a finished game and reads
 * /games as a stranger in the same minute (`e2e/games-stats.spec.ts`); a kept
 * answer there would be a test about the cache. A failed read is never kept.
 */
export const STRANGER_STATS_SECONDS = 3600;

async function readForStranger(): Promise<CatalogueStats> {
  return forReader(await fetchCatalogueStats(), false);
}

const kept = unstable_cache(readForStranger, ["catalogue-stats-stranger"], { revalidate: STRANGER_STATS_SECONDS });

export async function strangerCatalogueStats(): Promise<CatalogueStats> {
  return process.env.NODE_ENV === "production" ? kept() : readForStranger();
}
