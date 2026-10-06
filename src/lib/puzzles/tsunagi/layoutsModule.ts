import { type LevelRow, loadTsunagiLevels, readTsunagiLayoutsWith, type TsunagiSet } from "./levels";

/**
 * TSUNAGI'S LEVELS ON A SERVER, BY THEIR BOARDS ALONE: the server's checks of a
 * solve and its records of who solved which level (`tsunagiRecords.ts`). A level
 * is known there by its layout, never by its answer — the solve is checked by
 * Tsunagi's own rules (`check.ts`), O(cells) — and a size's answers are over half
 * of its file, which a server function carries whether it reads them or not: with
 * the sizes up to 30×30 that is 0.3 MB the page function has no room for. So each
 * row read here is `[layout, ""]`, and the answer is the browser's (the whole level
 * is fetched there, `levels.ts`) and a unit test's or spec's (`levelsModule.ts`).
 *
 * Importing this module is what lets `loadTsunagiLevels` answer on a server.
 */
const NO_ANSWER = "";

readTsunagiLayoutsWith(async (size, set) => {
  const { TSUNAGI_LAYOUTS, TSUNAGI_PORTAL_LAYOUTS } = await import("@johnmorrisdotca/tsunagi/layouts");
  const layouts = (set === "portals" ? TSUNAGI_PORTAL_LAYOUTS : TSUNAGI_LAYOUTS)[size];
  if (layouts === undefined) throw new Error(`No Tsunagi ${set === "portals" ? "with portals " : ""}at ${size}×${size}.`);
  return layouts.map((layout) => [layout, NO_ANSWER] as const);
});

/** A size's boards in a set, read from their module: `loadTsunagiLevels` for a server. */
export function loadTsunagiLayoutsFromModule(size: number, set: TsunagiSet = "classic"): Promise<readonly LevelRow[]> {
  return loadTsunagiLevels(size, set);
}
