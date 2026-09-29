/**
 * A NAME AT A PARTY TABLE, as every party game keeps and says it: what the
 * set-up typed, tidied, or the seat's place when it was left blank.
 */

/** The longest name a seat keeps: enough for a first name and an initial, short enough for a turn line on a phone. */
export const PARTY_NAME_MOST = 20;

/** A name as the table typed it, tidied: spaces run together, trimmed, cut to `PARTY_NAME_MOST`. */
export function cleanPartyName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, PARTY_NAME_MOST);
}

/** A seat's name as the table reads it: the one given, or "Player 3". */
export function partyPlayerName(game: { players: readonly string[] }, seat: number): string {
  const given = game.players[seat]?.trim() ?? "";
  return given === "" ? `Player ${seat + 1}` : given;
}
