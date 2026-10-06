import { readFileSync } from "node:fs";
import { join } from "node:path";

import { unpackText } from "@/lib/packed/pack";

import type { SuidoLevelBoards } from "./levelBoards.types";

let boards: SuidoLevelBoards | null = null;

/**
 * WHAT A SERVER KNOWS OF EVERY SUIDO LEVEL, READ FROM ITS FILE.
 *
 * `levelBoards.data.ts` is the browser's copy (`levelBoards.browser.ts`, which
 * `next.config.ts` swaps for this module in a browser build). A server never
 * imports it: an import is compiled into the build's chunks once for each group
 * of pages and once more for each route, and these hashes were 97 KB of source
 * four times over in the pages' function, measured 2026-10-06. The server reads
 * them from `suidoLevelBoards.json.br` (`src/lib/packed/`, 43 KB), the first
 * time it is asked and once for the life of the process, by a path the build's
 * tracer can follow, so keep it literal (`serverFileTracing.test.ts`). The file
 * is written from the data module by `pnpm data:pack`, and
 * `packedData.coverage.test.ts` fails when the two come apart.
 */
export function suidoLevelBoards(): SuidoLevelBoards {
  boards ??= JSON.parse(unpackText(readFileSync(join(process.cwd(), "src/lib/packed", "suidoLevelBoards.json.br")))) as SuidoLevelBoards;
  return boards;
}
