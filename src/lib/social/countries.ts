import { COUNTRY_ALIASES, COUNTRY_CODES, type MemberCountryCode } from "./countries.constants";

/**
 * The flag beside somebody's name.
 *
 * The profile form has promised for a long time that "city, country and the
 * time where you are show beside your name on the players page", and the
 * country never did — John set his to Canada and his mother's to Japan and
 * neither appeared anywhere. The field it is stored in is free text and
 * always has been, so this reads what people actually wrote rather than
 * asking them to pick from a list they have already been past.
 *
 * A flag emoji is two regional indicator letters, so once the country is a
 * code the flag needs no table of its own. Anything that cannot be resolved
 * keeps its words and loses only the flag — a country nobody has heard of is
 * still where somebody lives, and blanking it would be worse than plain text.
 */

const FIRST_INDICATOR = 0x1f1e6;
const FIRST_LETTER = "A".charCodeAt(0);

/** The flag for a code, built from the letters themselves. */
export function flagOf(code: MemberCountryCode): string {
  return String.fromCodePoint(
    ...[...code].map((letter) => FIRST_INDICATOR + letter.charCodeAt(0) - FIRST_LETTER),
  );
}

/**
 * Country names as the platform spells them, code by code.
 *
 * Built once. `Intl.DisplayNames` is not free to construct, and this runs for
 * every row of a directory of hundreds.
 */
let byName: Map<string, MemberCountryCode> | null = null;

function fold(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Accents off, so "cote divoire" finds Côte d'Ivoire.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function names(): Map<string, MemberCountryCode> {
  if (byName !== null) return byName;
  const built = new Map<string, MemberCountryCode>();
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  for (const code of COUNTRY_CODES) {
    const name = display.of(code);
    if (name !== undefined && name !== code) built.set(fold(name), code);
  }
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) built.set(fold(alias), code);
  byName = built;
  return built;
}

export type MemberCountry = { code: MemberCountryCode; name: string; flag: string };

/**
 * What a member typed, resolved — or null, meaning show their words as they
 * wrote them and no flag.
 *
 * Takes a code as readily as a name, since "JP" is a perfectly reasonable
 * thing to have typed into a box labelled country.
 */
export function countryFrom(written: string): MemberCountry | null {
  const folded = fold(written);
  if (folded === "") return null;

  const code =
    (folded.length === 2 &&
      (COUNTRY_CODES as readonly string[]).includes(folded.toUpperCase())
      ? (folded.toUpperCase() as MemberCountryCode)
      : undefined) ?? names().get(folded);
  if (code === undefined) return null;

  const display = new Intl.DisplayNames(["en"], { type: "region" });
  return { code, name: display.of(code) ?? code, flag: flagOf(code) };
}

/**
 * Every country the site will offer, in alphabetical order.
 *
 * For the profile form's select. The stored field is free text and stays free
 * text — this is a list to choose from, not a new rule about what may be in
 * that column, and `countryFrom` still has to read whatever is already there.
 *
 * Built once, for the same reason `names()` is: `Intl.DisplayNames` is not
 * free to construct and there are two hundred and forty-nine of these.
 */
let sorted: MemberCountry[] | null = null;

export function allCountries(): MemberCountry[] {
  if (sorted !== null) return sorted;
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  sorted = COUNTRY_CODES.map((code) => ({ code, name: display.of(code) ?? code, flag: flagOf(code) }))
    // By name rather than by code, because the list is read as names.
    .sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}
