import { jaText } from "../i18n/copyJa.types";
import { ALSO_LISTED_COPY_JA, FAMILY_COPY_JA } from "../i18n/dictionaries/families.ja.constants";
import type { Locale } from "../i18n/i18n.types";

import type { GameFamily } from "./families.types";

/**
 * A family's blurb in the reader's language. A family's name is not translated
 * here: its Japanese name is its `kanji`, which a Japanese reader is shown in
 * place of the English title, as with a game's name.
 */
export function familyBlurb(family: Pick<GameFamily, "key" | "blurb">, locale: Locale): string {
  if (locale !== "ja") return family.blurb;
  const ja = FAMILY_COPY_JA[family.key];
  return ja === undefined ? family.blurb : jaText(ja.blurb);
}

/** Why a game is also shelved on another family, in the reader's language. */
export function listingWhy(game: string, familyKey: string, why: string, locale: Locale): string {
  if (locale !== "ja") return why;
  const ja = ALSO_LISTED_COPY_JA[`${game}/${familyKey}`];
  return ja === undefined ? why : jaText(ja.why);
}
