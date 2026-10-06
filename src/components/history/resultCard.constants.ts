import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import type { ResultOutcome, ResultReason, ResultScore } from "@/lib/history/gameResult.types";

export { RESULT_HEADLINES } from "./resultNames.constants";

/**
 * WHY, IN ONE SENTENCE — about the winner or about the side that lost, whichever
 * the ending is a fact about (`about`). `said` has a `{who}` in it, and `you`
 * is the same sentence where that side is the reader, which Japanese says
 * with no subject and English with "You". A draw's reasons have no side.
 */
export const RESULT_REASONS: Record<
  ResultReason,
  { about: "winner" | "loser" | null; said: PhraseKey; you: PhraseKey | null }
> = {
  line: { about: "winner", said: "result.line", you: "result.lineYou" },
  captures: { about: "winner", said: "result.captures", you: "result.capturesYou" },
  time: { about: "loser", said: "result.time", you: "result.timeYou" },
  resign: { about: "loser", said: "result.resign", you: "result.resignYou" },
  trap: { about: "loser", said: "result.trap", you: "result.trapYou" },
  square: { about: "winner", said: "result.square", you: "result.squareYou" },
  full: { about: "winner", said: "result.full", you: "result.fullYou" },
  count: { about: "winner", said: "result.count", you: "result.countYou" },
  camp: { about: "winner", said: "result.camp", you: "result.campYou" },
  connection: { about: "winner", said: "result.connection", you: "result.connectionYou" },
  blocked: { about: "loser", said: "result.blocked", you: "result.blockedYou" },
  territory: { about: "winner", said: "result.territory", you: "result.territoryYou" },
  /*
   * A draw's reasons, in the board's own words (`GAME_COPY.draw…`) less the
   * "Draw." the card's headline has already said.
   */
  noProgressRacing: { about: null, said: "result.noProgressRacing", you: null },
  noProgressTaking: { about: null, said: "result.noProgressTaking", you: null },
  noProgressPlacing: { about: null, said: "result.noProgressPlacing", you: null },
  noMoves: { about: null, said: "result.noMoves", you: null },
  repetition: { about: null, said: "result.repetition", you: null },
  endgameCount: { about: null, said: "result.endgameCount", you: null },
  length: { about: null, said: "result.length", you: null },
  bothLines: { about: null, said: "result.bothLines", you: null },
  boardFull: { about: null, said: "result.boardFull", you: null },
  draw: { about: null, said: "result.draw", you: null },
};

/** What a score counts. */
export const RESULT_SCORE_WORDS: Record<ResultScore["kind"], PhraseKey> = {
  captures: "result.scorePairs",
  discs: "result.scoreDiscs",
  area: "result.scoreArea",
};

/**
 * THE CARD'S COLOUR: moss for a win, shu for a loss, and plain for a draw or a
 * game at one screen — where the two players are both "you", so neither colour
 * is theirs to be told off by. Border and heading together, never colour alone:
 * the headline says the same thing in words.
 */
export const RESULT_CARD_TONE: Record<ResultOutcome, { border: string; text: string }> = {
  won: { border: "border-moss", text: "text-moss" },
  lost: { border: "border-shu", text: "text-shu" },
  draw: { border: "border-rule-strong", text: "text-ink" },
  decided: { border: "border-rule-strong", text: "text-ink" },
};

/** The card's buttons: each an English label beside its own kanji (`say.pair`), and the lines of its figures. */
export const RESULT_CARD_COPY = {
  rematch: { phrase: "result.rematch", kanji: "再戦" },
  again: { phrase: "result.again", kanji: "再戦" },
  newGame: { phrase: "result.newGame", kanji: "新規" },
  review: { phrase: "result.review", kanji: "棋譜" },
  close: { phrase: "result.close", kanji: "閉じる" },
} as const satisfies Record<string, { phrase: PhraseKey; kanji: string }>;
