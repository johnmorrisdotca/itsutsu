import { speaker, type Speaker } from "../i18n/i18n";
import type { Locale } from "../i18n/i18n.types";

import { COUNTRY_ALIASES, COUNTRY_CODES, type MemberCountryCode } from "./countries.constants";
import { COUNTRY_PHRASE } from "./countryPhrases.constants";

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

function fold(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Accents off, so "cote divoire" finds Côte d'Ivoire.
    .replace(/[̀-ͯ]/g, "")
    // Kana and kanji stay, so 日本 finds Japan the way "japan" does.
    .replace(/[^a-z0-9぀-ヿ一-鿿]+/g, " ")
    .trim();
}

export type MemberCountry = { code: MemberCountryCode; name: string; flag: string };

const speakers = new Map<Locale, Speaker>();

/** The name of a country as this reader's language says it (`countries.*` in the phrase table): English for every language with no words. */
export function countryNameIn(code: MemberCountryCode, locale: Locale): string {
  let said = speakers.get(locale);
  if (said === undefined) {
    said = speaker(locale);
    speakers.set(locale, said);
  }
  return said.say(COUNTRY_PHRASE[code]);
}

/**
 * Every country the site will offer, in alphabetical order of the reader's own language.
 *
 * For the profile form's select. The stored field is free text and stays free
 * text — this is a list to choose from, not a new rule about what may be in
 * that column, and `countryFrom` still has to read whatever is already there.
 *
 * Built once for each language. The names are phrases (`countries.*`), never `Intl.DisplayNames`, so
 * the list is the same in Node and in a browser; the sort is the only thing that asks the platform, and it is run on
 * the server (`MePage` hands the list to the form as a prop).
 */
const sorted = new Map<Locale, MemberCountry[]>();

export function allCountries(locale: Locale = "en"): MemberCountry[] {
  const kept = sorted.get(locale);
  if (kept !== undefined) return kept;
  const built = COUNTRY_CODES.map((code) => ({ code, name: countryNameIn(code, locale), flag: flagOf(code) }))
    // By name rather than by code, because the list is read as names.
    .sort((a, b) => a.name.localeCompare(b.name, locale === "ja" ? "ja" : "en"));
  sorted.set(locale, built);
  return built;
}

/** fold(name) -> code, for a given list of countries, plus every alias. */
function foldedLookup(countries: MemberCountry[]): Map<string, MemberCountryCode> {
  const built = new Map<string, MemberCountryCode>();
  // The name in the list's own language, and in English, which is what most of what is stored says.
  for (const country of countries) {
    built.set(fold(country.name), country.code);
    built.set(fold(countryNameIn(country.code, "en")), country.code);
  }
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) built.set(fold(alias), code);
  return built;
}

/** Built once for each language, from its `allCountries()`, for the same reason that is. */
const byName = new Map<Locale, Map<string, MemberCountryCode>>();

function names(locale: Locale): Map<string, MemberCountryCode> {
  let kept = byName.get(locale);
  if (kept === undefined) {
    kept = foldedLookup(allCountries(locale));
    byName.set(locale, kept);
  }
  return kept;
}

function resolveAgainst(
  written: string,
  countries: MemberCountry[],
  foldMap: Map<string, MemberCountryCode>,
): MemberCountry | null {
  const folded = fold(written);
  if (folded === "") return null;

  const code =
    (folded.length === 2 &&
      (COUNTRY_CODES as readonly string[]).includes(folded.toUpperCase())
      ? (folded.toUpperCase() as MemberCountryCode)
      : undefined) ?? foldMap.get(folded);
  if (code === undefined) return null;

  // Found rather than fabricated: a code this particular list does not carry
  // answers null, not a made-up `{ name: code }` standing in for a country.
  return countries.find((country) => country.code === code) ?? null;
}

/**
 * What a member typed, resolved — or null, meaning show their words as they
 * wrote them and no flag.
 *
 * Takes a code as readily as a name, since "JP" is a perfectly reasonable
 * thing to have typed into a box labelled country.
 */
export function countryFrom(written: string, locale: Locale = "en"): MemberCountry | null {
  return resolveAgainst(written, allCountries(locale), names(locale));
}

/**
 * The same resolution as `countryFrom`, against a list the caller already
 * holds rather than this module's own `allCountries()`.
 *
 * `Intl.DisplayNames` does not promise the same spelling in every JavaScript
 * engine, and it does not keep it: Node 24 and the Chromium Playwright drives
 * disagree on four of the two hundred and forty-nine — FK ("Falkland
 * Islands" against "Falkland Islands (Islas Malvinas)"), HK ("Hong Kong SAR
 * China" against "Hong Kong"), MO ("Macao SAR China" against "Macao") and PS
 * ("Palestinian Territories" against "Palestine"). A server-rendered page and
 * the same "use client" component re-running in a visitor's own browser
 * during hydration are exactly two different engines, so a component that
 * called `countryFrom`/`allCountries` itself would resolve some stored values
 * one way on the server and another after hydration — not only a different
 * flag, but for a value that only folds to a match in one engine's spelling,
 * a different STRUCTURE: whether the "kept your own words" option exists at
 * all. `ProfileForm` takes `countries` as a prop, computed once on the server
 * by `MePage`, and resolves against exactly that — so it never asks its own
 * `Intl` anything, and cannot disagree with the markup the server already
 * sent down.
 */
export function resolveCountry(written: string, countries: MemberCountry[]): MemberCountry | null {
  return resolveAgainst(written, countries, foldedLookup(countries));
}
