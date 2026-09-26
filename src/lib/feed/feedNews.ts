import { EVERY_GAME_KEY } from "@/lib/catalogue/gameKeys";

import { DAY_MS, FEED_KINDS, FEED_OUTCOMES } from "./feed.constants";
import type { FeedEntry, FeedNewsEntry, FeedPerson } from "./feed.types";
import { bestTimeParts, programFor } from "./siteNews";
import { SITE_NEWS, isSiteNewsKind, type SiteNewsKind } from "./siteNews.constants";

/**
 * THE SITE'S NEWS AS LINES OF THE EVERYONE TAB, PURE. `feedRead.ts` reads the
 * rows — one query for the news, one for the games it names, one for the
 * members — and this decides what each row may say.
 *
 * THE AGE RULE HOLDS FOR EVERY LINE. A line names a person only when
 * `people.mayName` says so, which is `mayBeNamed` (a program, or a member who
 * has said they are 18 or over) and not banned, ignored by the reader or a
 * test member. A line that cannot name its person either says the thing
 * without them — "Gomoji Wort was played here for the first time" — or, where
 * the thing IS the person ("Ann's first win here"), is not drawn at all.
 */

/** A `SiteNews` row as it was read. */
export type NewsRead = {
  id: string;
  kind: string;
  memberId: string | null;
  variant: string;
  subject: string;
  gameId: string | null;
  createdAt: Date;
};

/** A game a news row names, with its seats' current names. */
export type NewsGameSeats = {
  id: string;
  variant: string;
  /** "black", "white", or null for a draw. */
  winner: string | null;
  black: FeedPerson;
  white: FeedPerson;
};

/** What the lines ask about the members they would name. */
export type NewsPeople = {
  /** The member's name as the page shows it; "" where it could not be read. */
  nameOf: (memberId: string) => string;
  /** Whether this member may be named on this tab: see the note above. */
  mayName: (memberId: string | null) => boolean;
};

const NOBODY: FeedPerson = { memberId: null, name: "" };

type Said = Omit<FeedNewsEntry, "kind" | "id" | "at" | "you" | "news" | "subject">;

/** A game's first game: who won it and who they beat, or the game alone. */
function firstGameOf(row: NewsRead, game: NewsGameSeats | undefined, people: NewsPeople): Said {
  const variant = game?.variant ?? row.variant;
  if (game === undefined) return { named: false, who: NOBODY, other: null, outcome: null, variant, gameId: null };
  const whiteWon = game.winner === "white";
  const [who, other] = whiteWon ? [game.white, game.black] : [game.black, game.white];
  if (!people.mayName(who.memberId) || !people.mayName(other.memberId)) {
    return { named: false, who: NOBODY, other: null, outcome: null, variant, gameId: game.id };
  }
  const outcome = game.winner === null ? FEED_OUTCOMES.drawn : FEED_OUTCOMES.won;
  return { named: true, who, other, outcome, variant, gameId: game.id };
}

/**
 * What one row says, or null for a row with no line: a kind this deploy does
 * not know, a row it cannot read, or a line that IS its person and may not
 * name them.
 */
