import "server-only";

import { prisma } from "@/lib/prisma";
import { legaciesForName } from "@/lib/legacy/legacyPlayers.data";
import { wholeRecord } from "@/lib/legacy/wholeRecord";
import type { PlayedTally } from "@/lib/history/playerRecord";

import { playerKey } from "./playerKey";
import { streakIn, type Streak } from "./streak";
import { toProfile, type PlayerProfile } from "./players";

/**
 * A ROW OF THE MEMBERS DIRECTORY: a member, with the record their name has
 * earned.
 *
 * Split from `players.ts` because that file reached the size gate and the gate
 * was right — two audiences were sharing a module, the same way `members.ts`
 * and `memberRoster.ts` came apart. Everything left in `players.ts` answers
 * "what has this NAME earned": the rating row, the tiers, the exchange one
 * game makes. Everything here answers "who is on this site, and what should
 * their line say" — a member-keyed question, drawn from `Member` rows with a
 * rating hung off them rather than the other way round.
 *
 * The seam was already there. `DirectoryEntry` has never been a `Player`, and
 * `toDirectory`'s whole difficulty is that the two are keyed differently: a
 * member by an opaque id, a rating by the folded name it was earned under.
 */
/** One row of the directory: a member, with their record if they have one. */
export type DirectoryEntry = {
  /**
   * The member's opaque id: the one thing every member has and no two share.
   * It is what a list of these is keyed by — the address is null for a kept
   * record, and two of those in one list are two rows with the same key.
   */
  id: string;
  /** Null for a kept record: somebody who never signed in. */
  email: string | null;
  name: string;
  picture: string;
  lastSeenAt: string;
  joinedAt: string;
  /** Joined within the last two weeks: someone to welcome. */
  isNew: boolean;
  /** As they wrote it: free text, resolved to a flag where it can be. */
  country: string;
  profile: PlayerProfile | null;
  /**
   * Every finished game this member has played here, won, lost and drawn —
   * OFF THE MEMBER'S OWN ROW, not counted out of the games table per page.
   *
   * This is what the PLAYED, W, L and D columns show, and it used to come from
   * `fetchPlayedTallies`: one query for the whole page, which was the right
   * answer while the directory was a single capped list. It could not be
   * ORDERED by, though, because an order has to be decided before a page is
   * chosen — so the four figures are columns on `Member` now, and this carries
   * them on rows the list was fetching anyway.
   *
   * The DEFINITION has not moved an inch: `playedRun.ts` states it,
   * `recordPlayed` maintains it at all four endings, the migration filled it
   * with the same arithmetic, and `playedTally.test.ts` checks the column and
   * `fetchPlayedTallies` against the same games. A directory that disagreed
   * with a player's own page by one game would be worse than one that could
   * not sort.
   */
  played: PlayedTally;
  /**
   * The run over every finished game this member has played here, rated or
   * not — the set the PLAYED column counts, and the only run that matches it.
   *
   * On the entry rather than inside `profile`, because `profile` is the rating
   * table and this is not a rating: it is kept on `Member`, keyed by the id,
   * and a member who has only ever played friendly games has this and no
   * profile at all. Read off the row this function was already fetching, so
   * the members list pays nothing for it — see `rating/playedRun.ts`.
   */
  playedStreak: Streak | null;
  /**
   * What this name played before Itsutsu, from the kept records — nought for
   * almost everybody, and thousands for the few it is not.
   *
   * Carried on the row because the list is where it was missing. A kept record
   * had a member row so the site could list them at all, and the list read the
   * Itsutsu columns alone, so Chibi appeared as somebody who had never played
   * a game while his own page showed fourteen thousand. The two were reading
   * different halves of the same person.
   *
   * Games only. There is no rating here and there will not be one: another
   * site's is on another scale, against other players, and was never
   * converted.
   */
  elsewhere: { wins: number; losses: number; draws: number };
  /** The engine that plays this member's seats, when a program does. */
  botTier: string | null;
  unclaimableBecause: string | null;
  /**
   * Their XP total, for the level badge beside their name.
   *
   * COSTS NOTHING, which is the only reason it is here. `toDirectory` is handed
   * whole `Member` rows — `prisma.member.findMany` with no `select` — so this
   * column was already read and thrown away on every one of the three lists
   * built from it. The level itself is not stored and never will be:
   * `xpLevelFor` is a lookup over a hundred numbers in memory, so a badge on
   * every row of a page of members is free. See `Member.xp` in the schema, which
   * says the same thing from the other end.
   *
   * The TOTAL and not the level, because a row carrying a level would be
   * carrying an answer to a question the reader has not asked yet — whether
   * there is a standing worth printing at all is `levelShown`'s to decide, and
   * a program's nought must reach it rather than arriving as a 1.
   */
  xp: number;
};

/** How long a member counts as new in the directory. */
const NEW_FOR_DAYS = 14;

/**
 * What one name played before this site, summed across the sites it was kept
 * from — nought where there is nothing kept, which is almost everybody.
 *
 * `wholeRecord` is handed an empty "here", so what comes back is the kept
 * part alone: this site's own games are already counted from the rating rows
 * and adding them here would count them twice.
 */
