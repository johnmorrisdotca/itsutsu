import "server-only";

// Every list, read from its module: there is no browser here to fetch one (`everyListModule.ts`).
import "./everyListModule";
import { preparePuzzle } from "./generate";
import { TSUNAGI_PORTAL_SIZES } from "./tsunagi/levels";
import { loadTsunagiLayoutsFromModule } from "./tsunagi/layoutsModule";
import type { KumimojiLanguage } from "./kumimoji/kumimoji.types";
import type { PuzzleKind } from "./puzzles.types";

/**
 * `preparePuzzle` for the server's own checks — a solve handed in, a race's
 * answer — which read every list from its module (`everyListModule.ts`)
 * rather than as a browser does. No page imports this: a page's server function
 * would carry every list with it (`listTracing.coverage.test.ts`).
 */
export async function preparePuzzleOnServer(kind: PuzzleKind, size: number, language: KumimojiLanguage = "english", seed?: number | null): Promise<void> {
  await preparePuzzle(kind, size, language, seed);
  // A Suido solve is a level's when its board's hash is one of its size's (`suidoLevelOfBoard`): no level is read for it.
  // Likewise a Tsunagi solve is a level of the first set or of the portals': both are read wherever the size has them, whatever seed was sent.
  if (kind === "tsunagi" && (TSUNAGI_PORTAL_SIZES as readonly number[]).includes(size)) await loadTsunagiLayoutsFromModule(size, "portals");
}
