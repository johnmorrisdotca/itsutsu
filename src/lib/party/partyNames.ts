import { playerNumberName } from "../gomoku/seatWords";
import type { Speaker } from "../i18n/i18n";

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

/** A seat's name as the table reads it: the one given, or "Player 3" or "対局者3". */
export function partyPlayerName(game: { players: readonly string[] }, seat: number, say: Speaker): string {
  const given = game.players[seat]?.trim() ?? "";
  return given === "" ? playerNumberName(say, seat + 1) : given;
}

/** "Computer 3" or "コンピュータ3": what the nth seat is called when a computer sits there and nobody named it. */
export function computerNumberName(say: Speaker, number: number): string {
  return say.say("party.computerNumber", { number: String(number) });
}

/** A seat's name at a table where some seats are computers: the one given, or "Computer 3" or "Player 3". */
export function seatedName(game: { players: readonly string[]; computers: readonly boolean[] }, seat: number, say: Speaker): string {
  const given = game.players[seat]?.trim() ?? "";
  if (given !== "") return given;
  return game.computers[seat] === true ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1);
}
