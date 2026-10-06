import { describe, expect, it } from "vitest";

import { overlayLines } from "@/lib/i18n/copyTable";
import { orphaned, problemsWith, unanswered } from "@/lib/i18n/copyTableAudit";
import { PARTY_TABLES_AUTHORED } from "@/lib/i18n/jaText.build";
import { GUNJIN_BOARDS } from "@/lib/party/gunjin/gunjin.constants";
import { SUGOROKU_STRENGTH_LINES, SUGOROKU_STRENGTH_NAMES } from "@/lib/party/sugoroku/sugoroku.constants";
import { PARTY_TABLE_WORDS } from "@/lib/party/partyTableWords";

import { CARD_BACK_WORDS } from "@/components/cards/Cards.constants";
import { CASUAL_COPY } from "@/components/casual/casual.constants";
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
 * THE PARTY, CARD AND CASUAL GAMES' TABLES OF WORDS, IN JAPANESE. Each English table beside a component has an
 * overlay of the same shape under `src/lib/i18n/dictionaries/party.ja.*` (`copyTable.ts`, read through
 * `partyTable`); a sentence of the English with no Japanese beside it, a Japanese line with nothing to answer, or a
 * line that is not Japanese with an English back-translation fails here. The names of the tables are the keys of
 * `PARTY_TABLES_AUTHORED`, so a table authored with no English here, and an English table with no Japanese, both fail.
 */
const ENGLISH: Record<keyof typeof PARTY_TABLES_AUTHORED, unknown> = {
  tableWords: PARTY_TABLE_WORDS,
  partyScreen: PARTY_COPY,
  raceCopy: PARTY_GAME_COPY,
  marbles: PARTY_MARBLES,
  dots: DOTS_COPY,
  ghost: GHOST_COPY,
  mancala: MANCALA_COPY,
  train: TRAIN_COPY,
  pairGo: PAIR_GO_COPY,
  blocks: PARTY_BLOCKS_COPY,
  kept: KEPT_COPY,
  cardTable: CARD_TABLE_COPY,
  online: ONLINE_COPY,
  hitotsuHouse: HITOTSU_HOUSE_COPY,
  hitotsu: HITOTSU_COPY,
  yacht: YACHT_COPY,
  yachtBoxes: YACHT_BOX_WORDS,
  sugoroku: SUGOROKU_COPY,
  sugorokuStrengthNames: SUGOROKU_STRENGTH_NAMES,
  sugorokuStrengthLines: SUGOROKU_STRENGTH_LINES,
  diceWar: DICE_WAR_COPY,
  pachisi: PACHISI_COPY,
  gunjinSides: GUNJIN_SIDES,
  gunjinPlacing: GUNJIN_PLACING_RULES,
  gunjinBoards: GUNJIN_BOARDS,
  gunjin: GUNJIN_COPY,
  tenkaNeutral: TENKA_NEUTRAL_MARBLE,
  tenkaRegions: TENKA_REGION_NAMES,
  tenka: TENKA_COPY,
  casual: CASUAL_COPY,
  cardBacks: CARD_BACK_WORDS,
};

const TABLES = Object.entries(PARTY_TABLES_AUTHORED) as [keyof typeof PARTY_TABLES_AUTHORED, unknown][];

/** A word of English that is a name and not a sentence: a mode, a board or a piece that is called what it is in every language. */
const NAMES = new Set(["Kalah", "Oware", "Luzhanqi Mini", "Salpakan", "Gunjin Shogi", "Capture Flag", "Itsutsu", "The open seat"]);

describe("the party, card and casual tables of words speak Japanese", () => {
  it("has an English table for every authored one, and the other way round", () => {
    expect(Object.keys(ENGLISH).sort()).toEqual(TABLES.map(([name]) => name).sort());
  });

  it.each(TABLES)("%s: every English sentence has its Japanese, and none answers nothing", (name, ja) => {
    expect(unanswered(ENGLISH[name], ja as never, { skip: (_path, value) => NAMES.has(value) })).toEqual([]);
    expect(orphaned(ENGLISH[name], ja)).toEqual([]);
  });

  it.each(TABLES)("%s: every line is Japanese with a back-translation", (_name, ja) => {
    const lines = overlayLines(ja);
    expect(lines.length).toBeGreaterThan(0);
    for (const { path, line } of lines) expect(problemsWith(line), path).toEqual([]);
  });
});
