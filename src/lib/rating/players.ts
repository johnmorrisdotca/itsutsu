import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";
import { recordVariantResult } from "./variantRatings";
import { outcomeFor, poolWrite, standingIn, type RatingPool } from "./pools";

/**
 * Players by name. There are no accounts, so a name is an identity: the
 * folded form is the key, and the record and rating belong to whoever types
 * it. That is the honest limit of a site without sign-in, and the README says
 * so. Anonymous seats — a blank name — are never rated and never recorded.
 */

import { playerKey } from "./playerKey";
import { isRateable } from "./rateable";
import { ratingShown } from "./wholeRecord";

export { playerKey };

export type PlayerProfile = {
  key: string;
  name: string;
  rating: number;
  ratedGames: number;
  tier: RatingTier;
  wins: number;
  losses: number;
  draws: number;
  /**
   * The same figures for games played against the computer players, which are
   * scored in a pool of their own so a game against a program never moves
   * where somebody stands among the people.
   *
   * A computer player has nothing BUT this: it never plays a person-against-
   * person game, so its ordinary rating sits at its starting value for ever
   * and its wins and losses stay at nought. A page that read the ordinary
   * figures for a bot would say it had never played, however many games it
   * had just finished.
   */
  computer: { rating: number; ratedGames: number; wins: number; losses: number; draws: number };
};

function toProfile(row: {
  key: string;
  name: string;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
  computerRating: number;
  computerRatedGames: number;
  computerWins: number;
  computerLosses: number;
  computerDraws: number;
}): PlayerProfile {
  const { computerRating, computerRatedGames, computerWins, computerLosses, computerDraws, ...people } = row;
  return {
    ...people,
    tier: tierFor(row.ratedGames),
    computer: {
      rating: computerRating,
      ratedGames: computerRatedGames,
      wins: computerWins,
      losses: computerLosses,
      draws: computerDraws,
    },
  };
}

export async function fetchPlayer(name: string): Promise<PlayerProfile | null> {
  const key = playerKey(name);
  if (key === "") return null;
  const row = await prisma.player.findUnique({ where: { key } });
  return row === null ? null : toProfile(row);
}

/**
 * The top players by rating, established ones first.
 *
 * The order among equals is settled rather than left to the database. A new
 * site is a wall of people on the same rating with the same number of games,
 * and an order nobody chose is an order that changes between two loads of the
 * same page: a name moves up, another disappears off the end, and nothing
 * happened. Among a tie the one who played most recently stands higher, and
 * the name settles the rest, so the list is the same list twice running.
 */
export async function fetchLeaders(limit: number): Promise<PlayerProfile[]> {
  const rows = await prisma.player.findMany({
    where: { ratedGames: { gt: 0 } },
    orderBy: [
      { rating: "desc" },
      { ratedGames: "desc" },
      { updatedAt: "desc" },
      { key: "asc" },
    ],
    take: limit,
  });
  return rows.map(toProfile);
}

/**
 * Records one finished game between two named players: win, loss and draw
 * tallies for both, and a rating exchange. A game with a blank name on
 * either side changes nothing, and a draw scores a half each.
 *
 * The same result moves two ladders — the global one here, and the standing
 * for the variant it was played under — so they are written together and
 * never drift apart.
 */
/**
 * The member who plays under this name, by id, or null when nobody does.
 *
 * Matched on the folded name, which is how every other part of this site
 * decides that two spellings are one person. It is not how identity will
 * work for ever — that is what the id is for — but it is how a name typed
 * into a game finds the account it belongs to today.
 */
export async function memberIdForName(name: string): Promise<string | null> {
  const key = playerKey(name);
  if (key === "") return null;
  const rows = await prisma.member.findMany({ select: { id: true, name: true } });
  return rows.find((row) => playerKey(row.name) === key)?.id ?? null;
}

/**
 * `pool` says which ladder this game moves — see `pools.ts`. It is required
 * rather than defaulted, so that every place a game is recorded has had to
 * decide whether it was played against a person or against the computer. A
 * default here would quietly rate a game against Meijin on the ladder of
 * people, which is the one thing the two pools exist to prevent.
 */