function keptRecordFor(name: string): { wins: number; losses: number; draws: number } {
  const kept = wholeRecord(legaciesForName(name), { won: 0, lost: 0, drawn: 0 });
  return { wins: kept.figures.won, losses: kept.figures.lost, draws: kept.figures.drawn };
}

/**
 * Everyone who has come in, most recently seen first, with the record their
 * name has earned. A member who has not finished a game yet is still listed —
 * the directory is how people find each other to play.
 */
export async function fetchDirectory(limit: number): Promise<DirectoryEntry[]> {
  return toDirectory(await prisma.member.findMany({ orderBy: { lastSeenAt: "desc" }, take: limit }));
}

/**
 * Every computer player, however many people are on the site.
 *
 * They used to be picked out of the directory's first page, which is ordered
 * by who was seen last and cut at a limit. A computer player is never "seen"
 * — it does not sign in — so the moment the site had more members than that
 * limit, every one of them dropped off the end and the players page had no computer
 * opponents on it at all. Nobody would have connected the two facts.
 *
 * They are a fixed, tiny set, so they are fetched as one: a directory page is
 * a page of people, and this is not that.
 */
export async function fetchComputerPlayers(): Promise<DirectoryEntry[]> {
  return toDirectory(await prisma.member.findMany({ where: { botTier: { not: null } } }));
}

/*
 * `fetchKeptRecords` WAS HERE, and where it went is worth a line.
 *
 * It fetched the kept records on their own for the reason above — somebody
 * remembered here never signs in, so their stamp is frozen and they sink past
 * the end of any recency order — and the directory appended them to its capped
 * list. The cap is a PAGE now, so nothing falls off an end, and the guarantee
 * moved into the read that pages: `NEVER_SEEN` in `directoryWhere.ts` is the
 * same set of rows, and `fetchDirectoryPage` pins them onto the first page of
 * the directory's own order and lifts them out of the paged query while it does,
 * so they appear once rather than on every page. The reasoning is written there,
 * beside the code that acts on it, rather than left on a function nothing calls.
 */

type MemberRow = Awaited<ReturnType<typeof prisma.member.findMany>>[number];

/**
 * Whole `Member` rows turned into directory rows, with the rating each name has
 * earned found in one query rather than one per row.
 *
 * EXPORTED since the directory learned to page: `fetchDirectoryPage` does its
 * own ordered read — that is the whole point of it — and then needs exactly this
 * to turn what it read into rows. A second copy of the member-first-name-after
 * lookup below is the last thing this file needs; it is the one that printed the
 * zeros John saw.
 */
export async function toDirectory(members: MemberRow[]): Promise<DirectoryEntry[]> {
  /*
   * FOUND BY THE MEMBER, WITH THE NAME AS THE FALLBACK — and this is the
   * function that printed the zeros John saw.
   *
   * The directory asked for each member's record under `playerKey(member.name)`,
   * their name TODAY. A rating is keyed by the name it was EARNED under, and
   * that key does not move when somebody renames, so a renamed member read as
   * "0 games played" on the page that lists everybody. Their row was one
   * column away the whole time: `memberId` is on it and indexed.
   *
   * Both lookups, one query each, because the name is still the only handle
   * on a record with nobody behind it — a kept record from another site, or a
   * name typed into a game at one screen. The member's own row wins where
   * both answer.
   */
  const ids = members.map((member) => member.id).filter((id) => id !== "");
  const keys = members.map((member) => playerKey(member.name)).filter((key) => key !== "");
  const [owned, named] = await Promise.all([
    ids.length === 0 ? [] : prisma.player.findMany({ where: { memberId: { in: ids } } }),
    keys.length === 0 ? [] : prisma.player.findMany({ where: { key: { in: keys } } }),
  ]);
  const byMember = new Map(owned.map((row) => [row.memberId, toProfile(row)]));
  const byKey = new Map(named.map((row) => [row.key, toProfile(row)]));
  return members.map((member) => ({
    id: member.id,
    email: member.email,
    name: member.name,
    picture: member.picture,
    lastSeenAt: member.lastSeenAt.toISOString(),
    joinedAt: member.createdAt.toISOString(),
    isNew: Date.now() - member.createdAt.getTime() < NEW_FOR_DAYS * 86_400_000,
    country: member.country,
    profile: byMember.get(member.id) ?? byKey.get(playerKey(member.name)) ?? null,
    /*
     * The four counts, off the member's own row. `played` is on the row too and
     * is the sum of these three by construction, so it is not carried twice: the
     * table works the total out of the parts exactly as it always has, and the
     * column exists so the DATABASE can order by it. See `playedTallyWrite`.
     */
    played: { wins: member.won, losses: member.lost, draws: member.drawn },
    /*
     * From the member's own row, never from the rating row beside it. The
     * count this sits under is keyed by member id, and so is this — which is
     * the point of keeping it here rather than on `Player`, whose key is a
     * folded name that stops matching the moment somebody renames.
     */
    playedStreak: streakIn(member as unknown as Record<string, unknown>, "played"),
    elsewhere: keptRecordFor(member.name),
    botTier: member.botTier,
    unclaimableBecause: member.unclaimableBecause,
    // Off the member's own row, already fetched. See the field's own note.
    xp: member.xp,
  }));
}
