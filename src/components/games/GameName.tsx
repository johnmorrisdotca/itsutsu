import Link from "next/link";

import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { rulesPath } from "@/lib/gomoku/slugs";
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
  kanji = false,
  raised = false,
  className = "",
}: {
  variant: RuleVariant;
  /** Show the Japanese name beside it, small, the way a heading does. */
  kanji?: boolean;
  /** Lift it above a stretched row link. */
  raised?: boolean;
  className?: string;
}) {
  const copy = RULE_VARIANT_DISPLAY[variant];
  return (
    <Link
      href={rulesPath(variant)}
      data-testid="game-name"
      data-variant={variant}
      className={`underline-offset-2 hover:underline ${raised ? "relative z-10" : ""} ${className}`}
    >
      {copy.label}
      {kanji ? <span className="font-mincho ml-1.5 text-xs font-normal opacity-70">{copy.kanji}</span> : null}
    </Link>
  );
}
