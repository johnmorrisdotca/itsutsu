import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";

import type { RuleVariant } from "./gomoku.types";
import { RULE_VARIANT_DISPLAY, type VariantCopy } from "./variants.constants";

const IN_JAPANESE = new Map<RuleVariant, VariantCopy>();

/**
 * A game's copy in the reader's language.
 *
 * English is the row in `variants.constants.ts`; Japanese puts its own
 * sentences (`tagline`, `origin`, every rule bullet, the board advice) over
 * that row and keeps every field that is a name: `label`, `kanji`, `country`,
 * `wikipedia`, `inspiredBy` and `alsoKnownAs`. The Japanese result is made once
 * per game and handed back, so a client component that asks on every render
 * gets the same object each time.
 */
export function variantCopy(variant: RuleVariant, locale: Locale): VariantCopy {
  const english = RULE_VARIANT_DISPLAY[variant];
  if (locale !== "ja") return english;
  const made = IN_JAPANESE.get(variant);
  if (made !== undefined) return made;
  const ja = jaText().variants[variant];
  const copy: VariantCopy = { ...english, tagline: ja.tagline, origin: ja.origin, rules: ja.rules, board: ja.board };
  IN_JAPANESE.set(variant, copy);
  return copy;
}
