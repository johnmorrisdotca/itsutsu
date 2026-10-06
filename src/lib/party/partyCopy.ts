import { overlay } from "../i18n/copyTable";
import type { Locale } from "../i18n/i18n.types";
import { jaText } from "../i18n/jaText";
import type { VariantCopy } from "../gomoku/variants.constants";
import { CASUAL_DISPLAY } from "../casual/casual.constants";
import type { CasualKind } from "../casual/casual.types";

import { PARTY_DISPLAY } from "./party.constants";
import type { PartyKind } from "./party.types";

/**
 * What a party, card or casual game is called and how it is described, in the
 * reader's language.
 *
 * English is the row in `PARTY_DISPLAY` or `CASUAL_DISPLAY`; Japanese lays its
 * sentences (tagline, origin, every rule bullet and the board advice) over that
 * row (`copyTable.ts`) and keeps every field that is a name or a code: `label`,
 * `kanji`, `country`, `wikipedia`, `inspiredBy` and `alsoKnownAs`. Made once per
 * game and handed back, so a client component that asks on every render gets the
 * same object each time.
 */
export function partyCopy(kind: PartyKind, locale: Locale): VariantCopy {
  const english = PARTY_DISPLAY[kind];
  return locale === "ja" ? overlay(english, jaText().party.copy[kind] as never) : english;
}

/** A casual game's the same way. */
export function casualCopy(kind: CasualKind, locale: Locale): VariantCopy {
  const english = CASUAL_DISPLAY[kind];
  return locale === "ja" ? overlay(english, jaText().party.copy[kind] as never) : english;
}
