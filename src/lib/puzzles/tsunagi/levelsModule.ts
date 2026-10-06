import { type LevelRow, loadTsunagiLevels, readTsunagiLevelsWith, type TsunagiSet } from "./levels";

/**
 * TSUNAGI'S LEVELS WHERE THERE IS NO BROWSER: the server's own checks and its
 * records of who solved which level (`tsunagiRecords.ts`), a unit test, a
 * browser spec's own process. Importing this module is what lets
 * `loadTsunagiLevels` answer there (see `levels.ts`).
 */
readTsunagiLevelsWith(async (size, set) => {
  if (set === "portals") {
    const levels = (await import("@johnmorrisdotca/tsunagi/levels-portals")).TSUNAGI_PORTAL_LEVELS[size];
    if (levels === undefined) throw new Error(`No Tsunagi with portals at ${size}×${size}.`);
    return levels;
  }
  // Named one by one, so the bundler splits each size into its own chunk.
  if (size === 4) return (await import("@johnmorrisdotca/tsunagi/levels-4")).TSUNAGI_4;
  if (size === 5) return (await import("@johnmorrisdotca/tsunagi/levels-5")).TSUNAGI_5;
  if (size === 6) return (await import("@johnmorrisdotca/tsunagi/levels-6")).TSUNAGI_6;
  if (size === 7) return (await import("@johnmorrisdotca/tsunagi/levels-7")).TSUNAGI_7;
  if (size === 8) return (await import("@johnmorrisdotca/tsunagi/levels-8")).TSUNAGI_8;
  if (size === 9) return (await import("@johnmorrisdotca/tsunagi/levels-9")).TSUNAGI_9;
  if (size === 10) return (await import("@johnmorrisdotca/tsunagi/levels-10")).TSUNAGI_10;
  if (size === 11) return (await import("@johnmorrisdotca/tsunagi/levels-11")).TSUNAGI_11;
  if (size === 12) return (await import("@johnmorrisdotca/tsunagi/levels-12")).TSUNAGI_12;
  if (size === 13) return (await import("@johnmorrisdotca/tsunagi/levels-13")).TSUNAGI_13;
  if (size === 14) return (await import("@johnmorrisdotca/tsunagi/levels-14")).TSUNAGI_14;
  if (size === 15) return (await import("@johnmorrisdotca/tsunagi/levels-15")).TSUNAGI_15;
  if (size === 20) return (await import("@johnmorrisdotca/tsunagi/levels-20")).TSUNAGI_20;
  if (size === 25) return (await import("@johnmorrisdotca/tsunagi/levels-25")).TSUNAGI_25;
  if (size === 30) return (await import("@johnmorrisdotca/tsunagi/levels-30")).TSUNAGI_30;
  throw new Error(`No Tsunagi at ${size}×${size}.`);
});

/** A size's levels in a set, read from their module: `loadTsunagiLevels` for a caller with no browser. */
export function loadTsunagiLevelsFromModule(size: number, set: TsunagiSet = "classic"): Promise<readonly LevelRow[]> {
  return loadTsunagiLevels(size, set);
}
