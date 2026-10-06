import { describe, expect, it } from "vitest";

import { calendarDay, calendarMonth, readerDay } from "@/lib/ui/when";

import { OFFERED_LOCALES } from "./dictionaries";
import { FORMATS } from "./format.constants";
import { formatSpecFor, listIn, listPiecesIn, numberIn, pluralFormIn, wordsIn } from "./format";
import { speaker } from "./i18n";
import { LOCALE_LIST } from "./i18n.constants";

/**
 * Dates, numbers and lists in the reader's language, with no `Intl`.
 *
 * The same words come out of Node and out of a browser, which is the whole
 * reason these are tables and not `toLocaleString`: a page is drawn on the
 * server and again in the browser, and the two have to agree.
 */

describe("every language the site offers writes dates, numbers and lists", () => {
  it("has a row for each of them", () => {
    for (const locale of OFFERED_LOCALES) expect(FORMATS[locale], `${locale} has no row in format.constants.ts`).toBeDefined();
  });

  it("gives every row twelve months, seven weekdays and a shape for each date style", () => {
    for (const locale of LOCALE_LIST) {
      const spec = FORMATS[locale];
      if (spec === undefined) continue;
      expect(spec.months, locale).toHaveLength(12);
      expect(spec.monthsShort, locale).toHaveLength(12);
      expect(spec.weekdays, locale).toHaveLength(7);
      expect(spec.weekdaysShort, locale).toHaveLength(7);
      for (const shape of Object.values(spec.dates)) expect(shape.trim(), locale).not.toBe("");
    }
  });

  it("reads English for a language with no row, as an unanswered phrase does", () => {
    expect(formatSpecFor("de")).toBe(FORMATS.en);
  });
});

describe("a calendar day", () => {
  it("is written the way each language writes it", () => {
    expect(calendarDay("en", "2026-10-06", "long")).toBe("6 October 2026");
    expect(calendarDay("en", "2026-10-06", "short")).toBe("6 Oct 2026");
    expect(calendarDay("en", "2026-10-06", "weekday")).toBe("Tue 6 Oct 2026");
    expect(calendarDay("en", "2026-10-06", "weekdayNoYear")).toBe("Tue 6 Oct");
    expect(calendarDay("ja", "2026-10-06", "long")).toBe("2026年10月6日");
    expect(calendarDay("ja", "2026-10-06", "weekday")).toBe("2026年10月6日（火）");
    expect(calendarDay("ja", "2026-10-06", "shortNoYear")).toBe("10月6日");
  });

  it("takes its weekday from the date itself, never from the machine's zone", () => {
    // A Sunday, a Saturday and a leap day, in the order the weekday table is indexed.
    expect(calendarDay("en", "2026-10-04", "weekday")).toBe("Sun 4 Oct 2026");
    expect(calendarDay("en", "2026-10-03", "weekday")).toBe("Sat 3 Oct 2026");
    expect(calendarDay("ja", "2028-02-29", "weekday")).toBe("2028年2月29日（火）");
  });

  it("reads the UTC date of a moment", () => {
    expect(calendarDay("en", "2026-10-06T23:59:59.000Z", "long")).toBe("6 October 2026");
  });

  it("answers nothing for what is not a date", () => {
    expect(calendarDay("en", "soon", "long")).toBeNull();
    expect(calendarMonth("en", "2026-13")).toBeNull();
    expect(readerDay("en", "soon", "long")).toBeNull();
  });

  it("writes a month with its year", () => {
    expect(calendarMonth("en", "2026-09")).toBe("September 2026");
    expect(calendarMonth("ja", "2026-09")).toBe("2026年9月");
  });

  it("writes the reader's local day for a moment, which is the browser's job after hydration", () => {
    const at = new Date(2026, 9, 6, 22, 30);
    expect(readerDay("en", at.toISOString(), "long")).toBe("6 October 2026");
    expect(readerDay("ja", at.toISOString(), "long")).toBe("2026年10月6日");
  });
});

describe("numbers", () => {
  it("mark thousands, in English and in Japanese alike", () => {
    expect(numberIn("en", 0)).toBe("0");
    expect(numberIn("en", 999)).toBe("999");
    expect(numberIn("en", 1000)).toBe("1,000");
    expect(numberIn("en", 1234567)).toBe("1,234,567");
    expect(numberIn("ja", 1234567)).toBe("1,234,567");
    expect(numberIn("ja", -12345)).toBe("-12,345");
  });

  it("keep a fraction's digits and leave a number that is not one as it is", () => {
    expect(numberIn("en", 1234.5)).toBe("1,234.5");
    expect(numberIn("en", Number.NaN)).toBe("NaN");
    expect(numberIn("en", Number.POSITIVE_INFINITY)).toBe("Infinity");
  });

  it("are spelt out in English up to two hundred and left as digits in Japanese", () => {
    expect(wordsIn("en", 0)).toBe("no");
    expect(wordsIn("en", 64)).toBe("sixty-four");
    expect(wordsIn("en", 100)).toBe("hundred");
    expect(wordsIn("en", 144)).toBe("hundred and forty-four");
    expect(wordsIn("en", 200)).toBe("200");
    expect(wordsIn("ja", 64)).toBe("64");
  });
});

describe("a list", () => {
  it("is joined the way the language joins one", () => {
    expect(listIn("en", [])).toBe("");
    expect(listIn("en", ["Chess"])).toBe("Chess");
    expect(listIn("en", ["Chess", "Go"])).toBe("Chess and Go");
    expect(listIn("en", ["Chess", "Go", "Hex"])).toBe("Chess, Go and Hex");
    expect(listIn("ja", ["囲碁", "将棋"])).toBe("囲碁と将棋");
    expect(listIn("ja", ["囲碁", "将棋", "連珠"])).toBe("囲碁、将棋、連珠");
  });

  it("keeps the joins around items the caller draws itself", () => {
    expect(listPiecesIn("en", [1, 2, 3])).toEqual([1, ", ", 2, " and ", 3]);
    expect(listPiecesIn("ja", [1, 2, 3])).toEqual([1, "、", 2, "、", 3]);
  });
});

describe("which form of a counted phrase a number takes", () => {
  it("is 'one' for exactly 1 in English, and never in Japanese", () => {
    expect(pluralFormIn("en", 1)).toBe("one");
    expect(pluralFormIn("en", 0)).toBe("other");
    expect(pluralFormIn("en", 2)).toBe("other");
    expect(pluralFormIn("ja", 1)).toBe("other");
  });
});

describe("the speaker carries all of it", () => {
  it("answers in the reader's language", () => {
    const en = speaker("en");
    const ja = speaker("ja");
    expect(en.day("2026-10-06", "short")).toBe("6 Oct 2026");
    expect(ja.day("2026-10-06", "short")).toBe("2026年10月6日");
    expect(en.month("2026-10")).toBe("October 2026");
    expect(ja.month("2026-10")).toBe("2026年10月");
    expect(en.number(12345)).toBe("12,345");
    expect(en.list(["a", "b", "c"])).toBe("a, b and c");
    expect(ja.list(["a", "b", "c"])).toBe("a、b、c");
    expect(ja.words(5)).toBe("5");
  });
});
