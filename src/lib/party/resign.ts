/**
 * RESIGNING AT A TABLE ROUND ONE DEVICE, for every pass-and-play game.
 *
 * The rule, the same everywhere (`docs/plans/game-controls/README.md`): the
 * player to move resigns. With two seats the game ends and the other seat
 * wins. With three or more the table ends where it stands — "<name>
 * resigned", the standings as they are, nobody named the winner — because a
 * kept game is its moves played out again, and a seat that stops playing is a
 * move no engine can replay. Never rated, so nothing but the table changes.
 *
 * A resignation is a fact about the table kept beside the game, not a field
 * of any engine: it is written after the game's own text (`RESIGNED_MARK`)
 * and read back by `keptInBrowser`, so a kept game opens as it ended.
 */

/** Which seat resigned, set on a game that has: `undefined` for any other. */
export type Resigned = { readonly resignedBy?: number };

/** Written after a kept game's own text, then the seat. */
export const RESIGNED_MARK = "\n~resigned:";

/** The seat that resigned, or null. */
export function resignedBy(game: object | null | undefined): number | null {
  const seat = (game as Resigned | null | undefined)?.resignedBy;
  return typeof seat === "number" ? seat : null;
}

/** Who wins when `seat` resigns from a table of `seats`: the other one of two, nobody at a bigger table. */
export function resignWinners(seats: number, seat: number): number[] {
  return seats === 2 ? [1 - seat] : [];
}

/** The game as a resignation leaves it: `patch` ends it in the engine's own terms, and the seat is remembered. */
export function resigning<G extends object>(game: G, seat: number, patch: Partial<G>): G & { resignedBy: number } {
  return { ...game, ...patch, resignedBy: seat };
}

/** A kept game's text with its resignation, if it has one. */
export function withResignation(text: string, game: object): string {
  const seat = resignedBy(game);
  return seat === null ? text : `${text}${RESIGNED_MARK}${seat}`;
}

/** A kept game's text split into the game's own and the seat that resigned. */
export function splitResignation(text: string | null): { text: string | null; seat: number | null } {
  if (text === null) return { text, seat: null };
  const at = text.lastIndexOf(RESIGNED_MARK);
  if (at < 0) return { text, seat: null };
  const seat = Number(text.slice(at + RESIGNED_MARK.length));
  return Number.isInteger(seat) && seat >= 0 ? { text: text.slice(0, at), seat } : { text, seat: null };
}
