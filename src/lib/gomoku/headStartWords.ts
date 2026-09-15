import { STONE_DISPLAY } from "./gomoku.constants";
import { hasHeadStart, headStartOf, traditionalKind } from "./rules/headStart";
import type { HeadStart, TraditionalHeadStart } from "./gomoku.types";

/*
 * A HEAD START IN WORDS, said the same way everywhere a game is described: the
 * set-up screen and its summary, the doorstep, the rules beside a board, the
 * status under it, the result card and the history. One sentence from one
 * function, so what somebody agreed to and what the record says they played
 * cannot drift into two descriptions of one game.
 */

/** The name of the thing, where a page heads or labels it. */
export const HEAD_START_DISPLAY = { label: "Head start", kanji: "先手" } as const;

/** Each game's own traditional head start, as a person reading the rules would say it. */
export const TRADITIONAL_HEAD_START_DISPLAY: Record<
  TraditionalHeadStart,
  { label: string; kanji: string; description: string; from: string; count: (given: number) => string }
> = {
  stones: {
    label: "Handicap stones",
    kanji: "置き石",
    description:
      "Stones set on the star points before the first move. The other colour then moves first, and komi is half a point.",
    from: "Go",
    count: (given) => `${given} handicap stones`,
  },
  corners: {
    label: "Corners",
    kanji: "隅",
    description: "Discs of this colour on the corners before the first move, which nothing can ever turn.",
    from: "Othello",
    count: (given) => (given === 1 ? "1 corner" : `${given} corners`),
  },
  men: {
    label: "Men off",
    kanji: "駒落ち",
    description: "Men taken off the other side's back row before the first move: odds of a man, as the clubs gave them.",
    from: "Draughts",
    count: (given) => (given === 1 ? "a man off the other side" : `${given} men off the other side`),
  },
};

/** "1 free turn", "3 free turns". */
export function freeTurnsWords(turns: number): string {
  return turns === 1 ? "1 free turn" : `${turns} free turns`;
}

/**
 * The head start in a phrase — "Black head start: 2 free turns, 4 handicap
 * stones" — or null for an even game. The same shape as `describeHandicap`'s
 * "Black handicap: no double three", so the two read as one kind of fact.
 */
export function describeHeadStart(settings: { variant: string; headStart?: HeadStart | null }): string | null {
  if (!hasHeadStart(settings)) return null;
  const { stone, freeTurns, traditional } = headStartOf(settings);
  if (stone === null) return null;
  const parts: string[] = [];
  if (freeTurns > 0) parts.push(freeTurnsWords(freeTurns));
  const kind = traditionalKind(settings.variant);
  if (kind !== null && traditional > 0) parts.push(TRADITIONAL_HEAD_START_DISPLAY[kind].count(traditional));
  return `${STONE_DISPLAY[stone].label} head start: ${parts.join(", ")}`;
}
