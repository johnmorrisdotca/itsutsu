import type { ResultOutcome, ResultReason, ResultScore } from "@/lib/history/gameResult.types";

/** The headline said to a player, where the card speaks to "you". */
export const RESULT_HEADLINES: Record<Exclude<ResultOutcome, "decided">, { label: string; kanji: string }> = {
  won: { label: "You won", kanji: "勝ち" },
  lost: { label: "You lost", kanji: "負け" },
  draw: { label: "Draw", kanji: "引き分け" },
};

/**
 * WHY, IN ONE SENTENCE — about the winner (`who`) or about the side that lost
 * (`other`), whichever the ending is a fact about. Either may be "You", so every
 * sentence reads with "You" in it as well as with a name or a colour.
 */
export const RESULT_REASONS: Record<ResultReason, (who: string, other: string) => string> = {
  line: (who) => `${who} completed a winning line.`,
  captures: (who) => `${who} captured enough to win.`,
  time: (_who, other) => `${other} ran out of time.`,
  resign: (_who, other) => `${other} resigned.`,
  trap: (_who, other) => `${other} had no way out.`,
  square: (who) => `${who} made the winning square.`,
  full: (who) => `${who} led when the board filled.`,
  count: (who) => `${who} had more discs at the end.`,
  camp: (who) => `${who} filled the far camp first.`,
  connection: (who) => `${who} joined both sides of the board.`,
  blocked: (_who, other) => `${other} had no move left.`,
  territory: (who) => `${who} held more of the board.`,
  /*
   * A draw's reasons, in the board's own words (`GAME_COPY.draw…`) less the
   * "Draw." the card's headline has already said.
   */
  unfinishable: () => "Nobody was getting anywhere, so it could not be finished.",
  noMoves: () => "Neither side had a move left.",
  repetition: () => "The same position came round again, with the same side to move.",
  endgameCount: () => "The ending was not won within the moves its rules allow.",
  length: () => "The game ran to the length it was given.",
  bothLines: () => "Both made a line at once.",
  boardFull: () => "The board filled with nobody winning.",
  draw: () => "Neither side won.",
};

/** What a score counts. */
export const RESULT_SCORE_WORDS: Record<ResultScore["kind"], string> = {
  captures: "Pairs captured",
  discs: "Discs",
  area: "Area",
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

export const RESULT_CARD_COPY = {
  rematch: "Rematch 再戦",
  again: "Play again 再戦",
  newGame: "New game 新規",
  review: "Review the moves 棋譜",
  close: "Close 閉じる",
  xp: (points: number) => `+${points} XP from this game`,
  waiting: (count: number) => (count === 1 ? "Your move in 1 game" : `Your move in ${count} games`),
} as const;
