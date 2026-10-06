import "server-only";

// Every list, read from its module: there is no browser here to fetch one (`everyListModule.ts`).
import "./everyListModule";
import { preparePuzzle } from "./generate";
import { TSUNAGI_PORTAL_SIZES } from "./tsunagi/levels";
import { loadTsunagiLayoutsFromModule } from "./tsunagi/layoutsModule";
import type { KumimojiLanguage } from "./kumimoji/kumimoji.types";
import type { PuzzleKind } from "./puzzles.types";
import { loadSuidoLevelsAt } from "./suido/levels";
import { isSuidoHugeSize, isSuidoLevelSize } from "./suido/sizes";

/**
 * `preparePuzzle` for the server's own checks — a solve handed in, a race's
 * answer — which read every list from its module (`everyListModule.ts`)
 * rather than as a browser does. No page imports this: a page's server function
 * would carry every list with it (`listTracing.coverage.test.ts`).
 */
export async function preparePuzzleOnServer(kind: PuzzleKind, size: number, language: KumimojiLanguage = "english", seed?: number | null): Promise<void> {
  await preparePuzzle(kind, size, language, seed);
  // A Suido solve is a level's when its board is one of its size's levels, which a browser says by sending the seed and a server does not take its word for: the size's levels are read whenever it has any, so a board is a level or not by what it is.
  // The thirteen sizes a server reads; a huge one is known by a hash (`suidoLevelOfBoard`), never loaded here.
  if (kind === "suido" && isSuidoLevelSize(size) && !isSuidoHugeSize(size)) await loadSuidoLevelsAt(size);
  // Likewise a Tsunagi solve is a level of the first set or of the portals': both are read wherever the size has them, whatever seed was sent.
  if (kind === "tsunagi" && (TSUNAGI_PORTAL_SIZES as readonly number[]).includes(size)) await loadTsunagiLayoutsFromModule(size, "portals");
}
