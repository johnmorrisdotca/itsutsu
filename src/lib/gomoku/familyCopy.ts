import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";

import type { GameFamily } from "./families.types";

/**
 * A family's blurb in the reader's language. A family's name is not translated
 * here: its Japanese name is its `kanji`, which a Japanese reader is shown in
 * place of the English title, as with a game's name.
 */
export function familyBlurb(family: Pick<GameFamily, "key" | "blurb">, locale: Locale): string {
  if (locale !== "ja") return family.blurb;
  return jaText().families[family.key] ?? family.blurb;
}

/** Why a game is also shelved on another family, in the reader's language. */
export function listingWhy(game: string, familyKey: string, why: string, locale: Locale): string {
  if (locale !== "ja") return why;
  return jaText().alsoListed[`${game}/${familyKey}`] ?? why;
}
