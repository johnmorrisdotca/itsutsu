import type { Locale } from "./i18n.types";

/**
 * THE WORDS AND MARKS A LANGUAGE WRITES DATES, NUMBERS AND LISTS WITH.
 *
 * One table per language, read by `format.ts` and `ui/when.ts`, and nothing
 * else in the site names a month, a weekday, a thousands mark or the word that
 * joins a list. A page that wants any of them asks the `Speaker` (`day`,
 * `month`, `number`, `list`, `count`), which hands the table its locale.
 *
 * WHY A TABLE AND NOT `Intl`. A page is drawn twice, once by the server and once
 * by the browser checking the server's markup, and the two drawings have to be
 * the same text. Node and Chromium carry their own copies of the locale data and
 * do not promise to spell a date alike, so `toLocaleDateString("ja")` can differ
 * between them (AGENTS.md: "`Intl` in render is a bug"). Words written down here
 * cannot drift. It is the same reason `when.ts` builds its UTC digits by hand.
 *
 * A language the site offers has a row here, and `format.test.ts` fails when an
 * offered language has none. A language with no row reads the English one, the
 * way an unanswered phrase reads English.
 */

/**
 * The shapes a calendar day is written in.
 *
 * - `long`: the day with the month spelled out where the language does ("6 October 2026").
 * - `short`: the same, with the month cut short where the language does ("6 Oct 2026").
 * - `shortNoYear`: for a heading that already carries the year ("6 Oct").
 * - `weekday`: the weekday first ("Tue 6 Oct 2026").
 * - `weekdayNoYear`: ("Tue 6 Oct").
 * - `month`: a month with its year ("October 2026").
 */
export type DateStyle = "long" | "short" | "shortNoYear" | "weekday" | "weekdayNoYear" | "month";

export type FormatSpec = {
  /** January first. */
  months: readonly string[];
  monthsShort: readonly string[];
  /** Sunday first, as `Date.getUTCDay` counts. */
  weekdays: readonly string[];
  weekdaysShort: readonly string[];
  /**
   * How each style is written, with these slots: `{y}` the year, `{mn}` the
   * month as a number, `{m}` its name, `{ms}` its short name, `{d}` the day of
   * the month, `{w}` the weekday's name and `{ws}` its short name.
   */
  dates: Record<DateStyle, string>;
  /** Between each three digits of a whole number. */
  group: string;
  /** Between a whole number and its decimals. */
  decimal: string;
  /**
   * Whether the language has a singular. English says "1 game" and "2 games";
   * Japanese says "1局" and "2局", with the same noun and a counter after the
   * digits, so it has one form for every count.
   */
  hasSingular: boolean;
  /** What joins a list: two items, the gaps before the last, and the gap before the last of three or more. */
  list: { pair: string; between: string; last: string };
  /**
   * Whole numbers said in words ("sixty-four"), for the sentences that spell a
   * small count out. Null for a language that writes the digits there.
   */
  numberWords: NumberWords | null;
};

/** The words for a count under two hundred, composed the English way. */
export type NumberWords = {
  /** Nought to nineteen; nought is what a sentence calls "no games". */
  small: readonly string[];
  /** Twenty to ninety, indexed by tens (the first two are empty). */
  tens: readonly string[];
  /** A hundred, and what joins it to the rest. */
  hundred: string;
  hundredAnd: string;
  /** Between the tens and the unit ("sixty-four"). */
  hyphen: string;
};

const EN: FormatSpec = {
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  dates: {
    long: "{d} {m} {y}",
    short: "{d} {ms} {y}",
    shortNoYear: "{d} {ms}",
    weekday: "{ws} {d} {ms} {y}",
    weekdayNoYear: "{ws} {d} {ms}",
    month: "{m} {y}",
  },
  group: ",",
  decimal: ".",
  hasSingular: true,
  list: { pair: " and ", between: ", ", last: " and " },
  numberWords: {
    small: [
      "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
    ],
    tens: ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"],
    hundred: "hundred",
    hundredAnd: "hundred and ",
    hyphen: "-",
  },
};

const JA: FormatSpec = {
  months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  weekdays: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
  weekdaysShort: ["日", "月", "火", "水", "木", "金", "土"],
  dates: {
    long: "{y}年{mn}月{d}日",
    short: "{y}年{mn}月{d}日",
    shortNoYear: "{mn}月{d}日",
    weekday: "{y}年{mn}月{d}日（{ws}）",
    weekdayNoYear: "{mn}月{d}日（{ws}）",
    month: "{y}年{mn}月",
  },
  group: ",",
  decimal: ".",
  hasSingular: false,
  list: { pair: "と", between: "、", last: "、" },
  numberWords: null,
};

/** Every language the site writes dates, numbers and lists for. */
export const FORMATS: Partial<Record<Locale, FormatSpec>> = { en: EN, ja: JA };
