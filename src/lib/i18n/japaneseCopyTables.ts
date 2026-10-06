import { LEVEL_NAMES } from "@/lib/xp/levelNames.constants";
import { LEVEL_NAMES_JA } from "@/lib/xp/levelNames.ja.constants";
import { XP_EVENT_SPECS } from "@/lib/xp/xp.constants";
import { IMPORTED_VOLUME_COPY, XP_AWARD_COPY } from "@/lib/xp/xpAwardCopy.constants";
import { IMPORTED_VOLUME_COPY_JA, XP_AWARD_COPY_JA } from "@/lib/xp/xpAwardCopy.ja.constants";
import type { XpEventType } from "@/lib/xp/xp.types";

import type { Review } from "./dictionaries/ja.drafted.constants";

/**
 * The Japanese that is kept in a table beside its data rather than in the
 * phrase catalogue (a hundred level names, seventy-three awards), as the one
 * place the review sheet and its gate look for it.
 *
 * A phrase says who has read it in `review` (`ja.drafted.constants.ts`); a row
 * of one of these tables carries the same field, and a row without it does not
 * compile. What this adds is the way the sheet reaches them: each table is a
 * list of `{ english, japanese, back, review }`, which is all a reader of the
 * sheet needs and all the gate asks. A new table of copy that sits beside its
 * data adds itself here, in the same change that adds the table.
 */
export type CopyTableRow = { english: string; japanese: string; back: string; review: Review };

export type CopyTable = {
  /** What the table is, for the sheet's heading. */
  table: string;
  /** Where a reader meets it, as in the sheet's first column. */
  where: string;
  rows: () => CopyTableRow[];
};

export const JA_COPY_TABLES: readonly CopyTable[] = [
  {
    table: "The hundred level names and their notes",
    where: "A player's level, wherever it is shown; the hundred levels, /xp/levels; one level's page, /xp/levels/<n>",
    rows: () =>
      LEVEL_NAMES.map((english, at) => {
        const row = LEVEL_NAMES_JA[at];
        return {
          english: `${english.name}. ${english.note}`,
          japanese: `${row?.name ?? ""}。${row?.note ?? ""}`,
          back: row?.back ?? "",
          review: row?.review as Review,
        };
      }),
  },
  {
    table: "What each XP award is for, and what its notice says",
    where: "A player's XP history, the About column; the notice that drops in from the top of the page",
    rows: () => [
      ...(Object.keys(XP_AWARD_COPY.en) as XpEventType[]).map((type) => {
        const en = XP_AWARD_COPY.en[type];
        const ja = XP_AWARD_COPY_JA[type];
        return {
          english: `${en.label}. ${en.blurb} / ${en.sentence}`,
          japanese: `${XP_EVENT_SPECS[type].kanji}。${ja.blurb} / ${ja.sentence}`,
          back: ja.back,
          review: ja.review,
        };
      }),
      ...(Object.keys(IMPORTED_VOLUME_COPY.en) as (keyof typeof IMPORTED_VOLUME_COPY.en)[]).map((type) => {
        const en = IMPORTED_VOLUME_COPY.en[type];
        const ja = IMPORTED_VOLUME_COPY_JA[type];
        return { english: `${en.label}. ${en.blurb}`, japanese: ja.blurb, back: ja.back, review: ja.review };
      }),
    ],
  },
];