export async function recordResult(
  blackName: string,
  whiteName: string,
  winner: "black" | "white" | null,
  variant: string,
  pool: RatingPool,
): Promise<void> {
  const blackKey = playerKey(blackName);
  const whiteKey = playerKey(whiteName);
  // The rule is `rateable.ts`, so that the pages can say what it decided
  // rather than leaving a player to work out why nothing happened.
  if (!isRateable(blackName, whiteName)) return;

  /*
   * Whose record this is. A rating is earned by a person rather than by a
   * spelling, so it is anchored to the member's opaque id wherever there is
   * one to anchor it to. A name nobody holds an account under stays open —
   * inventing an identity for every name typed into a game at one screen
   * would be worse than leaving the question unanswered until it is asked.
   */
  const [blackId, whiteId] = await Promise.all([
    memberIdForName(blackName),
    memberIdForName(whiteName),
  ]);

  const [black, white] = await Promise.all([
    prisma.player.upsert({
      where: { key: blackKey },
      create: { key: blackKey, name: blackName.trim(), rating: RATING_START, memberId: blackId },
      update: { name: blackName.trim(), ...(blackId === null ? {} : { memberId: blackId }) },
    }),
    prisma.player.upsert({
      where: { key: whiteKey },
      create: { key: whiteKey, name: whiteName.trim(), rating: RATING_START, memberId: whiteId },
      update: { name: whiteName.trim(), ...(whiteId === null ? {} : { memberId: whiteId }) },
    }),
  ]);

  const blackScore: GameScore = winner === "black" ? 1 : winner === "white" ? 0 : 0.5;
  // Both sides are read from, and written to, the same pool: that is what makes
  // a game against the computer a symmetric rated game rather than an exhibition.
  const before = { black: standingIn(black, pool), white: standingIn(white, pool) };
  const rated = rateGame(before.black, before.white, blackScore);

  await prisma.$transaction([
    prisma.player.update({
      where: { key: blackKey },
      // The columns are chosen by pool, so the shape is built rather than written out.
      data: poolWrite(pool, rated.first.rating, rated.first.ratedGames, outcomeFor(winner, "black")) as never,
    }),
    prisma.player.update({
      where: { key: whiteKey },
      data: poolWrite(pool, rated.second.rating, rated.second.ratedGames, outcomeFor(winner, "white")) as never,
    }),
  ]);

  await recordVariantResult(blackName, whiteName, winner, variant, pool);
}

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
  /** The engine that plays this member's seats, when a program does. */
  botTier: string | null;
  unclaimableBecause: string | null;
};

/** How long a member counts as new in the directory. */
const NEW_FOR_DAYS = 14;

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

/**
 * The rating worth showing beside a batch of names at once, keyed by the
 * folded name each was asked by.
 *
 * For the noticeboard's rating filter, which asks this once for every seat
 * on the board rather than once per row — the same reason `toDirectory`
 * fetches every player row it needs in a single query instead of one per
 * member. A name nobody has a settled rating for maps to null, the same
 * "nothing to show" `ratingShown` already uses, rather than to a starting
 * figure nobody earned.
 */
export async function ratingsByName(names: readonly string[]): Promise<Map<string, number | null>> {
  const keys = [...new Set(names.map(playerKey).filter((key) => key !== ""))];
  if (keys.length === 0) return new Map();
  const rows = await prisma.player.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((row) => [row.key, ratingShown(toProfile(row))?.rating ?? null]));
  return new Map(keys.map((key) => [key, byKey.get(key) ?? null]));
}

type MemberRow = Awaited<ReturnType<typeof prisma.member.findMany>>[number];

async function toDirectory(members: MemberRow[]): Promise<DirectoryEntry[]> {
  const keys = members.map((member) => playerKey(member.name)).filter((key) => key !== "");
  const players = keys.length === 0 ? [] : await prisma.player.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(players.map((row) => [row.key, toProfile(row)]));
  return members.map((member) => ({
    id: member.id,
    email: member.email,
    name: member.name,
    picture: member.picture,
    lastSeenAt: member.lastSeenAt.toISOString(),
    joinedAt: member.createdAt.toISOString(),
    isNew: Date.now() - member.createdAt.getTime() < NEW_FOR_DAYS * 86_400_000,
    country: member.country,
    profile: byKey.get(playerKey(member.name)) ?? null,
    botTier: member.botTier,
    unclaimableBecause: member.unclaimableBecause,
  }));
}
