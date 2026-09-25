/**
 * The feed's vocabulary: its two tabs, the kinds of line it draws, and how far
 * back it reads. Compared through these, never through a literal.
 *
 * John, 2026-09-25: "Feeds for your own activity like Duolingo has, where you
 * see pretty much a stream of what you've been doing (games played, started,
 * won, xp earned, etc)… And seeing your buddies feeds are nice too… And for
 * the general public a public feed of games being complete might be good.
 * Whatever falls under safe to post. So no 13 year olds then."
 */

/** Where the feed lives. Member-only: `src/proxy.ts` does not list it as open. */
export const FEED_PATH = "/feed";

/** The two tabs, as their `?view=` keys. The first is the default. */
export const FEED_TABS = {
  mine: "mine",
  everyone: "everyone",
} as const;

export type FeedTab = (typeof FEED_TABS)[keyof typeof FEED_TABS];

/**
 * The kinds of line. A game is ONE line — how it ended, or that it has begun —
 * and the noisy things (experience, puzzles) are ONE line per member per day,
 * so the stream reads like a diary and not like a ledger.
 */
export const FEED_KINDS = {
  /** A finished game, from its subject's side: won, lost or drawn. */
  game: "game",
  /** A game still being played, from the day it began. */
  started: "started",
  /** Experience earned here, one day's worth. */
  xp: "xp",
  /** Experience credited for games played on other sites, one day's worth. */
  credited: "credited",
  /** A level reached, on the day the total crossed it. */
  level: "level",
  /** Puzzles of one kind finished, one day's worth. */
  puzzles: "puzzles",
} as const;

export type FeedKind = (typeof FEED_KINDS)[keyof typeof FEED_KINDS];

/** How a finished game went for the member a line is about. */
export const FEED_OUTCOMES = {
  won: "won",
  lost: "lost",
  drawn: "drawn",
} as const;

export type FeedOutcome = (typeof FEED_OUTCOMES)[keyof typeof FEED_OUTCOMES];

/**
 * THE BOUNDS, which are what keep a page view to one bounded read per table.
 *
 * Sixty days is two months of a diary; sixty lines is a long scroll and never a
 * slow one. The reads take more rows than the page shows (a game two people
 * both follow is one line, a puzzle day is one line from many rows), and every
 * read is capped whatever the site grows to.
 */
export const FEED_LIMITS = {
  windowDays: 60,
  entries: 60,
  /** Games read for either tab, newest first. */
  gamesRead: 200,
  /** Puzzle solves read for the reader and their buddies, newest first. */
  puzzlesRead: 300,
} as const;

/** A day, in milliseconds, for the window's arithmetic. */
export const DAY_MS = 24 * 60 * 60 * 1000;
