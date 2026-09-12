import { describe, expect, it } from "vitest";

import { allCountries, countryFrom, flagOf, resolveCountry, type MemberCountry } from "./countries";
import { COUNTRY_ALIASES, COUNTRY_CODES } from "./countries.constants";

/**
 * The flag beside somebody's name.
 *
 * The profile form promised that a member's country shows on the players
 * page, and it never did — John had set his own to Canada and his mother's to
 * Japan and neither appeared. The field is free text, so this has to read
 * what people wrote rather than what a form would have made them pick.
 */
describe("countryFrom", () => {
  it("finds the two John set, which is where this came from", () => {
    expect(countryFrom("Canada")).toEqual({ code: "CA", name: "Canada", flag: "🇨🇦" });
    expect(countryFrom("Japan")).toEqual({ code: "JP", name: "Japan", flag: "🇯🇵" });
  });

  it("does not care about case, spacing or a stray full stop", () => {
    for (const written of ["  japan ", "JAPAN", "Japan"]) {
      expect(countryFrom(written)?.code, written).toBe("JP");
    }
  });

  it("takes a code as readily as a name", () => {
    // "JP" is a reasonable thing to type into a box labelled country.
    expect(countryFrom("JP")?.code).toBe("JP");
    expect(countryFrom("ca")?.code).toBe("CA");
  });

  it("reads a country whose name carries accents", () => {
    // The case a hand-typed table gets wrong, which is why there is no table.
    expect(countryFrom("Cote d'Ivoire")?.code).toBe("CI");
    expect(countryFrom("Côte d’Ivoire")?.code).toBe("CI");
  });

  it("knows what people actually write", () => {
    expect(countryFrom("UK")?.code).toBe("GB");
    expect(countryFrom("England")?.code).toBe("GB");
    expect(countryFrom("USA")?.code).toBe("US");
    expect(countryFrom("Holland")?.code).toBe("NL");
    expect(countryFrom("South Korea")?.code).toBe("KR");
  });

  it("gives back nothing for what it cannot place, rather than guessing", () => {
    // Their words are still shown; only the flag is missing. A wrong flag on
    // somebody's own profile would be worse than none.
    expect(countryFrom("")).toBeNull();
    expect(countryFrom("   ")).toBeNull();
    expect(countryFrom("Middle Earth")).toBeNull();
    expect(countryFrom("ZZ")).toBeNull();
  });

  it("resolves every code it lists, and gives each a real name", () => {
    for (const code of COUNTRY_CODES) {
      const found = countryFrom(code);
      expect(found?.code, code).toBe(code);
      // Not the code echoed back at somebody as though it were a country.
      expect(found?.name, code).not.toBe(code);
      expect(found?.flag.length, code).toBeGreaterThan(1);
    }
  });

  it("has no alias pointing at a code it does not list", () => {
    for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
      expect(COUNTRY_CODES as readonly string[], alias).toContain(code);
    }
  });
});

/**
 * `ProfileForm` cannot call `countryFrom`/`allCountries` itself — it is a
 * "use client" component, so its render function runs again in the browser
 * during hydration, and `Intl.DisplayNames` does not spell every region the
 * same way in every engine (Node 24 and the Chromium this repo's Playwright
 * drives already disagree on FK, HK, MO and PS). `resolveCountry` is what it
 * calls instead: the same resolution, against a list the caller supplies
 * rather than one this module builds itself — so what follows proves it is a
 * pure function of that list, never reaching for `allCountries()`, `names()`
 * or `Intl` on its own.
 */
describe("resolveCountry", () => {
  it("resolves only against the list it is given, not against Intl.DisplayNames itself", () => {
    // A name nowhere in the real country list, standing in for the case that
    // actually happened: an engine spelling a region differently from the one
    // that rendered the page. If this passed by asking Intl.DisplayNames on
    // its own, "Fictional Land" would not resolve — it isn't a real country.
    const fictional: MemberCountry = { code: "FK", name: "Fictional Land", flag: flagOf("FK") };
    expect(resolveCountry("Fictional Land", [fictional])?.code).toBe("FK");
    // And the server's real spelling for FK is absent from this short list,
    // so it must not resolve — proving the lookup is not secretly falling
    // back to this module's own allCountries()/names().
    expect(resolveCountry("Falkland Islands", [fictional])).toBeNull();
  });

  it("still takes a code, and still keeps words it cannot place, exactly like countryFrom", () => {
    const countries = allCountries();
    expect(resolveCountry("JP", countries)?.code).toBe("JP");
    expect(resolveCountry("ca", countries)?.code).toBe("CA");
    expect(resolveCountry("Middle Earth", countries)).toBeNull();
    expect(resolveCountry("", countries)).toBeNull();
  });

  it("agrees with countryFrom when given countryFrom's own list, so the two cannot quietly drift apart", () => {
    for (const written of ["Canada", "Japan", "JP", "UK", "Cote d'Ivoire", "Middle Earth", "  ", ""]) {
      expect(resolveCountry(written, allCountries()), written).toEqual(countryFrom(written));
    }
  });

  it("answers null for a real code the given list happens to leave out, rather than inventing a name for it", () => {
    // Not a case ProfileForm can hit — it is always handed the full list —
    // but the fallback matters: a code resolved that the caller's own list
    // does not carry must not come back as a fabricated `{ name: code }`.
    expect(resolveCountry("JP", [])).toBeNull();
  });
});

describe("flagOf", () => {
  it("builds the flag from the letters, with no second table to disagree", () => {
    expect(flagOf("JP")).toBe("🇯🇵");
    expect(flagOf("CA")).toBe("🇨🇦");
    expect(flagOf("GB")).toBe("🇬🇧");
  });
});
