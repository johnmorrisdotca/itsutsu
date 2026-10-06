import type { CountKey } from "../i18n/i18n";
import type { PhraseKey } from "../i18n/i18n.constants";

import type { TraditionalHeadStart } from "./gomoku.types";

/**
 * The names of a head start: each an English label beside its own kanji, which a
 * Japanese reader is shown instead (`Speaker.pairName`), and a description, a
 * source and a count that are phrases. Apart from `headStartWords.ts` so the
 * names are one pure table the i18n gate allows and the sentences built from
 * them are not.
 */

/** The name of the thing, where a page heads or labels it. */
export const HEAD_START_DISPLAY = { label: "Head start", kanji: "先手" } as const;

/** Each game's own traditional head start, as a person reading the rules would say it. */
export const TRADITIONAL_HEAD_START_DISPLAY: Record<
  TraditionalHeadStart,
  { label: string; kanji: string; description: PhraseKey; from: PhraseKey; count: CountKey }
> = {
  stones: {
    label: "Handicap stones",
    kanji: "置き石",
    description: "headstart.stonesDescription",
    from: "headstart.fromGo",
    count: "headstart.stones",
  },
  corners: {
    label: "Corners",
    kanji: "隅",
    description: "headstart.cornersDescription",
    from: "headstart.fromOthello",
    count: "headstart.corners",
  },
  men: {
    label: "Men off",
    kanji: "駒落ち",
    description: "headstart.menDescription",
    from: "headstart.fromDraughts",
    count: "headstart.men",
  },
};
