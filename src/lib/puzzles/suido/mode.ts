/**
 * THE TWO WAYS TO PLAY SUIDO, told apart in its set-up's address: the levels (the
 * address as it stands: `/games/suido/new`, with `?size=7` to open on a size), and
 * "Make a board", a new one from a seed at a size and a level (`?mode=make`, which
 * the rest of that screen's choices are written beside). Levels come first: what
 * the front door's Play leads to.
 */
export type SuidoMode = "levels" | "make";

export const SUIDO_MODE_PARAM = "mode";

/** The mode an address asks for: Make a board for `mode=make`, and the levels for anything else or nothing. */
export function suidoModeOf(query: Record<string, string | string[] | undefined>): SuidoMode {
  const asked = query[SUIDO_MODE_PARAM];
  return (Array.isArray(asked) ? asked[0] : asked) === "make" ? "make" : "levels";
}

/** The query that says Make a board, for a set-up that writes its own choices into the address (`PuzzleSetUp`). */
export const SUIDO_MAKE_QUERY = `${SUIDO_MODE_PARAM}=make`;
