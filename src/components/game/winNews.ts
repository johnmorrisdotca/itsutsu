import { WIN_COVER_COPY, WIN_COVER_MARK } from "./winCover.constants";
import type { WinNews, WinStep } from "./winCover.types";

/** Names as a sentence says them: "Aiko", "Aiko and Ben", "Aiko, Ben and Chloe". */
export function namesInALine(names: readonly string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/**
 * A PUZZLE SOLVED, OR A CARD GAME WON, by the one person playing it: "Solved
 * 解決 in 4:49", or "Won 勝ち in 4:49, in 131 moves". Only ever a win: a puzzle
 * out of time or out of guesses, and a card game given up, end without a cover.
 */
export function solvedNews(input: { cards: boolean; elapsed: string; moves?: number; xp?: string | null; next: WinStep | null }): WinNews {
  const words = input.cards ? WIN_COVER_COPY.won : WIN_COVER_COPY.solved;
  return {
    tone: "won",
    mark: input.cards ? WIN_COVER_MARK.won : WIN_COVER_MARK.solved,
    headline: { ...words, after: `${WIN_COVER_COPY.took(input.elapsed)}${input.moves === undefined ? "" : WIN_COVER_COPY.moves(input.moves)}` },
    ...(input.xp === undefined ? {} : { xp: input.xp }),
    next: input.next,
  };
}

/**
 * A GAME OF TWO OR MORE, OVER: who won, said to the right person.
 *
 * - `you` is the seat this device speaks to as "you": the one person at a
 *   table of computers, or the reader's own seat at a table on several
 *   devices. Null where several people share the device, because each of them
 *   is "you" — then the winner is named, "Aiko wins", as the result card names
 *   a colour at one screen.
 * - A win by `you` is "You win 勝ち"; a win by anybody else, when there is a
 *   `you`, is the quieter cover naming them ("Computer 2 wins 勝ち").
 * - Everybody level on the most shares the win, by name; `draw` says a draw
 *   instead, for a game whose own words call a tie that (Mancala).
 * - No winner and no draw is no news: a race nobody can finish, a table ended
 *   by a member, a game given up. The cover is for a result.
 */
export function tableNews(input: {
  names: readonly string[];
  winners: readonly number[];
  you: number | null;
  draw?: boolean;
  detail?: string | null;
  next: WinStep | null;
}): WinNews | null {
  const { names, winners, you } = input;
  const detail = input.detail ?? null;
  if (input.draw === true) {
    return { tone: "draw", mark: WIN_COVER_MARK.draw, headline: { ...WIN_COVER_COPY.draw }, detail, next: input.next };
  }
  if (winners.length === 0) return null;
  const mine = you !== null && winners.includes(you);
  const tone = mine ? "won" : you !== null ? "lost" : "decided";
  const mark = tone === "lost" ? WIN_COVER_MARK.lost : WIN_COVER_MARK.won;
  const named = (seat: number) => (seat === you ? WIN_COVER_COPY.you : (names[seat] ?? `Player ${seat + 1}`));
  const label =
    winners.length > 1
      ? // "You and Chloe", the reader first, as a sentence says it.
        WIN_COVER_COPY.shareWin(namesInALine([...winners].sort((a, b) => Number(b === you) - Number(a === you)).map(named)))
      : mine
        ? WIN_COVER_COPY.youWin
        : WIN_COVER_COPY.wins(named(winners[0]!));
  return { tone, mark, headline: { label, kanji: WIN_COVER_COPY.winKanji }, detail, next: input.next };
}

/** How a table's game ended, as one line said to nobody in particular: "Aiko wins", "Draw" — the words a wallpaper's title bar carries. */
export function resultLine(names: readonly string[], winners: readonly number[], draw = false): string {
  return tableNews({ names, winners, you: null, draw, next: null })?.headline.label ?? "";
}
