import type { PuzzleKind } from "../puzzles.types";
import { loadDailyPools, readKanaPoolsWith } from "./dailyPools";

/**
 * THE KANA DAILY POOLS WHERE THERE IS NO BROWSER: the pages that print a day's
 * words (today's buttons, a day's page, the archive), the server's own checks,
 * a unit test, a browser spec's own process. Importing this module is what
 * lets `loadDailyPools` answer there (see `dailyPools.ts`).
 */
readKanaPoolsWith(async (size) => {
  // Named one by one, so the bundler splits each length into its own chunk.
  if (size === 3) return (await import("./pool.ja.3.data")).DAILY_POOL_JA_3;
  if (size === 4) return (await import("./pool.ja.4.data")).DAILY_POOL_JA_4;
  if (size === 5) return (await import("./pool.ja.5.data")).DAILY_POOL_JA_5;
  return null;
});

/** A kind's kana pools, read from their module: `loadDailyPools` for a caller with no browser. */
export function loadDailyPoolsFromModule(kind: PuzzleKind, sizes?: readonly number[]): Promise<void> {
  return loadDailyPools(kind, sizes);
}
