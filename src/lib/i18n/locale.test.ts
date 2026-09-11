import { describe, expect, it } from "vitest";

import { isLocale, negotiate, readLocale, resolveLocale } from "./locale";
import { DEFAULT_LOCALE } from "./i18n.constants";
import type { Locale } from "./i18n.types";

/**
 * What the site speaks. The same pair it ships with — English and Japanese —
 * written out here rather than imported, because these are tests of the rules
 * for choosing a language and not of which languages there happen to be. A
 * locale named in `LOCALES` and not in this list (`de`, `zh`, `es`) is a
 * language the site knows the name of and cannot speak, which is exactly the
 * case several of these need.
 */
const OFFERED: readonly Locale[] = ["en", "ja"];

describe("naming a locale", () => {
  it("recognises one the site knows about", () => {
    expect(isLocale("ja")).toBe(true);
    expect(readLocale("ja")).toBe("ja");
  });

  it("refuses anything else, rather than guessing", () => {
    for (const wrong of ["", "JA", "jpn", "ja-JP", "en_US", "../en", null, undefined, 7]) {
      expect(isLocale(wrong)).toBe(false);
      expect(readLocale(wrong as string | null | undefined)).toBeNull();
    }
  });
});

describe("what the browser asked for", () => {
  it("takes the language a browser names first", () => {
    expect(negotiate("ja,en;q=0.8", OFFERED)).toBe("ja");
  });

  it("honours quality rather than order", () => {
    expect(negotiate("de;q=0.2,ja;q=0.9", OFFERED)).toBe("ja");
  });

  it("drops the region when the bare language is on offer", () => {
    expect(negotiate("ja-JP,en;q=0.5", OFFERED)).toBe("ja");
  });

  it("skips a language it cannot speak and takes the next one", () => {
    expect(negotiate("de,fr;q=0.9,ja;q=0.4", OFFERED)).toBe("ja");
  });

  /*
   * The one that matters. "This browser asked for German" and "this browser
   * said nothing" are different facts, and only one of them is a preference.
   * Answering English to both would make a language nobody chose
   * indistinguishable from one somebody did — which is the whole reason the
   * default is applied once, at the end, and never here.
   */
  it("says nothing when it can speak none of them", () => {
    expect(negotiate("de,fr;q=0.9", OFFERED)).toBeNull();
  });

  it("says nothing for a header that says nothing", () => {
    expect(negotiate("", OFFERED)).toBeNull();
    expect(negotiate(null, OFFERED)).toBeNull();
    expect(negotiate(undefined, OFFERED)).toBeNull();
    expect(negotiate("*", OFFERED)).toBeNull();
  });

  it("ignores a malformed entry instead of failing on it", () => {
    expect(negotiate(";;;,q=,ja", OFFERED)).toBe("ja");
    expect(negotiate("ja;q=nonsense,en", OFFERED)).toBe("en");
  });

  it("ignores a language refused outright with q=0", () => {
    expect(negotiate("ja;q=0,en;q=0.1", OFFERED)).toBe("en");
  });
});

describe("which language to answer in", () => {
  it("prefers what the account says over the browser", () => {
    expect(resolveLocale({ onAccount: "ja", remembered: "en", accepts: "en" }, OFFERED)).toBe("ja");
  });

  it("prefers what was remembered over what the browser asks for", () => {
    expect(resolveLocale({ remembered: "ja", accepts: "en" }, OFFERED)).toBe("ja");
  });

  it("falls back to the browser when nothing has been chosen", () => {
    expect(resolveLocale({ accepts: "ja,en;q=0.5" }, OFFERED)).toBe("ja");
  });

  it("answers in English when nothing says otherwise", () => {
    expect(resolveLocale({}, OFFERED)).toBe(DEFAULT_LOCALE);
  });

  /*
   * A cookie is something a browser sends, so it is something anybody can
   * write. A stale one naming a language the site does not speak — Spanish
   * was offered for an afternoon and taken out again — must not be able to
   * stop the site answering at all.
   */
  it("ignores a remembered language the site does not speak", () => {
    expect(resolveLocale({ remembered: "es", accepts: "ja" }, OFFERED)).toBe("ja");
    expect(resolveLocale({ remembered: "klingon" }, OFFERED)).toBe(DEFAULT_LOCALE);
  });

  it("ignores an account language the site does not speak", () => {
    expect(resolveLocale({ onAccount: "de", remembered: "ja" }, OFFERED)).toBe("ja");
  });
});
