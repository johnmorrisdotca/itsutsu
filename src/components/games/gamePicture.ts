import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
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
export function pictureOf({ variant, name }: { variant?: string; name?: string }): RuleVariant | null {
  if (variant !== undefined) {
    if (variant in RULE_VARIANT_DISPLAY) return variant as RuleVariant;
    return variantFor(variant);
  }
  return name === undefined ? null : aliasedVariant(name);
}