function said(row: NewsRead, kind: SiteNewsKind, games: ReadonlyMap<string, NewsGameSeats>, people: NewsPeople): Said | null {
  const game = row.gameId === null ? undefined : games.get(row.gameId);
  const person: FeedPerson = row.memberId === null ? NOBODY : { memberId: row.memberId, name: people.nameOf(row.memberId) };
  const nameable = row.memberId !== null && people.mayName(row.memberId);
  switch (kind) {
    case SITE_NEWS.firstGameOfGame:
      return firstGameOf(row, game, people);
    case SITE_NEWS.tookFirstPlace:
      return nameable ? { named: true, who: person, other: null, outcome: null, variant: row.variant, gameId: game?.id ?? null } : null;
    case SITE_NEWS.hardBotBeaten: {
      const program = programFor(row.subject);
      if (program === null) return null;
      const other = { memberId: program.id, name: program.name };
      return nameable
        ? { named: true, who: person, other, outcome: null, variant: row.variant, gameId: game?.id ?? null }
        : { named: false, who: NOBODY, other, outcome: null, variant: row.variant, gameId: game?.id ?? null };
    }
    case SITE_NEWS.firstWin:
    case SITE_NEWS.firstLoss:
      /* The game is how the line knows which game; without it, no line. */
      if (!nameable || game === undefined) return null;
      return { named: true, who: person, other: null, outcome: null, variant: game.variant, gameId: game.id };
    case SITE_NEWS.bestTime:
      if (bestTimeParts(row.subject) === null) return null;
      return nameable
        ? { named: true, who: person, other: null, outcome: null, variant: row.variant, gameId: null }
        : { named: false, who: NOBODY, other: null, outcome: null, variant: row.variant, gameId: null };
  }
}

/**
 * Every row that has a line, as a line. Always said in the third person, the
 * reader included: news is the site telling everybody, and "you" is the
 * reader's own tab.
 */
export function newsEntries(
  rows: readonly NewsRead[],
  games: ReadonlyMap<string, NewsGameSeats>,
  people: NewsPeople,
): FeedNewsEntry[] {
  const out: FeedNewsEntry[] = [];
  for (const row of rows) {
    if (!isSiteNewsKind(row.kind)) continue;
    const line = said(row, row.kind, games, people);
    if (line === null) continue;
    out.push({ kind: FEED_KINDS.news, id: `news:${row.id}`, at: row.createdAt.toISOString(), you: false, news: row.kind, subject: row.subject, ...line });
  }
  return out;
}

/**
 * THE GAMES A NAMED NEWS LINE ALREADY TELLS. "Gomoji Wort was played here for
 * the first time: Ann beat Bo" says everything "Ann beat Bo at Gomoji Wort"
 * does, so the plain line for that game is left out rather than said twice.
 */
export function gamesToldByNews(entries: readonly FeedNewsEntry[]): Set<string> {
  const told = new Set<string>();
  for (const entry of entries) {
    if (!entry.named || entry.gameId === null) continue;
    if (entry.news === SITE_NEWS.firstGameOfGame || entry.news === SITE_NEWS.hardBotBeaten) told.add(entry.gameId);
  }
  return told;
}

/** The first day in the table: the catalogue the site opened with, not games that arrived. */
export function openingDay(added: Readonly<Record<string, string>>): string | null {
  const days = Object.values(added).sort();
  return days[0] ?? null;
}

/**
 * THE GAMES THAT ARRIVED, ONE LINE A DAY. John, 2026-09-26: "one message per
 * day for games... so sometimes we announce multi games per day in one
 * message."
 *
 * Dated at noon UTC on its day, which is that same day in every zone from
 * eleven hours behind to eleven ahead, so the line sits under the day it names.
 * Only days inside the window and not after today. The first day in the table
 * is left out: every game that was here when the pictures were first taken
 * shares it, and that is the catalogue the site opened with, not news.
 * Games in the catalogue's own order, so a day's line reads as /games does.
 */
export function addedEntries(added: Readonly<Record<string, string>>, now: Date, windowDays: number): FeedEntry[] {
  const opened = openingDay(added);
  const first = new Date(now.getTime() - windowDays * DAY_MS).toISOString().slice(0, 10);
  const last = now.toISOString().slice(0, 10);
  const byDay = new Map<string, string[]>();
  const order = EVERY_GAME_KEY as readonly string[];
  for (const [key, day] of Object.entries(added)) {
    if (day === opened || day < first || day > last) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), key]);
  }
  return [...byDay.entries()].map(([day, keys]) => ({
    kind: FEED_KINDS.added,
    id: `${FEED_KINDS.added}:${day}`,
    at: `${day}T12:00:00.000Z`,
    who: NOBODY,
    you: false,
    variants: [...keys].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
  }));
}
