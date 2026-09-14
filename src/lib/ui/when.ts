import type { WhenStyle } from "./when.types";

/**
 * A moment put into words, in the two forms a server-rendered page needs.
 *
 * WHY TWO. A page is drawn twice: once by the server, and once by the browser
 * checking the server's markup before it takes over. Those two drawings must
 * be the same text, or React throws the server's away and says so. A moment
 * formatted with `toLocaleString()` cannot be the same text in both, because
 * the server formats in its own zone and language and the browser in the
 * reader's — which is what every game page here was doing, and nobody saw it
 * because the development machine runs both in one zone and one language.
 *
 * So the first drawing, on both sides, is `stableWhen`: built from the UTC
 * fields by hand, with no `Intl` at all, so it is the same string on any
 * runtime in any zone. And once the browser has the page, `readerWhen` says
 * the same moment in the reader's zone and the site's language — which only
 * the browser can do honestly, since the server cannot know the device.
 *
 * NOT `Intl` WITH AN EXPLICIT LOCALE AND ZONE ON BOTH SIDES, though that looks
 * enough. Node and Chromium carry their own copies of the locale data and do
 * not promise to spell a date alike — the 0.146.1 fault was exactly that, with
 * `Intl.DisplayNames` and four region names. By-hand digits cannot drift.
 *
 * Both answer null for something that is not a moment, rather than printing
 * "Invalid Date" or a plausible epoch: a caller with nothing to show shows
 * nothing.
 */

function moment(iso: string): Date | null {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? null : at;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * The moment in UTC, in digits, labelled as UTC: "2026-09-14 00:21 UTC".
 *
 * What a reader sees for the instant before the browser takes over, and what a
 * reader with no JavaScript sees for good — so it says which zone it is in
 * rather than passing UTC off as theirs.
 */
export function stableWhen(iso: string, style: WhenStyle): string | null {
  const at = moment(iso);
  if (at === null) return null;
  const day = `${at.getUTCFullYear()}-${twoDigits(at.getUTCMonth() + 1)}-${twoDigits(at.getUTCDate())}`;
  const time = `${twoDigits(at.getUTCHours())}:${twoDigits(at.getUTCMinutes())}`;
  if (style === "date") return `${day} UTC`;
  if (style === "time") return `${time} UTC`;
  return `${day} ${time} UTC`;
}

const READER_FORMAT: Record<WhenStyle, Intl.DateTimeFormatOptions> = {
  dateTime: { dateStyle: "medium", timeStyle: "short" },
  date: { dateStyle: "medium" },
  time: { timeStyle: "short" },
};

/**
 * The moment as the reader would say it: in `localeTag`, the site's language,
 * and in `timeZone`, or in the zone of the runtime calling it when none is
 * given — which, in the browser, is the reader's own.
 *
 * FOR THE BROWSER, AFTER HYDRATION, and nowhere else. Called during a render
 * the server also draws, it is exactly the fault `stableWhen` exists to avoid.
 * `LocalTime` is the one caller, and it gates this on `useHydrated`.
 */
export function readerWhen(iso: string, style: WhenStyle, localeTag: string, timeZone?: string): string | null {
  const at = moment(iso);
  if (at === null) return null;
  return new Intl.DateTimeFormat(localeTag, { ...READER_FORMAT[style], timeZone }).format(at);
}
