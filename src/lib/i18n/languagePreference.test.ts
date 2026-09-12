import { describe, expect, it } from "vitest";

import { DEFAULT_PREFERENCES, PREFERENCE_SPECS } from "@/lib/preferences/preferences.constants";
import { acceptPreferences, mergePreferences, preferencesFrom } from "@/lib/preferences/preferences";

import { OFFERED_LOCALES } from "./dictionaries";
import { DEFAULT_LOCALE } from "./i18n.constants";
import {
  LANGUAGE_PREFERENCE,
  languageAsPreferences,
  languageForgotten,
  languageFrom,
} from "./languagePreference";
import { resolveLocale } from "./locale";

/**
 * A member's language, as a value.
 *
 * The account half of "chooses their language once" is two decisions and one
 * trap, and all three are here. The decisions: what the registry will accept,
 * and what it answers for somebody who never chose. The trap is the second
 * one — the registry always answers, so its answer for a silent member is the
 * site's own language, which is exactly the wrong thing to read as a
 * preference.
 */
describe("what the registry will keep", () => {
  it("offers every language the site can actually speak, and nothing else", () => {
    // Not the languages it knows the NAME of: `zh` and `de` are declared in
    // LOCALES with no dictionary, and a picker entry that changed nothing
    // would be a value in range that means "nothing".
    expect(PREFERENCE_SPECS[LANGUAGE_PREFERENCE].options).toEqual(OFFERED_LOCALES);
    expect(OFFERED_LOCALES).toContain(DEFAULT_LOCALE);
  });

  it("keeps a language the site speaks", () => {
    const kept = acceptPreferences({ language: "ja" });
    expect(kept.ok).toBe(true);
    expect(kept.ok && kept.patch.language).toBe("ja");
  });

  it("refuses a language the site has a name for and cannot speak, by name", () => {
    const kept = acceptPreferences({ language: "zh" });
    expect(kept.ok).toBe(false);
    expect(kept.ok === false && kept.problem).toContain("language");
  });

  it("refuses something that is not a language at all", () => {
    for (const wrong of ["EN", "ja-JP", "klingon", 7, true, {}]) {
      expect(acceptPreferences({ language: wrong }).ok, JSON.stringify(wrong)).toBe(false);
    }
  });
});

describe("reading a member's language", () => {
  it("gives back what they chose", () => {
    expect(languageFrom({ language: "ja" })).toBe("ja");
  });

  /*
   * THE TRAP, AND THE WHOLE REASON `languageFrom` EXISTS. `preferencesFrom`
   * fills in every fallback, and this preference's fallback is the language
   * the site is written in — so read through the filled-in view, a member who
   * has never touched the picker is indistinguishable from one who asked for
   * English. That is not a cosmetic difference: it is the whole
   * `Accept-Language` path, and a Japanese browser belonging to a member who
   * never chose would be answered in English for ever.
   */
  it("says null for a member who has never chosen, where the registry says English", () => {
    for (const nothing of [null, undefined, {}, { playersActive: true }]) {
      expect(languageFrom(nothing), JSON.stringify(nothing)).toBeNull();
    }
    // The two halves of the difference, side by side, so nobody "fixes" one
    // of them into the other.
    expect(preferencesFrom({}).language).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_PREFERENCES.language).toBe(DEFAULT_LOCALE);
    expect(languageFrom({})).toBeNull();
  });

  it("leaves a silent member's browser to decide, rather than answering English over it", () => {
    // The consequence, stated as the site would experience it.
    const silent = { playersActive: true };
    expect(
      resolveLocale(
        { onAccount: languageFrom(silent), accepts: "ja,en;q=0.5" },
        OFFERED_LOCALES,
      ),
    ).toBe("ja");
  });

  it("says null for a language this version no longer speaks, and keeps the rest", () => {
    // Spanish was offered for an afternoon and taken out again.
    const stored = { language: "es", playersActive: true };
    expect(languageFrom(stored)).toBeNull();
    expect(preferencesFrom(stored).playersActive).toBe(true);
  });

  it("reads a cleaned partial as happily as the raw column", () => {
    // `cleanPreferences` is idempotent, which is what makes it safe for
    // `storedPreferencesFor` to hand the column over unchecked.
    expect(languageFrom(languageAsPreferences("ja"))).toBe("ja");
  });

  it("is not reachable through a stored value's prototype", () => {
    expect(languageFrom(Object.create({ language: "ja" }))).toBeNull();
  });
});

describe("keeping it, and taking it back", () => {
  it("writes one name and touches nothing else the member holds", () => {
    const merged = mergePreferences({ playersActive: true }, languageAsPreferences("ja"));
    expect(merged).toEqual({ playersActive: true, language: "ja" });
  });

  /*
   * THE WAY BACK. There is no control for this on the site — the picker's
   * other language is how a reader changes their mind, and a two-language
   * site does not need a third link to say "ask my browser". But the store
   * has to be able to forget, or a member has chosen once in the sense of
   * once and for all; and setting, changing and clearing are three different
   * tests.
   */
  it("forgets the language without forgetting anything else", () => {
    const stored = mergePreferences({ playersActive: true }, languageAsPreferences("ja"));
    const cleared = mergePreferences(stored, languageForgotten());
    expect(cleared).toEqual({ playersActive: true });
    expect(languageFrom(cleared)).toBeNull();
  });

  it("is cleared through the same door it is set through", () => {
    // `PATCH /api/me` passes the body to `acceptPreferences`; null forgets.
    const kept = acceptPreferences({ language: null });
    expect(kept.ok).toBe(true);
    expect(kept.ok && kept.patch).toEqual(languageForgotten());
  });
});
