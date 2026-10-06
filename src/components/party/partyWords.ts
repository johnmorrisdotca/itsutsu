import { playerNumberName } from "@/lib/gomoku/seatWords";
import type { Speaker } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n.types";
import { partyTable } from "@/lib/i18n/partyTables";
import { trainSetLabel, trainSetName } from "@johnmorrisdotca/domino";
import { PIECE_COLOURS } from "@/lib/pieces/pieceColours";
import { speaker } from "@/lib/i18n/i18n";
import { PARTY_TABLE_WORDS } from "@/lib/party/partyTableWords";
import { GUNJIN_BOARDS } from "@/lib/party/gunjin/gunjin.constants";
import { SUGOROKU_STRENGTH_LINES, SUGOROKU_STRENGTH_NAMES } from "@/lib/party/sugoroku/sugoroku.constants";

import { CARD_TABLE_COPY } from "./cards/cardTable.constants";
import { DICE_WAR_COPY } from "./diceWar/diceWar.constants";
import { GUNJIN_COPY, GUNJIN_PLACING_RULES, GUNJIN_SIDES } from "./gunjin/gunjin.constants";
import { HITOTSU_COPY, HITOTSU_HOUSE_COPY } from "./hitotsu/hitotsu.constants";
import { KEPT_COPY } from "./kept.constants";
import { ONLINE_COPY } from "./online/online.constants";
import { PACHISI_COPY } from "./pachisi/pachisi.constants";
import { PAIR_GO_COPY } from "./pairGo.constants";
import { DOTS_COPY, GHOST_COPY, MANCALA_COPY, PARTY_COPY, PARTY_GAME_COPY, PARTY_MARBLES, TRAIN_COPY } from "./party.constants";
import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";
import { SUGOROKU_COPY } from "./sugoroku/sugoroku.constants";
import { TENKA_COPY, TENKA_NEUTRAL_MARBLE, TENKA_REGION_NAMES } from "./tenka/tenka.constants";
import { YACHT_BOX_WORDS, YACHT_COPY } from "./yacht/yacht.constants";

/**
 * EVERY PARTY TABLE'S WORDS IN THE READER'S LANGUAGE.
 *
 * The English tables stay in the constants files beside the components that
 * draw them (several of those files are ones the pictures' stamp hashes,
 * `partyArtFingerprint.ts`); a reader of Japanese gets the same table with the
 * Japanese laid over its sentences (`copyTable.ts`), read from the text alone
 * (`jaText()`), never from the files it is authored in
 * (`src/lib/i18n/dictionaries/party.ja.*`). A component asks with its speaker's
 * locale, and gets the same object each time it asks.
 */
