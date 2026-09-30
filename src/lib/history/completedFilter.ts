import { EVERY_GAME_KEY, EVERY_KIND_KEY, gameCopyFor, type GameKey } from "@/lib/catalogue/gameKeys";
import { listedGameOf } from "@/lib/catalogue/gameSettings";
import { HOME_FAMILIES, familyKeyNow, familyShows } from "@/lib/gomoku/families";
import type { GameFamily } from "@/lib/gomoku/families.types";
import { gameKeyFor, slugFor } from "@/lib/gomoku/slugs";

import { viewHref } from "./myGamesViews";

/**
 * THE COMPLETED TAB NARROWED TO ONE GAME OR ONE FAMILY. John, 2026-09-30,
 * right after asking for one list: "Allow filters. For the game type /
 * family". The list stays one list; these narrow it, and the choice is in
 * the address (`?family=<key>`, `?game=<slug>`) so it can be linked, reloaded
 * and taken off again.
 *
 * A family narrows to every game its shelf shows, as the family page shows
 * them, and a game to itself with its settings (a Gomoji in French is still
 * Gomoji). A game chosen inside a family wins: it is the narrower of the two.
 */
export type CompletedFilter = {
  family: GameFamily | null;
  game: GameKey | null;
  /** Every kind a row may be to be shown, or null for every one. */
  only: readonly GameKey[] | null;
};

/** The filter an address asks for; anything unknown is no filter, never an error. */
export function completedFilter(family: string | null, game: string | null): CompletedFilter {
  const chosenFamily = family === null ? null : (HOME_FAMILIES.find((one) => one.key === familyKeyNow(family)) ?? null);
  const chosenGame = game === null ? null : gameKeyFor(game);
  const only =
    chosenGame !== null
      ? EVERY_KIND_KEY.filter((key) => listedGameOf(key) === chosenGame)
      : chosenFamily !== null
        ? EVERY_KIND_KEY.filter((key) => familyShows(chosenFamily, listedGameOf(key) as GameKey))
        : null;
  return { family: chosenFamily, game: chosenGame, only };
}

/** The Completed tab's address with this narrowing, and a page's start where one is given. */
export function completedHref(narrowing: { family?: string | null; game?: string | null }, cursor: string | null = null): string {
  const query = new URLSearchParams();
  if (narrowing.family) query.set("family", narrowing.family);
  if (narrowing.game) query.set("game", narrowing.game);
  if (cursor !== null) query.set("cursor", cursor);
  const search = query.toString();
  return search === "" ? viewHref("completed") : `${viewHref("completed")}?${search}`;
}

/** The choices the filter offers: every family with a shelf, and every game by its name. */
export function completedChoices(): { families: { key: string; title: string }[]; games: { slug: string; label: string }[] } {
  return {
    families: HOME_FAMILIES.map((family) => ({ key: family.key, title: family.title })),
    games: EVERY_GAME_KEY.map((key) => ({ slug: slugFor(key), label: gameCopyFor(key).label })).sort((a, b) => a.label.localeCompare(b.label)),
  };
}
