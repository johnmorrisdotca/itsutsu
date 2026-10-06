import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { stoneName } from "@/lib/gomoku/seatWords";
import { STONE_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { GameResultFacts, ResultScore } from "@/lib/history/gameResult.types";
import { shownName } from "@/lib/rating/shownName";

import { RESULT_HEADLINES, RESULT_REASONS, RESULT_SCORE_WORDS } from "./resultCard.constants";

/**
 * THE RESULT CARD'S WORDS, said in the reader's language. English is the
 * default, for the places with no speaker; a Japanese reader is shown one
 * language, so a headline is the kanji and a reason has no "you" in it.
 */

/** The headline: what happened, and the kanji beside it for a reader whose own writing is not Japanese. */
export function headlineOf(facts: GameResultFacts, say: Speaker = speaker("en")): { label: string; kanji: string } {
  if (facts.outcome !== "decided") return RESULT_HEADLINES[facts.outcome];
  const winner = STONE_DISPLAY[facts.winner ?? STONES.black];
  return { label: say.say("result.decided", { colour: say.pairName(winner.label, winner.kanji).text }), kanji: `${winner.kanji}の勝ち` };
}

/**
 * WHY, IN ONE SENTENCE, with the viewer as "you" where they won or lost and the
 * colours where the card is nobody's side (a game at one screen).
 */
export function reasonOf(facts: GameResultFacts, names: { black: string; white: string }, say: Speaker = speaker("en")): string {
  const reason = RESULT_REASONS[facts.reason];
  if (facts.winner === null || reason.about === null) return say.say(reason.said, { who: "" });
  const winner = facts.winner;
  const loser: Stone = winner === STONES.black ? STONES.white : STONES.black;
  const subject = reason.about === "winner" ? winner : loser;
  if (facts.outcome === "decided") return say.say(reason.said, { who: stoneName(say, subject) });
  const mine = facts.outcome === "won" ? winner : loser;
  if (subject === mine && reason.you !== null) return say.say(reason.you);
  return say.say(reason.said, { who: shownName(names[subject]).trim() || stoneName(say, subject) });
}

/** The score line: what is counted, then each colour's figure. */
export function scoreWords(score: ResultScore | null, say: Speaker = speaker("en")): string | null {
  if (score === null) return null;
  return say.say("result.scoreLine", {
    label: say.say(RESULT_SCORE_WORDS[score.kind]),
    black: stoneName(say, STONES.black),
    blackScore: String(score.black),
    white: stoneName(say, STONES.white),
    whiteScore: String(score.white),
  });
}
