import { existsSync } from "node:fs";
import { join } from "node:path";

import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * Whether a screenshot exists for a game, under `public/art/games/`. The
 * screenshot spec writes them; a rules page shows one when it is there and
 * says nothing when it is not, so a new game never shows a broken image.
 */
export function hasGameImage(variant: RuleVariant): boolean {
  return existsSync(join(process.cwd(), "public", "art", "games", `${variant}.jpg`));
}
