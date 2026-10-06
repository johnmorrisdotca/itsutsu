import { readFileSync } from "node:fs";
import { join } from "node:path";

import { unpackText } from "@/lib/packed/pack";

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

type Layouts = { classic: Record<number, readonly string[]>; portals: Record<number, readonly string[]> };
let everyLayout: Layouts | null = null;

/**
 * Every size's boards, read from `tsunagiLayouts.json.br` (`src/lib/packed/`, 76 KB) the first time a server needs one and
 * once for the life of the process, by a path the build's tracer can follow, so keep it literal. The package's own copy was
 * 335 KB of source in the pages' function (measured 2026-10-06); `pnpm data:pack` writes the file from it and
 * `packedData.coverage.test.ts` fails when the two come apart.
 */
function packedLayouts(): Layouts {
  everyLayout ??= JSON.parse(unpackText(readFileSync(join(process.cwd(), "src/lib/packed", "tsunagiLayouts.json.br")))) as Layouts;
  return everyLayout;
}

readTsunagiLayoutsWith(async (size, set) => {
  const layouts = packedLayouts()[set === "portals" ? "portals" : "classic"][size];
  if (layouts === undefined) throw new Error(`No Tsunagi ${set === "portals" ? "with portals " : ""}at ${size}×${size}.`);
  return layouts.map((layout) => [layout, NO_ANSWER] as const);
});

/** A size's boards in a set, read from their module: `loadTsunagiLevels` for a server. */
export function loadTsunagiLayoutsFromModule(size: number, set: TsunagiSet = "classic"): Promise<readonly LevelRow[]> {
  return loadTsunagiLevels(size, set);
}
