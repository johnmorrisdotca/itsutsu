import type { GuessesTaken } from "../gomoji/guessesTaken";

/**
 * One published version of a daily pool: the words a language and length's
 * daily word is drawn from, from cycle `fromCycle` on. Never edited once
 * published; a new list is a new version from a later cycle.
 */
export type DailyPool = { fromCycle: number; words: readonly string[] };

/** A version as its data file keeps it: the words run together with spaces, and where they came from. */
export type PackedDailyPool = { fromCycle: number; source: string; words: string };

/** A day's word, and where in its cycle it falls. */
export type DayWord = { word: string; cycle: number; place: number; cycleLength: number };

/** The languages the daily words are kept in: the three alphabet Gomojis and the kana one. */
export type DailyLanguage = "en" | "fr" | "de" | "ja";

/** How many guesses a word took, out of how many it had. */
type Guesses = GuessesTaken;

/**
 * Where a reader stands with a day's word at one length: found (with the time
 * and the guesses), played to the last row without finding it, left half
 * way (kept, and resumed by the same link), or not started.
 */
export type DailyStatus =
  | { state: "found"; elapsedMs: number; guesses: Guesses | null; solveId: string }
  | { state: "missed"; guesses: Guesses | null }
  | { state: "going" }
  | { state: "notYet" };

/** One of the fastest finds of a day's word. */
export type DailyFastest = { solveId: string; memberId: string; elapsedMs: number; level: string; guesses: Guesses | null; hintsUsed: number | null };

/** One past day of the archive: the date, each length's word as the page prints it and where it is played, and the day's own page. */
export type ArchiveDay = { day: string; words: readonly { size: number; word: string; href: string }[]; dayHref: string };

/** A week of the archive, Monday to Sunday: the newest week first, and its newest day first. */
export type ArchiveWeek = { monday: string; days: readonly ArchiveDay[] };
