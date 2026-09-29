import "server-only";

import { preparePuzzle } from "./generate";
import type { KumimojiLanguage } from "./kumimoji/kumimoji.types";
import { loadTileWordsFromModule } from "./kumimoji/tileWordsModule";
import type { PuzzleKind } from "./puzzles.types";

/**
 * `preparePuzzle` for the server's own checks — a solve handed in, a race's
 * answer — which load Kumimoji's lists from their module (`tileWordsModule.ts`)
 * rather than as a browser does.
 */
export async function preparePuzzleOnServer(kind: PuzzleKind, size: number, language: KumimojiLanguage = "english"): Promise<void> {
  if (kind === "kumimoji") await loadTileWordsFromModule(language);
  await preparePuzzle(kind, size, language);
}
