import type { CasualKind } from "../../casual/casual.types";
import type { PartyKind } from "../../party/party.types";

import { PARTY_COPY_JA_CARDS } from "./party.ja.cards.constants";
import { PARTY_COPY_JA_CASUAL } from "./party.ja.casual.constants";
import { PARTY_COPY_JA_GAMES } from "./party.ja.games.constants";
import { PARTY_COPY_JA_SUGOROKU } from "./party.ja.sugoroku.constants";
import { PARTY_TABLE_WORDS_JA_GAMES } from "./party.ja.tableWords.constants";
import { PARTY_TABLE_WORDS_JA_CARDS, PARTY_TABLE_WORDS_JA_SUGOROKU } from "./party.ja.tableWordsCards.constants";
import type { PartyCopyJa } from "./party.ja.types";

/**
 * Every party, card and casual game's words in Japanese, joined from the files
 * by family. Typed `Record<…>` over both kinds, so a game with no Japanese does
 * not compile; the rest of what a game must have (a line for each rule bullet, a
 * back-translation for each line, a reader's stamp) is held by
 * `party.coverage.test.ts` and `casual.coverage.test.ts`.
 */
export const PARTY_COPY_JA: Record<PartyKind | CasualKind, PartyCopyJa> = {
  ...PARTY_COPY_JA_GAMES,
  ...PARTY_COPY_JA_SUGOROKU,
  ...PARTY_COPY_JA_CARDS,
  ...PARTY_COPY_JA_CASUAL,
};

/** What every party game's table says of itself on its rules page, in Japanese (`PARTY_TABLE_WORDS`). */
export const PARTY_TABLE_WORDS_JA = {
  ...PARTY_TABLE_WORDS_JA_GAMES,
  ...PARTY_TABLE_WORDS_JA_SUGOROKU,
  ...PARTY_TABLE_WORDS_JA_CARDS,
};
