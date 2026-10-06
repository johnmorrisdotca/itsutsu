import { puzzleTable } from "@/lib/i18n/puzzleTables";
import type { Speaker } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n.types";
import { SEAT_WINDS, seatName as packageSeatName, type AwaseSeat } from "@johnmorrisdotca/jarajara/table";

import { MAHJONG_COPY } from "./mahjong.constants";
import { SOLITAIRE_OPTIONS } from "./solitaireOptions.constants";
import { FREECELL_COPY, SOLITAIRE_COPY, SPIDER_COPY } from "./puzzles.constants";

/**
 * The card and tile puzzles' tables of words in the reader's language. The English tables
 * stay where the code reads them, in files the pictures' stamp hashes
 * (`puzzleArtFingerprint.ts`), and the Japanese, read as text from `jaText()`, is laid over them (`copyTable.ts`).
 */
export const mahjongCopy = (locale: Locale): typeof MAHJONG_COPY => puzzleTable(MAHJONG_COPY, "mahjong", locale);
export const freeCellCopy = (locale: Locale): typeof FREECELL_COPY => puzzleTable(FREECELL_COPY, "freeCell", locale);
export const spiderCopy = (locale: Locale): typeof SPIDER_COPY => puzzleTable(SPIDER_COPY, "spider", locale);
export const solitaireCopy = (locale: Locale): typeof SOLITAIRE_COPY => puzzleTable(SOLITAIRE_COPY, "solitaire", locale);

export const solitaireOptions = (locale: Locale): typeof SOLITAIRE_OPTIONS => puzzleTable(SOLITAIRE_OPTIONS, "solitaireOptions", locale);

/** A seat's wind as a sentence says it: "east", or 東 for a Japanese reader. */
export function windIn(say: Speaker, at: number): string {
  const wind = SEAT_WINDS[at]!;
  return say.locale === "ja" ? wind.kanji : wind.label.toLowerCase();
}

/** A seat's wind as a name: "East", or 東. */
export function windName(say: Speaker, at: number): string {
  const wind = SEAT_WINDS[at]!;
  return say.pairName(wind.label, wind.kanji).text;
}

/**
 * A Mahjong seat's name as the table shows it: what the person typed, or the seat's wind where nobody
 * named it, or "Computer 2" said in the reader's language. The package gives the English ones.
 */
export function mahjongSeatName(say: Speaker, seats: readonly AwaseSeat[], at: number): string {
  const name = packageSeatName(seats, at);
  const computer = /^Computer (\d+)$/.exec(name);
  if (computer !== null && seats[at]?.name === "") return say.say("pkumi.party.computerName", { n: computer[1]! });
  if (seats[at]?.name === "" || seats[at] === undefined) return windName(say, at);
  return name;
}
