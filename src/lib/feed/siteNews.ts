import { BOT_MEMBERS, BOT_MEMBER_IDS } from "@/lib/bots/bots.constants";
import { BOT_SPECIALIST_LIST, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { isBotId } from "@/lib/bots/bots";

import { SITE_NEWS, type SiteNewsKind } from "./siteNews.constants";

/**
 * WHAT IS NEWS, DECIDED WITHOUT A DATABASE. `siteNewsWrite.ts` asks these
 * questions of rows the site was already writing, and writes what they answer;
 * nothing here reads or writes anything, so every rule is tested alone.
 */

/** One row to write, as the model holds it. */
export type SiteNewsRow = {
  kind: SiteNewsKind;
  memberId: string | null;
  variant: string;
  subject: string;
  gameId: string | null;
};

/**
 * THE COMPUTER GRADES WORTH TELLING EVERYBODY ABOUT: the top two of the
 * ladder of grades, and every specialist.
 *
 * Read from the ladder's own order — `BOT_TIER_LIST` runs weakest first — so a
 * grade added above 国手 moves "the top two" with it, and nothing here names a
 * grade. The specialists are there for the reason `gradeAwards` pays them more:
 * each plays one game and has to be sought out, so beating one is always news.
 * The lower grades are not: beating the second-weakest program is a step, not a
 * headline, and every member takes it.
 */
export const HARD_GRADES: ReadonlySet<string> = new Set<string>([...BOT_TIER_LIST.slice(-2), ...BOT_SPECIALIST_LIST]);

export function isHardGrade(tier: string | null): boolean {
  return tier !== null && HARD_GRADES.has(tier);
}

/** A finished game's seats and result, as much as the rules below read. */
export type NewsGame = {
  id: string;
  variant: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  /** "black", "white", or null for a draw. */
  winner: string | null;
};

/**
 * WHETHER A GAME COULD BE A GAME'S FIRST, as the feed means it: two different
 * members in the seats, and at least one of them a person.
 *
 * Not a game against yourself at one screen — that is how a new game gets
 * tried out before anybody else has seen it, and "played for the first time"
 * would then be a sentence about John testing his own work. Not two programs
 * either: a ladder-filling batch is not anybody playing. `siteNewsWrite.ts`
 * asks the database the same question about every earlier game, so the first
 * game that passes this is the one announced, and a practice game before it
 * does not take its place.
 */
export function mayBeFirstGame(game: NewsGame): boolean {
  const { blackMemberId: black, whiteMemberId: white } = game;
  if (black === null || white === null || black === white) return false;
  return !(isBotId(black) && isBotId(white));
}

/** Every program's id, for the database's half of `mayBeFirstGame`. */
export const PROGRAM_IDS: readonly string[] = [...BOT_MEMBER_IDS];

/** One bound seat of a finished game, with what its row said BEFORE this game was counted. */
export type NewsSide = {
  memberId: string;
  outcome: "win" | "loss" | "draw";
  /** Wins and losses on the member's row before this game's result was added. */
  wonBefore: number;
  lostBefore: number;
};

/**
 * A MEMBER'S FIRST WIN AND FIRST LOSS HERE, read off the tallies the ending is
 * already carrying forward: a win is the first when the row held none before
 * it. The tally is the definition — it is the WON column the directory prints
 * — so "first" here and "1" there are one fact.
 *
 * People only. A program's first win was years of bot series ago and is
 * nobody's news. And never a game against yourself, which is practice: the
 * tally counts it (John has played himself), so a first win made that way is
 * simply not told, rather than told as though somebody had been beaten.
 */
export function firstResultNews(game: NewsGame, side: NewsSide): SiteNewsRow | null {
  if (isBotId(side.memberId)) return null;
  if (game.blackMemberId !== null && game.blackMemberId === game.whiteMemberId) return null;
  const kind =
    side.outcome === "win" && side.wonBefore === 0
      ? SITE_NEWS.firstWin
      : side.outcome === "loss" && side.lostBefore === 0
        ? SITE_NEWS.firstLoss
        : null;
  if (kind === null) return null;
  /* Keyed ("", member): once per member, ever, whatever game it was. */
  return { kind, memberId: side.memberId, variant: "", subject: side.memberId, gameId: game.id };
}

/** The first game of a game: told from the winner's side, or Black's on a draw. */
export function firstGameNews(game: NewsGame): SiteNewsRow {
  const subject = game.winner === "white" ? game.whiteMemberId : game.blackMemberId;
  return { kind: SITE_NEWS.firstGameOfGame, memberId: subject, variant: game.variant, subject: "", gameId: game.id };
}

/**
 * A top grade beaten by a person, as a row to try — the unique on (variant,
 * grade) is what makes it the FIRST person, and the writer asks the games
 * before it for the history the unique cannot know about.
 */
export function hardBotNews(game: NewsGame, winnerId: string, loserId: string, loserTier: string | null): SiteNewsRow | null {
  if (isBotId(winnerId) || !isHardGrade(loserTier)) return null;
  return { kind: SITE_NEWS.hardBotBeaten, memberId: winnerId, variant: game.variant, subject: loserTier as string, gameId: game.id };
}

/** Somebody at the top of a ladder: the row's key, and the member behind it where there is one. */
export type LadderLeader = { key: string; memberId: string | null };

/**
 * WHETHER A RATED RESULT PUT ONE OF ITS OWN PLAYERS AT THE TOP.
 *
 * `before` is undefined when the leader could not be read: a rule that cannot
 * measure must not fire, so nothing is said. Null is a ladder nobody stood on,
 * and the first rated game of a game puts its winner at the top — which is
 * true and is told.
 *
 * Only one of the game's own two players, and only a member: somebody who
 * rises because the old leader lost to a third player did not do anything this
 * game, and a name nobody holds an account under has nobody to tell about.
 */
export function firstPlaceNews(
  variant: string,
  gameId: string | null,
  before: LadderLeader | null | undefined,
  after: LadderLeader | null | undefined,
  seatKeys: readonly string[],
): SiteNewsRow | null {
  if (before === undefined || after === undefined || after === null) return null;
  if (before !== null && before.key === after.key) return null;
  if (after.memberId === null || !seatKeys.includes(after.key)) return null;
  if (gameId === null) return null;
  return { kind: SITE_NEWS.tookFirstPlace, memberId: after.memberId, variant, subject: gameId, gameId };
}

/** A best time's subject: its board and its time, which no earlier record can share. */
export function bestTimeSubject(size: number, level: string, elapsedMs: number): string {
  return `${size}:${level}:${elapsedMs}`;
}

/** The board and time back out of a best time's subject, or null for one this deploy cannot read. */
export function bestTimeParts(subject: string): { size: number; level: string; elapsedMs: number } | null {
  const [size, level, ms] = subject.split(":");
  const parsed = { size: Number(size), level: level ?? "", elapsedMs: Number(ms) };
  if (!Number.isInteger(parsed.size) || parsed.level === "" || !Number.isInteger(parsed.elapsedMs)) return null;
  return parsed;
}

/**
 * A SOLVE THAT SETS A NEW BEST: faster than the fastest before it at its kind,
 * size and level — or the first solve there is, which is the first record.
 * Strictly faster: equalling a time is not breaking it.
 */
export function bestTimeNews(
  solve: { memberId: string; kind: string; size: number; level: string; elapsedMs: number; solved: boolean },
  bestBefore: number | null,
): SiteNewsRow | null {
  if (!solve.solved) return null;
  if (bestBefore !== null && solve.elapsedMs >= bestBefore) return null;
  return {
    kind: SITE_NEWS.bestTime,
    memberId: solve.memberId,
    variant: solve.kind,
    subject: bestTimeSubject(solve.size, solve.level, solve.elapsedMs),
    gameId: null,
  };
}

/** The program behind a grade, so a line can name it and lead to its page; null for a grade this deploy does not know. */
export function programFor(tier: string): { id: string; name: string } | null {
  const bot = (BOT_MEMBERS as Record<string, { id: string; name: string } | undefined>)[tier];
  return bot === undefined ? null : { id: bot.id, name: bot.name };
}
