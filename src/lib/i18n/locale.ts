import { DEFAULT_LOCALE, LOCALES, LOCALE_LIST } from "./i18n.constants";
import type { Locale } from "./i18n.types";

/**
 * Working out which language to answer in, with nothing but values.
 *
 * Pure on purpose, and split from the request the way the engine is split
 * from the store: `currentLocale.ts` does the reading — a cookie, a header —
 * and hands the strings here. That seam is what lets the answer come from
 * somewhere else later without any of this changing. If the site ever moves
 * to `/es/rules/...` (the routing Next's own guide recommends, and the only
 * shape that survives static rendering), the path segment becomes one more
 * string arriving at `resolveLocale` and nothing below it moves.
 */

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALE_LIST as readonly string[]).includes(value);
}

/** A locale, or null when the string names none. Null is "nothing said". */
export function readLocale(value: string | null | undefined): Locale | null {
  return isLocale(value) ? value : null;
}

type Preference = { tag: string; quality: number };

/**
 * `Accept-Language`, taken apart. Malformed entries are dropped rather than
 * guessed at: a header is something a client wrote, not something we control.
 */
function preferences(header: string): Preference[] {
  return header
    .split(",")
    .map((part): Preference | null => {
      const [tag, ...parameters] = part.trim().split(";");
      const name = tag?.trim().toLowerCase() ?? "";
      if (name === "" || name === "*") return null;
      /*
       * No `q` at all means "most wanted", which is what the specification
       * says. A `q` that cannot be read is a different thing: the client
       * meant to rank this and the ranking did not survive. Treating that as
       * "most wanted" would promote the one entry we understood least, so the
       * entry is dropped and the rest of the header still answers.
       */
      const ranked = parameters.find((one) => /^\s*q\s*=/i.test(one));
      if (ranked === undefined) return { tag: name, quality: 1 };
      const quality = Number.parseFloat(/^\s*q\s*=\s*([\d.]+)\s*$/i.exec(ranked)?.[1] ?? "");
      if (!Number.isFinite(quality) || quality <= 0) return null;
      return { tag: name, quality };
    })
    .filter((one): one is Preference => one !== null)
    .sort((a, b) => b.quality - a.quality);
}

/**
 * The best of the languages on offer for a browser that sent this header, or
 * null when it asked for none of them.
 *
 * Null rather than English, because "this browser asked for German and we do
 * not speak German" and "this browser asked for English" are different facts
 * and only one of them is a preference. Collapsing them here would put an
 * answer nobody gave into the same value as one somebody did.
 *
 * A region is dropped when the bare language is on offer — ja-JP is a reader
 * of Japanese, and a site with one Japanese has nothing to gain by refusing
 * them. An exact tag still wins over a bare one, so the day a regional
 * dictionary exists it is reached first.
 */
export function negotiate(
  header: string | null | undefined,
  offered: readonly Locale[],
): Locale | null {
  if (typeof header !== "string" || header.trim() === "") return null;
  const tags = new Map(offered.map((locale) => [LOCALES[locale].tag.toLowerCase(), locale]));
  for (const { tag } of preferences(header)) {
    const exact = tags.get(tag);
    if (exact !== undefined) return exact;
    const base = tag.split("-")[0] ?? "";
    const loose = tags.get(base);
    if (loose !== undefined) return loose;
  }
  return null;
}

/**
 * Where a language can be said to come from, most binding first.
 *
 * `onAccount` is a seam, not a feature: nothing supplies it today. It is the
 * hook the approved-but-unbuilt Preferences API drops into, and it is first
 * because a preference somebody saved to their account should not be
 * overruled by a browser they happen to be sitting at. It is spelt out here,
 * and tested, so the order is a decision on the record rather than one made
 * in a hurry by whoever builds that API.
 */
export type LocaleSources = {
  /** Saved on the member's account. Nothing writes this yet. */
  onAccount?: string | null;
  /** What this browser was last told to remember — the `lang` cookie. */
  remembered?: string | null;
  /** What the browser itself asks for — the `Accept-Language` header. */
  accepts?: string | null;
};

/**
 * The language to answer in. Always answers, because a page has to be
 * rendered in something — and English is what the site is written in, so it
 * is the honest last resort rather than a guess.
 */
export function resolveLocale(sources: LocaleSources, offered: readonly Locale[]): Locale {
  const speaks = (locale: Locale | null): locale is Locale =>
    locale !== null && offered.includes(locale);

  const saved = readLocale(sources.onAccount);
  if (speaks(saved)) return saved;

  const remembered = readLocale(sources.remembered);
  if (speaks(remembered)) return remembered;

  const asked = negotiate(sources.accepts, offered);
  if (speaks(asked)) return asked;

  return DEFAULT_LOCALE;
}
