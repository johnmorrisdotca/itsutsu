// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { gamePath } from "../../gomoku/slugs";

/**
 * A table on several devices, as an address: `/games/<slug>/tables/<id>`, a
 * facet of its game like the game's matches. Members only — neither this nor
 * the seat link is in the gate's `OPEN_PATTERNS`.
 */
export function tablePath(game: string, id: string): string {
  return `${gamePath(game)}/tables/${id}`;
}

/** An open seat's link. It carries the seat, so it is handed out, never listed. */
export function tableSeatPath(game: string, id: string, token: string): string {
  return `${tablePath(game, id)}/seat/${token}`;
}
