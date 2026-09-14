import { STONE_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { GameResultFacts, ResultScore } from "@/lib/history/gameResult.types";
import { shownName } from "@/lib/rating/shownName";

import { RESULT_HEADLINES, RESULT_REASONS, RESULT_SCORE_WORDS } from "./resultCard.constants";

/**
 * THE RESULT CARD'S WORDS, decided without React so each can be tested.
 *
 * "You" is said only to a player. A game at one screen is said by colour —
 * "Black wins" — because both people at the board are "you", and telling one of
 * them they lost while the other reads the same screen would be telling both.
 */

/** The headline: "You won", "You lost", "Draw", or the winning colour. */
export function headlineOf(facts: GameResultFacts): { label: string; kanji: string } {
  if (facts.outcome !== "decided") return RESULT_HEADLINES[facts.outcome];
  const winner = STONE_DISPLAY[facts.winner ?? STONES.black];
  return { label: `${winner.label} wins`, kanji: `${winner.kanji}の勝ち` };
}

/** Why, in one sentence, naming the side each ending is about. */
export function reasonOf(facts: GameResultFacts, names: { black: string; white: string }): string {
  if (facts.winner === null) return RESULT_REASONS[facts.reason]("", "");
  const winner = facts.winner;
  const loser: Stone = winner === STONES.black ? STONES.white : STONES.black;
  const named = (stone: Stone) => shownName(names[stone]).trim() || STONE_DISPLAY[stone].label;
  const word = (stone: Stone) => {
    if (facts.outcome === "decided") return STONE_DISPLAY[stone].label;
    const mine = facts.outcome === "won" ? winner : loser;
    return stone === mine ? "You" : named(stone);
  };
  return RESULT_REASONS[facts.reason](word(winner), word(loser));
}

/** The score, where the game keeps one, by colour: "Discs: Black 10 · White 6". */
export function scoreWords(score: ResultScore | null): string | null {
  if (score === null) return null;
  return `${RESULT_SCORE_WORDS[score.kind]}: ${STONE_DISPLAY.black.label} ${score.black} · ${STONE_DISPLAY.white.label} ${score.white}`;
}
