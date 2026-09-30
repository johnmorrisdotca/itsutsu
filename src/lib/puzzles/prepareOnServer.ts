import "server-only";

// Every list, read from its module: there is no browser here to fetch one (`everyListModule.ts`).
import "./everyListModule";
import { preparePuzzle } from "./generate";
import type { KumimojiLanguage } from "./kumimoji/kumimoji.types";
import type { PuzzleKind } from "./puzzles.types";

/**
 * `preparePuzzle` for the server's own checks — a solve handed in, a race's
 * answer — which read every list from its module (`everyListModule.ts`)
 * rather than as a browser does. No page imports this: a page's server function
 * would carry every list with it (`listTracing.coverage.test.ts`).
 */
export async function preparePuzzleOnServer(kind: PuzzleKind, size: number, language: KumimojiLanguage = "english"): Promise<void> {
  await preparePuzzle(kind, size, language);
}
