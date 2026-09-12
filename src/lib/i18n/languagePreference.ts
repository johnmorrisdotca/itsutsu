import { cleanPreferences } from "@/lib/preferences/preferences";
import type { PreferencePatch } from "@/lib/preferences/preferences.types";

import type { Locale } from "./i18n.types";
import { readLocale } from "./locale";

/**
 * A member's language as the registry keeps it, with nothing but values.
 *
 * Pure, and split from the row the way `rememberedFilter.ts` is split from
 * `memberFilter.ts`: this decides what a stored column means and what a
 * choice should be written as, and `memberLanguage.ts` does the reading and
 * the writing. The seam is what lets both halves be tested for what they
 * actually do — the rules here by value, the row over there by driving the
 * site.
 */

/** The registry's name for it, in one place, so a typo cannot become a silent no-op. */
export const LANGUAGE_PREFERENCE = "language";

/**
 * The language this member has chosen, or NULL WHEN THEY NEVER HAVE.
 *
 * Null, not `DEFAULT_LOCALE`, and that is the whole reason this function
 * exists rather than a caller reading the field. English is what a page is
 * rendered in when nothing anywhere has said otherwise; it is not something a
 * member said. Handing it back from here would put a preference nobody
 * expressed above the `Accept-Language` header that a Japanese browser is
 * sending on every request — a value in range that means "nothing", read as
 * though it meant something, which is the failure this repository has written
 * down twice: a distance of 0 meaning "already home", a `flipped: false`
 * meaning "never touched this".
 *
 * Through `cleanPreferences`, so a column holding a language this version no
 * longer speaks — Spanish was offered for an afternoon — answers null and
 * leaves the member's other preferences alone. Takes the column as it is
 * stored or a partial already cleaned; `cleanPreferences` is idempotent.
 */
export function languageFrom(stored: unknown): Locale | null {
  return readLocale(cleanPreferences(stored)[LANGUAGE_PREFERENCE] ?? null);
}

/** A chosen language as a change to keep on the account. */
export function languageAsPreferences(locale: Locale): PreferencePatch {
  return { [LANGUAGE_PREFERENCE]: locale };
}

/**
 * And forgetting it: back to whatever this device asks for.
 *
 * There is no control for this on the site and that is a decision, not an
 * omission — see `memberLanguage.ts`. It is here because the registry can
 * express it (`null` forgets, which is why `PreferencePatch` allows one), and
 * because a store that can only ever be set is a store a member cannot get
 * out of. `PATCH /api/me` with `{ preferences: { language: null } }` is the
 * way back, and it is tested as one.
 */
export function languageForgotten(): PreferencePatch {
  return { [LANGUAGE_PREFERENCE]: null };
}
