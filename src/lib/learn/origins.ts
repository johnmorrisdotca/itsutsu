/**
 * Where a game comes from, and where to check us.
 *
 * A rules page says in prose that Halma was invented in Boston and that Hex
 * was found in Copenhagen, and a reader has to take our word for it. A flag
 * and a link out are the two smallest things that let them not have to: the
 * flag says at a glance which tradition a game belongs to, and the article is
 * something outside this site that can contradict us.
 *
 * Only games with a real, documented origin have either. Our own inventions
 * and our own variants have neither, and that is the honest answer rather
 * than a gap: there is no country that Ring Drop is from.
 */

import { DEFAULT_LOCALE } from "../i18n/i18n.constants";
import type { Locale } from "../i18n/i18n.types";

/** The countries any of these games actually come from. ISO 3166-1 alpha-2. */
export type CountryCode = "BR" | "CA" | "CN" | "DE" | "DK" | "FR" | "GB" | "JP" | "KR" | "NL" | "RU" | "TW" | "US" | "VN";

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  BR: "Brazil",
  CA: "Canada",
  CN: "China",
  DE: "Germany",
  DK: "Denmark",
  FR: "France",
  GB: "England",
  JP: "Japan",
  KR: "South Korea",
  NL: "the Netherlands",
  RU: "Russia",
  TW: "Taiwan",
  US: "the United States",
  VN: "Vietnam",
};

/**
 * The same countries as a Japanese reader names them. Each is the name a
 * Japanese atlas uses; `GB` is "England" in English here because that is the
 * country the games came from, and イングランド is the same country.
 * Read by the reviewer agent 2026-10-06 (ENJA-05).
 */
export const COUNTRY_NAMES_JA: Record<CountryCode, string> = {
  BR: "ブラジル",
  CA: "カナダ",
  CN: "中国",
  DE: "ドイツ",
  DK: "デンマーク",
  FR: "フランス",
  GB: "イングランド",
  JP: "日本",
  KR: "韓国",
  NL: "オランダ",
  RU: "ロシア",
  TW: "台湾",
  US: "アメリカ合衆国",
  VN: "ベトナム",
};

const FIRST_INDICATOR = 0x1f1e6;
const FIRST_LETTER = "A".charCodeAt(0);

/**
 * The flag, from the code rather than from a table of its own.
 *
 * A flag emoji is two regional indicator letters, so "JP" is the only thing
 * that needs writing down; keeping a second column of 🇯🇵 beside it would be a
 * chance for the two to disagree. Emoji rather than images: they need no
 * asset, no licence and no network, and they follow the reader's own fonts.
 */
export function flagFor(code: CountryCode): string {
  return String.fromCodePoint(
    ...[...code].map((letter) => FIRST_INDICATOR + letter.charCodeAt(0) - FIRST_LETTER),
  );
}

/** Where a game came from, ready to print. */
export type Origin = { code: CountryCode; country: string; flag: string };

export function originFor(code: CountryCode | undefined, locale: Locale = DEFAULT_LOCALE): Origin | null {
  if (code === undefined) return null;
  return { code, country: (locale === "ja" ? COUNTRY_NAMES_JA : COUNTRY_NAMES)[code], flag: flagFor(code) };
}

/**
 * The address of an English Wikipedia article, from its title.
 *
 * Titles are stored, not URLs, so every link is built the same way and none
 * of them can quietly point somewhere else. Each title was checked against
 * the API before it was written down; some are redirects on purpose, because
 * that is where the reader should land — Ninuki-renju and Keryo-Pente both
 * lead to the Pente article, which is the one that explains the family.
 */
export function wikipediaUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}
