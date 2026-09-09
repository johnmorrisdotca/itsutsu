import { describe, expect, it } from "vitest";

import { countryFrom, flagOf } from "./countries";
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

describe("flagOf", () => {
  it("builds the flag from the letters, with no second table to disagree", () => {
    expect(flagOf("JP")).toBe("🇯🇵");
    expect(flagOf("CA")).toBe("🇨🇦");
    expect(flagOf("GB")).toBe("🇬🇧");
  });
});
