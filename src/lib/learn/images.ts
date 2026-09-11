import { existsSync } from "node:fs";
import { join } from "node:path";

import { gameArtPath, gameThumbPath } from "@/lib/gomoku/artwork";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * Whether a screenshot exists for a game, under `public/art/games/`.
 *
 * A build-time question, asked by the New Game Gate — a variant without one
 * fails `variants.coverage.test.ts` and cannot ship.
 *
 * Do not ask it while serving a page. Not because it is known to answer
 * wrongly there: the live site shows these screenshots today, so whatever
 * Vercel does with `public/` it is evidently reachable. It is that the answer
 * depends on how the deployment lays files out rather than on anything this
 * code decides, and it is being asked about something the build has already
 * guaranteed. A page that believed a false answer would drop the figure in
 * production and nowhere else, which is the kind of failure nobody finds by
 * looking locally.
 */
export function hasGameImage(variant: RuleVariant): boolean {
  return existsSync(join(process.cwd(), "public", gameArtPath(variant)));
}

/**
 * Whether the small board a list draws beside the game's name exists — cut
 * from the screenshot by `pnpm art:thumbs`. The same gate asks it, for the
 * same reason: a row with a broken picture in it is a gate violation, not a
 * thing to paper over with a fallback.
 */
export function hasGameThumb(variant: RuleVariant): boolean {
  return existsSync(join(process.cwd(), "public", gameThumbPath(variant)));
}
