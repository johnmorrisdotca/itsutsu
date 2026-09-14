import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";

import { SET_UP_COPY } from "./live.constants";
import type { HeadingTitle, RematchHeadingState } from "./setUp.types";

/**
 * A REMATCH'S HEADING, IN WORDS, from where the choices stand now.
 *
 * The same three answers the notice under it gives (`SetUpNotices`): the same game
 * again against the same player is a rematch, "Play them again"; anything else is
 * a new game, named for whoever it is against, or the game's own title when nobody
 * in particular is. Pure, so the server's first answer and the browser's later
 * ones cannot come to different words for the same choices.
 */
export function rematchTitle({
  againName,
  state,
  plain,
}: {
  againName: string;
  state: RematchHeadingState;
  plain: HeadingTitle;
}): HeadingTitle {
  if (state.repeat) return { en: SET_UP_COPY.again(againName), kanji: "再戦" };
  if (state.opponent !== null) return { en: SET_UP_COPY.against(state.opponent.name), kanji: "対局" };
  return plain;
}

/**
 * The swapped colour, only while it is still a rematch: a changed one, or one
 * against somebody else, is a new game that swaps nothing, and naming the swap
 * over it would be the promise Begin broke.
 */
export function swapNote(state: RematchHeadingState, colour: Stone): string | null {
  return state.repeat ? `you take ${STONE_DISPLAY[colour].label}` : null;
}
