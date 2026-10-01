import { type LevelRow, loadTsunagiLevels, readTsunagiLevelsWith } from "./levels";

/**
 * TSUNAGI'S LEVELS WHERE THERE IS NO BROWSER: the server's own checks and its
 * records of who solved which level (`tsunagiRecords.ts`), a unit test, a
 * browser spec's own process. Importing this module is what lets
 * `loadTsunagiLevels` answer there (see `levels.ts`).
 */
readTsunagiLevelsWith(async (size) => {
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
  throw new Error(`No Tsunagi at ${size}×${size}.`);
});

/** A size's levels, read from their module: `loadTsunagiLevels` for a caller with no browser. */
export function loadTsunagiLevelsFromModule(size: number): Promise<readonly LevelRow[]> {
  return loadTsunagiLevels(size);
}
