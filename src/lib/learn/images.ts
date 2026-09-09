import { existsSync } from "node:fs";
import { join } from "node:path";

import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * Whether a screenshot exists for a game, under `public/art/games/`.
 *
 * A build-time question, asked by the New Game Gate — a variant without one
 * fails `variants.coverage.test.ts` and cannot ship. Do not ask it while
 * serving a page. `public/` is uploaded as static assets and is not part of
 * the server bundle, so this reads false in a deployed function however many
 * screenshots are actually being served, and a page that believed it would
 * hide every one of them in production and nowhere else.
 *
 * The rules page used to ask. It renders `SiteHeader`, which reads the
 * session, so it is rendered per request whatever `generateStaticParams`
 * suggests — the answer it got locally was never the answer it would get in
 * production.
 */
export function hasGameImage(variant: RuleVariant): boolean {
  return existsSync(join(process.cwd(), "public", "art", "games", `${variant}.jpg`));
}
