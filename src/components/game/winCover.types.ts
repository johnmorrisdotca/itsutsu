import type { ResultOutcome } from "@/lib/history/gameResult.types";

/**
 * THE ONE STRONGEST NEXT STEP a finished game offers, as its finish panel
 * offers it first: a press (Deal again, Another, New game) or an address (Next
 * level, a puzzle's board of levels).
 */
export type WinStep = { label: string; onPress: () => void } | { label: string; href: string };

/**
 * WHAT THE COVER OVER A FINISHED BOARD SAYS, decided without React
 * (`winNews.ts`) so each wording can be tested.
 *
 * `tone` is the result card's own (`RESULT_CARD_TONE`): `won` said to the one
 * it is about, `decided` a winner named at a device several people share,
 * `lost` a quieter cover naming who beat you, `draw` nobody.
 */
export type WinNews = {
  tone: ResultOutcome;
  /** The large kanji at the top: 解 solved, 勝 won, 引 drawn, 終 the end of a game somebody else won. */
  mark: string;
  /** "Solved 解決 in 4:49": the English, its kanji, and what follows the kanji. */
  headline: { label: string; kanji: string; after?: string };
  /** A line under the headline: by how much, and how. */
  detail?: string | null;
  /**
   * The XP the finish paid. Undefined where nothing is paid (a table, a
   * practice board); null while it is still being recorded, so the line keeps
   * its room and fills in place.
   */
  xp?: string | null;
  next?: WinStep | null;
};
