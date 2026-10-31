/**
 * WHAT A SEAT IS SENT IN PLACE OF THE STORED GAME, for a game with something to
 * keep from the browser: the shuffle or the dice to come, and other people's cards.
 *
 * The stored text of a seeded game is its seed and its moves, and from those every
 * hand and every throw to come can be worked out, so it never leaves the server for
 * these games (`OnlineRules.seatState`, applied in `viewOf`, the one place a table's
 * state leaves the server). A seat is sent the game as it stands, with the seed and
 * the moves gone and whatever it may not know taken out, written so `decode` reads it
 * back on the browser with no replay, since there is nothing to replay it from.
 *
 * The server never decodes this text: it reads only what it stored. A browser that
 * made up a text of this kind would only be lying to itself.
 */

/** A seed nobody can throw anything from: what the game a browser holds carries instead of the real one. */
export const NO_SEED = 0;

/** The game as text for a browser. `name` keeps one game's from being read as another's. */
export function writeSeen(name: string, game: object): string {
  return JSON.stringify({ seen: name, game });
}

/** The game a seat was sent, or null for anything else. */
export function readSeen<S>(name: string, text: string | null): S | null {
  if (text === null) return null;
  try {
    const parsed = JSON.parse(text) as { seen?: unknown; game?: unknown } | null;
    return parsed !== null && typeof parsed === "object" && parsed.seen === name && typeof parsed.game === "object" && parsed.game !== null ? (parsed.game as S) : null;
  } catch {
    return null;
  }
}

/** A fresh seed for a table, drawn on the server so nobody picks the dice or the deal they get: the platform's own random numbers, 31 bits. */
export function freshTableSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1;
}
