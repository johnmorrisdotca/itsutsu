import Link from "next/link";

import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { aliasedVariant } from "@/lib/legacy/gameAliases";
import { rulesPath, variantFor } from "@/lib/gomoku/slugs";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * A game's name, leading to that game.
 *
 * The standing rule, and the twin of "every person's name leads to their
 * page": wherever a game is named, the name is the way in. It is the kind of
 * rule that is obeyed in one list and forgotten in the next list somebody
 * writes — the games index printed every game's name as plain words with a
 * small "rules" beside it, and the record list named the game of every match
 * and led nowhere at all.
 *
 * To the rules page rather than to the board. A name in a list or a sentence
 * is a reference to the game, not an instruction to start one, and the rules
 * page is where a game says what it is and offers to be played. The About
 * page's own `Game` helper goes straight to the board on purpose — a reader
 * who meets Pente mid-sentence is being invited to play it — and that is
 * still a link to that game, which is what the rule asks for.
 *
 * `raised` is for a row that is itself one big stretched link: the record list
 * lays a link over the whole card, and a link inside it has to sit above that
 * one to be clickable at all. `PlayerName` does the same thing beside it.
 */
export function GameName({
  variant,
  name,
  kanji = false,
  raised = false,
  className = "",
}: {
  /** The game, as a variant key or as its slug. */
  variant?: string;
  /**
   * The name as it was written, where written words are what there is.
   *
   * A record kept from another site lists its own names for games — Flipversi,
   * Keryo Pente — and `gameAliases` knows which of ours those are, so they
   * link like any other name. The ones with no game here (Backgammon, Chess)
   * are said plainly instead: the rule is only honest if its exceptions look
   * like exceptions, and a link that cannot keep its promise is worse than a
   * plain word.
   */
  name?: string;
  /** Show the Japanese name beside it, small, the way a heading does. */
  kanji?: boolean;
  /** Lift it above a stretched row link. */
  raised?: boolean;
  className?: string;
}) {
  const known = knownGame(variant, name);
  const copy = known === null ? null : RULE_VARIANT_DISPLAY[known];

  if (known === null || copy === null) {
    return (
      <span
        className={`text-muted italic ${className}`}
        title="Not a game played here — this is from a record kept from elsewhere."
        data-testid="game-not-here"
      >
        {name ?? variant ?? ""}
      </span>
    );
  }
  return (
    <Link
      href={rulesPath(known)}
      data-testid="game-name"
      data-variant={known}
      className={`underline-offset-2 hover:underline ${raised ? "relative z-10" : ""} ${className}`}
    >
      {name ?? copy.label}
      {kanji ? <span className="font-mincho ml-1.5 text-xs font-normal opacity-70">{copy.kanji}</span> : null}
    </Link>
  );
}

/** Which of our games this is, whether it arrived as a key, a slug or a name. */
function knownGame(variant: string | undefined, name: string | undefined): RuleVariant | null {
  if (variant !== undefined) {
    if (variant in RULE_VARIANT_DISPLAY) return variant as RuleVariant;
    return variantFor(variant);
  }
  return name === undefined ? null : aliasedVariant(name);
}
