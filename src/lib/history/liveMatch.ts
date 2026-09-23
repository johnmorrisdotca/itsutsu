import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";

import type { CreationAsked, CreationRefusal } from "./liveRequest";

/**
 * A MATCH: two, four or six games made at once between the same two players,
 * the colours alternating from one to the next.
 *
 * In most of these games the colour that moves first has a real advantage, so
 * one game is only fair if the colours are decided fairly; several at once,
 * with each player taking each colour equally often, cancels the advantage
 * over the match instead. GoldToken offers No / Two-game / Four-game /
 * Six-game, ItsYourTurn the same, and John played on both for years.
 *
 * Every game in a match is an ordinary game in every way but its making: it is
 * rated on its own, resigned on its own and timed out on its own. The two
 * places a match is one thing rather than several are here, where they are
 * made, and the answer to an offer — accepting or declining one game of a
 * match answers all of it (`offerAnswer.ts`), because half a match accepted is
 * the unfair single game again.
 */

/** The sizes offered, as GoldToken offers them. One is an ordinary game. */
export const MATCH_SIZES = [1, 2, 4, 6] as const;
export type MatchSize = (typeof MATCH_SIZES)[number];

/**
 * Why this request cannot be a match, or null when it can.
 *
 * A match needs somebody NAMED on the other side — a member or a computer —
 * because what makes it fair is that the same two players take each colour.
 * The cases that do not have that are refused rather than quietly made as one
 * game, so a caller that asked for four games never finds it has one:
 *
 * - a posted seat or a link, where whoever sits down is not known when the
 *   games are made, and could take one game of the match and leave the rest;
 * - one screen shared by two people, where the colours are only chairs;
 * - a rematch or a fork, which carry the colours of the game they came from.
 */
export function matchRefusal(asked: CreationAsked): CreationRefusal | null {
  const { games, open, hotSeat, rematch, from, challenge, challengeId } = asked.data;
  if (games === 1) return null;
  const refuse = (why: string): CreationRefusal => ({ status: 422, error: `A match of ${games} games ${why}` });
  if (open) return refuse("needs somebody named to play; a posted seat could be taken for one game and not the rest.");
  if (hotSeat) return refuse("is between two players, not two chairs at one screen.");
  if (rematch !== undefined || from !== undefined) return refuse("starts fresh; a rematch or a fork keeps the colours it came from.");
  if (challenge === undefined && challengeId === undefined) return refuse("needs somebody named to play.");
  return null;
}

/** The other colour, without reaching into the engine for one line. */
function other(stone: Stone): Stone {
  return stone === STONES.black ? STONES.white : STONES.black;
}

/**
 * The request for each game of the match, in order: the first as asked, and
 * every other one with the asker's colour and the two typed names swapped.
 *
 * The names swap with the colour because a name typed for black names the
 * person in the black seat; left where it was, the second game would call the
 * asker by their opponent's name.
 */
export function matchAsks(asked: CreationAsked): CreationAsked[] {
  const first: Stone = asked.data.asColour ?? STONES.black;
  return Array.from({ length: asked.data.games }, (_, index) => {
    if (index % 2 === 0) return { ...asked, data: { ...asked.data, asColour: first } };
    return {
      ...asked,
      data: {
        ...asked.data,
        asColour: other(first),
        blackName: asked.data.whiteName,
        whiteName: asked.data.blackName,
      },
    };
  });
}
