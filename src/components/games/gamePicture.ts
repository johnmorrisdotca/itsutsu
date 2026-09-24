import { type GameKey, gameCopyOf } from "@/lib/catalogue/gameKeys";
import { gameKeyFor } from "@/lib/gomoku/slugs";
import { aliasedVariant } from "@/lib/legacy/gameAliases";

/**
 * Which game's picture belongs beside a name, or null for none.
 *
 * The same three ways in that `GameName` accepts, answered the same way, so a
 * name and the picture beside it can never be about two different games:
 *
 *  - a variant key — `freestyle`;
 *  - a slug — `gomoku`, the form a game has in an address;
 *  - a NAME somebody wrote down elsewhere — "Keryo Pente" in a record kept
 *    from another site — which is our game only where `gameAliases` says so.
 *
 * NULL FOR A NAME WITH NO GAME HERE, and null is the whole point. "Backgammon"
 * in an ItsYourTurn record is not a game this site plays, and the nearest
 * picture to it would be a board that claims something untrue. No picture is
 * the honest answer; a wrong one is the dangerous one.
 */
export function pictureOf({ variant, name }: { variant?: string; name?: string }): GameKey | null {
  if (variant !== undefined) {
    if (gameCopyOf(variant) !== null) return variant as GameKey;
    return gameKeyFor(variant);
  }
  return name === undefined ? null : aliasedVariant(name);
}
