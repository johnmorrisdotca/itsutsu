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

/** The countries any of these games actually come from. ISO 3166-1 alpha-2. */
export type CountryCode = "DK" | "GB" | "JP" | "KR" | "TW" | "US" | "VN";

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  DK: "Denmark",
  GB: "England",
  JP: "Japan",
  KR: "South Korea",
  TW: "Taiwan",
  US: "the United States",
  VN: "Vietnam",
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

export function originFor(code: CountryCode | undefined): Origin | null {
  if (code === undefined) return null;
  return { code, country: COUNTRY_NAMES[code], flag: flagFor(code) };
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
