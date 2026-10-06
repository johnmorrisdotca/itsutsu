import type { VariantCopy } from "../gomoku/variants.constants";
import { speaker } from "../i18n/i18n";
import type { Locale } from "../i18n/i18n.types";

import { HOUSEKI_KANJI } from "./houseki.constants";
import { COPY_KEYS } from "./housekiKeys";
import type { HousekiKind } from "./houseki.types";

/**
 * A Houseki game's name in English: the name is not a phrase, it is the name
 * the package gives it, and the Japanese reader meets it as its kanji beside
 * (`HOUSEKI_KANJI`).
 */
export const HOUSEKI_LABEL: Record<HousekiKind, string> = {
  fallingTriplets: "Falling Triplets",
  colourChains: "Colour Chains",
  stoneCollapse: "Stone Collapse",
  gemSwap: "Gem Swap",
  magneticBlocks: "Magnetic Blocks",
};

const MADE = new Map<string, VariantCopy>();

/**
 * What a Houseki game is called and how it is described, in the reader's
 * language, in the shape every game's and puzzle's copy has (`VariantCopy`), so
 * the rules page, the cards and the family's shelf draw it with the template
 * they already have. Made once per game and language and handed back, so a
 * client component that asks on every render gets the same object each time.
 */
export function housekiCopy(kind: HousekiKind, locale: Locale): VariantCopy {
  const key = `${kind}:${locale}`;
  const made = MADE.get(key);
  if (made !== undefined) return made;
  const say = speaker(locale);
  const copy: VariantCopy = {
    label: HOUSEKI_LABEL[kind],
    kanji: HOUSEKI_KANJI[kind],
    tagline: say.say(COPY_KEYS[kind].tagline),
    origin: say.say(COPY_KEYS[kind].origin),
    rules: COPY_KEYS[kind].rules.map((key) => say.say(key)),
    board: say.say(COPY_KEYS[kind].board),
  };
  MADE.set(key, copy);
  return copy;
}
