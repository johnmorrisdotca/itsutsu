import type { Speaker } from "../i18n/i18n";

import { STONE_DISPLAY } from "./gomoku.constants";
import type { Seat, Stone } from "./gomoku.types";

/**
 * A colour or a seat, named in the reader's language.
 *
 * A colour is the English label beside its own kanji (Black 黒), and a Japanese
 * reader is shown the kanji alone (`Speaker.pairName`), so "you play black" and
 * "黒番" read as one language. A seat is "Player 1" or "対局者1", for the one
 * nobody gave a name to. Apart from `gomoku.constants.ts`, which only names.
 */

/** "Black" or "黒". Lower-cased where a sentence wants it ("black"), which a kanji does not change. */
export function stoneName(say: Speaker, stone: Stone): string {
  const { label, kanji } = STONE_DISPLAY[stone];
  return say.pairName(label, kanji).text;
}

/** "Player 1" or "対局者1": what a seat is called when its player gave no name. */
export function seatName(say: Speaker, seat: Seat): string {
  return say.say(seat === "one" ? "gomoku.seatOne" : "gomoku.seatTwo");
}

/** "Player 3" or "対局者3": the name of the nth place at a table that nobody named. */
export function playerNumberName(say: Speaker, number: number): string {
  return say.say("gomoku.playerNumber", { number: String(number) });
}

/** A name and its kanji as one line of text: "Renju 連珠" for an English reader, "連珠" for a Japanese one. */
export function pairedText(say: Speaker, english: string, kanji: string): string {
  const shown = say.pairName(english, kanji);
  return shown.kanji === null ? shown.text : `${shown.text} ${shown.kanji}`;
}

/** "Black · 黒" for an English reader, "黒" for a Japanese one: a label and its kanji in a line or an option. */
export function dottedText(say: Speaker, english: string, kanji: string): string {
  const shown = say.pairName(english, kanji);
  return shown.kanji === null ? shown.text : `${shown.text} · ${shown.kanji}`;
}
