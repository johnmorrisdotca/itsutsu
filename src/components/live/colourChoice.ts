import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { openingDecidesColours } from "@/lib/gomoku/rules/opening";
import type { OpeningRule } from "@/lib/gomoku/gomoku.types";
import { MATCH_SIZES, type MatchSize } from "@/lib/history/liveMatch";

/**
 * WHICH SEAT THE ASKER TAKES, chosen on the set-up screen.
 *
 * GoldToken's step 2 asks "Let me be: Player 1 / Player 2". This screen never
 * asked: whoever made the game was black, and in most of these games black —
 * the opener — has a real advantage, so making the game meant taking the
 * better seat every time. Three answers now: black, white, or drawn by lot as
 * Begin is pressed.
 *
 * DRAWN IN THE BROWSER, AT THE PRESS, like a random computer opponent is: the
 * route only ever hears a colour, so a reload cannot show one and make the
 * other, and the sentence above the button can say "drawn by lot" honestly
 * until the moment it is.
 *
 * NOT OFFERED where it would be a lie. A rematch swaps the colours, a fork
 * keeps the colours that played the position, a posted seat binds its poster
 * to black by the route's own rule, and under Swap, Swap2 and the renju
 * protocols the OPENING decides who ends up which colour. `colourIsChosen`
 * says where the control appears, and the sentence under the button says the
 * same thing in words.
 */
export const COLOUR_CHOICES = { black: "black", white: "white", lot: "lot" } as const;

export type ColourChoice = (typeof COLOUR_CHOICES)[keyof typeof COLOUR_CHOICES];

/** The choice an address carries, or black for anything else. */
export function colourFromAddress(value: string | null | undefined): ColourChoice {
  return value === COLOUR_CHOICES.white || value === COLOUR_CHOICES.lot ? value : COLOUR_CHOICES.black;
}

/** Whether the asker gets to choose a seat in this game at all. */
export function colourIsChosen({
  named,
  opening,
  again,
  forked,
}: {
  /** A person or a program is named, or one is to be drawn: somebody will take the other seat. */
  named: boolean;
  opening: string;
  again: boolean;
  forked: boolean;
}): boolean {
  return named && !again && !forked && !openingDecidesColours(opening as OpeningRule);
}

/** The colour to ask the route for: a lot is settled here, by the roll the press made. */
export function colourToTake(choice: ColourChoice, roll: number): Stone {
  if (choice === COLOUR_CHOICES.white) return STONES.white;
  if (choice === COLOUR_CHOICES.lot) return roll < 0.5 ? STONES.black : STONES.white;
  return STONES.black;
}

/**
 * The match size an address asked for, or one: anything but a size the route
 * accepts is an ordinary game, the way a colour it does not know is black.
 */
export function gamesFromAddress(value: string | null | undefined): MatchSize {
  const asked = Number(value);
  return (MATCH_SIZES as readonly number[]).includes(asked) ? (asked as MatchSize) : 1;
}
