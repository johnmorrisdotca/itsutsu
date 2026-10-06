import type { Speaker } from "../i18n/i18n";

import { stoneName } from "./seatWords";
import { TRADITIONAL_HEAD_START_DISPLAY } from "./headStartNames.constants";
import { hasHeadStart, headStartOf, traditionalKind } from "./rules/headStart";
import type { HeadStart } from "./gomoku.types";

/*
 * A HEAD START IN WORDS, said the same way everywhere a game is described: the
 * set-up screen and its summary, the doorstep, the rules beside a board, the
 * status under it, the result card and the history. One sentence from one
 * function, so what somebody agreed to and what the record says they played
 * cannot drift into two descriptions of one game.
 */

export { HEAD_START_DISPLAY, TRADITIONAL_HEAD_START_DISPLAY } from "./headStartNames.constants";

/** "1 free turn", "3 free turns", "先行3手". */
export function freeTurnsWords(turns: number, say: Speaker): string {
  return say.count("headstart.freeTurn", turns);
}

/**
 * The head start in a phrase — "Black head start: 2 free turns, 4 handicap
 * stones" — or null for an even game. The same shape as `describeHandicap`'s
 * "Black handicap: no double three", so the two read as one kind of fact.
 */
export function describeHeadStart(settings: { variant: string; headStart?: HeadStart | null }, say: Speaker): string | null {
  if (!hasHeadStart(settings)) return null;
  const { stone, freeTurns, traditional } = headStartOf(settings);
  if (stone === null) return null;
  const parts: string[] = [];
  if (freeTurns > 0) parts.push(freeTurnsWords(freeTurns, say));
  const kind = traditionalKind(settings.variant);
  if (kind !== null && traditional > 0) parts.push(say.count(TRADITIONAL_HEAD_START_DISPLAY[kind].count, traditional));
  return say.say("headstart.described", { colour: stoneName(say, stone), parts: say.joined(parts) });
}