export const partyScreenWords = (locale: Locale): typeof PARTY_COPY => partyTable(PARTY_COPY, "partyScreen", locale);
export const raceWords = (locale: Locale): typeof PARTY_GAME_COPY => partyTable(PARTY_GAME_COPY, "raceCopy", locale);
export const marbleWords = (locale: Locale): typeof PARTY_MARBLES => partyTable(PARTY_MARBLES, "marbles", locale);
export const dotsWords = (locale: Locale): typeof DOTS_COPY => partyTable(DOTS_COPY, "dots", locale);
export const ghostWords = (locale: Locale): typeof GHOST_COPY => partyTable(GHOST_COPY, "ghost", locale);
export const mancalaWords = (locale: Locale): typeof MANCALA_COPY => partyTable(MANCALA_COPY, "mancala", locale);
export const trainWords = (locale: Locale): typeof TRAIN_COPY => partyTable(TRAIN_COPY, "train", locale);
export const pairGoWords = (locale: Locale): typeof PAIR_GO_COPY => partyTable(PAIR_GO_COPY, "pairGo", locale);
export const blocksWords = (locale: Locale): typeof PARTY_BLOCKS_COPY => partyTable(PARTY_BLOCKS_COPY, "blocks", locale);
export const keptWords = (locale: Locale): typeof KEPT_COPY => partyTable(KEPT_COPY, "kept", locale);
export const cardTableWords = (locale: Locale): typeof CARD_TABLE_COPY => partyTable(CARD_TABLE_COPY, "cardTable", locale);
export const onlineWords = (locale: Locale): typeof ONLINE_COPY => partyTable(ONLINE_COPY, "online", locale);
export const hitotsuHouseWords = (locale: Locale): typeof HITOTSU_HOUSE_COPY => partyTable(HITOTSU_HOUSE_COPY, "hitotsuHouse", locale);
export const hitotsuScreenWords = (locale: Locale): typeof HITOTSU_COPY => partyTable(HITOTSU_COPY, "hitotsu", locale);
export const yachtWords = (locale: Locale): typeof YACHT_COPY => partyTable(YACHT_COPY, "yacht", locale);
export const yachtBoxWords = (locale: Locale): typeof YACHT_BOX_WORDS => partyTable(YACHT_BOX_WORDS, "yachtBoxes", locale);
export const sugorokuScreenWords = (locale: Locale): typeof SUGOROKU_COPY => partyTable(SUGOROKU_COPY, "sugoroku", locale);
export const sugorokuStrengthNames = (locale: Locale): typeof SUGOROKU_STRENGTH_NAMES => partyTable(SUGOROKU_STRENGTH_NAMES, "sugorokuStrengthNames", locale);
export const sugorokuStrengthLines = (locale: Locale): typeof SUGOROKU_STRENGTH_LINES => partyTable(SUGOROKU_STRENGTH_LINES, "sugorokuStrengthLines", locale);
export const diceWarScreenWords = (locale: Locale): typeof DICE_WAR_COPY => partyTable(DICE_WAR_COPY, "diceWar", locale);
export const pachisiWords = (locale: Locale): typeof PACHISI_COPY => partyTable(PACHISI_COPY, "pachisi", locale);
export const gunjinSideWords = (locale: Locale): typeof GUNJIN_SIDES => partyTable(GUNJIN_SIDES, "gunjinSides", locale);
export const gunjinPlacingWords = (locale: Locale): typeof GUNJIN_PLACING_RULES => partyTable(GUNJIN_PLACING_RULES, "gunjinPlacing", locale);
export const gunjinBoardWords = (locale: Locale): typeof GUNJIN_BOARDS => partyTable(GUNJIN_BOARDS, "gunjinBoards", locale);
export const gunjinWords = (locale: Locale): typeof GUNJIN_COPY => partyTable(GUNJIN_COPY, "gunjin", locale);
export const tenkaNeutralMarble = (locale: Locale): typeof TENKA_NEUTRAL_MARBLE => partyTable(TENKA_NEUTRAL_MARBLE, "tenkaNeutral", locale);
export const tenkaRegionWords = (locale: Locale): typeof TENKA_REGION_NAMES => partyTable(TENKA_REGION_NAMES, "tenkaRegions", locale);
export const tenkaWords = (locale: Locale): typeof TENKA_COPY => partyTable(TENKA_COPY, "tenka", locale);
export const tableWords = (locale: Locale): typeof PARTY_TABLE_WORDS => partyTable(PARTY_TABLE_WORDS, "tableWords", locale);

/**
 * A marble's colour as a person at the table is told it: "Red", or 赤 for a reader of Japanese. A table's marble is
 * one of the party colours or one a place chose (`tableMarbles`, a name from the piece palette), and the label is
 * its English name, which tests and styles read, so what is shown comes from here and the label is left as it is.
 */
export function marbleLabel(marble: { label: string }, locale: Locale): string {
  if (locale !== "ja") return marble.label;
  const at = PARTY_MARBLES.findIndex((one) => one.label === marble.label);
  if (at >= 0) return marbleWords(locale)[at]?.label ?? marble.label;
  const chosen = Object.values(PIECE_COLOURS).find((one) => one.label === marble.label);
  return chosen === undefined ? marble.label : speaker(locale).pairName(chosen.label, chosen.kanji).text;
}

/** A Mexican Train set's name in the reader's language: "Double-twelve", or ダブルトゥエルブ (Domino's own words for it). */
export function trainSetShown(set: number, locale: Locale): string {
  return (locale === "ja" ? trainSetLabel(set, "ja") : trainSetName(set)) ?? String(set);
}

/** "Player 2, Blue" or "対局者2、青": a seat's name and its marble's colour, as a screen reader hears a name field. */
export function seatColourName(say: Speaker, seat: number, marble: { label: string }): string {
  return say.say("party.seatColour", { player: playerNumberName(say, seat + 1), colour: marbleLabel(marble, say.locale) });
}
