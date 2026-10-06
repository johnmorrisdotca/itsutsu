import type { Locale, LocaleSpec } from "./i18n.types";
import { PHRASES_SITE } from "./phrases.site.constants";
import { PHRASES_INSTALL } from "./phrases.install.constants";
import { PHRASES_FILTER } from "./phrases.filter.constants";
import { PHRASES_RULES } from "./phrases.rules.constants";
import { PHRASES_SETUP } from "./phrases.setup.constants";
import { PHRASES_XP } from "./phrases.xp.constants";
import { PHRASES_RECORD } from "./phrases.record.constants";
import { PHRASES_RIVALRY } from "./phrases.rivalry.constants";
import { PHRASES_CATALOGUE } from "./phrases.catalogue.constants";
import { PHRASES_FEED } from "./phrases.feed.constants";

/**
 * The languages the site knows about, and the English it speaks in by default.
 *
 * Knowing about a language is not the same as speaking it: `dictionaries.ts`
 * decides which of these are actually offered, by asking which ones have
 * something to say. `zh` and `de` are declared here with no dictionary on
 * purpose — they are the next ones wanted, and declaring them is what lets
 * the Chinese pairing question below be answered in data rather than in an
 * argument.
 */
export const LOCALES: Record<Locale, LocaleSpec> = {
  en: { tag: "en", endonym: "English", english: "English", script: "latin", kanjiReadsAsOwn: false },
  es: { tag: "es", endonym: "Español", english: "Spanish", script: "latin", kanjiReadsAsOwn: false },
  ja: { tag: "ja", endonym: "日本語", english: "Japanese", script: "han", kanjiReadsAsOwn: true },
  zh: { tag: "zh", endonym: "中文", english: "Chinese", script: "han", kanjiReadsAsOwn: false },
  de: { tag: "de", endonym: "Deutsch", english: "German", script: "latin", kanjiReadsAsOwn: false },
};

export const LOCALE_LIST = Object.keys(LOCALES) as readonly Locale[];

/**
 * The language the site is written in, and the one every phrase falls back to.
 *
 * It is not a preference and never stands in for one: "nobody has said" is
 * `null` everywhere it can be, and only becomes English at the last step,
 * where something has to be rendered.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * How a language is asked for, and how it is remembered.
 *
 * A plain word in the query, the way the players page's filter is asked for,
 * and remembered in a cookie by the proxy on the way past — because a Server
 * Component can read a cookie while it renders and cannot set one. See
 * `proxy.ts`, which already does exactly this for the directory filter.
 *
 * The query is deliberately *not* where a page reads the answer from: it is
 * only how a choice is made. Reading it would make the address and the
 * remembered answer two sources for one fact.
 */
export const LANG_PARAM = "lang";
export const LANG_COOKIE = "lang";

/** A year: a language is not a thing anybody wants to keep re-choosing. */
export const LANG_REMEMBER_FOR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The cookie that says a language was JUST CHOSEN, in this browser, by
 * whoever is sitting at it — and says nothing else at all.
 *
 * It exists because a member's language now lives on their account, which
 * means the account has to be able to lose the argument exactly once: on the
 * request where they are changing their mind. `LANG_COOKIE` cannot say that.
 * It reads the same a second after the click and a year after it, so it means
 * both "I chose this just now" and "I was told this last winter" — and a
 * reader that cannot tell those apart has to pick which mistake to make.
 * Either it lets the stored account language overrule a fresh click, which is
 * the 0.126.0 bug ("Can't change back to ENG from JP") arriving by a new
 * road; or it writes the cookie back over the account whenever the two
 * differ, and then two devices take the language off each other for ever,
 * because a stale cookie and a fresh one are the same string.
 *
 * So this is a second cookie with one meaning, which is the rule this
 * repository already states for `flipped: false` and for the board's nullable
 * grades. `proxy.ts` sets it beside the other one, on the redirect it was
 * already returning: it reads no database, learns nothing about who is
 * asking, and decides nothing it did not decide before. `currentLocale` is
 * the only thing that reads it — once to answer in the language just picked,
 * and once to write that choice onto the account it belongs to.
 *
 * SHORT ON PURPOSE. It has one job on the very next request, and a marker
 * that outlived its click would quietly become a second standing preference,
 * which is the thing it exists to prevent. A minute covers the redirect and
 * the page after it with room to spare. A marker still in the jar after that
 * has been acted on already and acting on it again writes nothing — see
 * `sameStored`.
 */
export const LANG_CHOSEN_COOKIE = "lang-chosen";
export const LANG_CHOSEN_FOR_SECONDS = 60;

/**
 * Each area of the catalogue by the name of its file, `phrases.<area>.constants.ts`.
 * `phrases.coverage.test.ts` reads it to prove that no key is said twice and
 * that none was lost in the join.
 */
export const PHRASE_AREAS = {
  site: PHRASES_SITE,
  install: PHRASES_INSTALL,
  filter: PHRASES_FILTER,
  rules: PHRASES_RULES,
  setup: PHRASES_SETUP,
  xp: PHRASES_XP,
  record: PHRASES_RECORD,
  rivalry: PHRASES_RIVALRY,
  catalogue: PHRASES_CATALOGUE,
  feed: PHRASES_FEED,
} as const;

/**
 * Every phrase the site can say in more than one language, in the language it
 * was written in.
 *
 * This is the source of truth for the key list, not just for the English: a
 * dictionary is `Record<PhraseKey, string>`, so TypeScript refuses a locale
 * that has not answered every one of these — the same way `VARIANT_SPECS`
 * refuses a game with no copy.
 *
 * What is NOT here, and why. Two kinds of English are deliberately left
 * alone. The brand — "Itsutsu 五つ" — is a name, not a phrase. And the
 * display copy attached to domain values (`RULE_VARIANT_DISPLAY`,
 * `STONE_DISPLAY`, the backlog's labels) stays in its own constants module
 * beside the thing it describes; when those are translated, each gains a
 * per-locale sibling table there, rather than forty games' worth of prose
 * being dragged into this one file.
 *
 * `{placeholders}` are filled by `fill` in `i18n.ts`. Every translation has
 * to use the same set — `i18n.coverage.test.ts` fails the build otherwise,
 * because a dropped placeholder is a sentence with a hole in it that nothing
 * else would report.
 *
 * It is the join of the areas in `PHRASE_AREAS`, one `phrases.<area>.constants.ts`
 * each, split by the first word of a key. A new key goes in its area's file;
 * a new area is a new file and one line here, in both lists.
 */
export const PHRASES = {
  ...PHRASES_SITE,
  ...PHRASES_INSTALL,
  ...PHRASES_FILTER,
  ...PHRASES_RULES,
  ...PHRASES_SETUP,
  ...PHRASES_XP,
  ...PHRASES_RECORD,
  ...PHRASES_RIVALRY,
  ...PHRASES_CATALOGUE,
  ...PHRASES_FEED,
} as const;

/** A phrase the site can say. */
export type PhraseKey = keyof typeof PHRASES;

export const PHRASE_KEYS = Object.keys(PHRASES) as readonly PhraseKey[];
