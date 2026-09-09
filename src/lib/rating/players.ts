import "server-only";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame, tierFor, type GameScore, type RatingTier } from "./elo";
import { recordVariantResult } from "./variantRatings";

/**
 * Players by name. There are no accounts, so a name is an identity: the
 * folded form is the key, and the record and rating belong to whoever types
 * it. That is the honest limit of a site without sign-in, and the README says
 * so. Anonymous seats — a blank name — are never rated and never recorded.
 */

import { playerKey } from "./playerKey";
import { isReservedKey } from "./reservedKeys";

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
};

function toProfile(row: {
  key: string;
  name: string;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
}): PlayerProfile {
  return { ...row, tier: tierFor(row.ratedGames) };
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

export async function recordResult(
  blackName: string,
  whiteName: string,
  winner: "black" | "white" | null,
  variant: string,
): Promise<void> {
  const blackKey = playerKey(blackName);
  const whiteKey = playerKey(whiteName);
  if (
    blackKey === "" ||
    whiteKey === "" ||
    blackKey === whiteKey ||
    isReservedKey(blackKey) ||
    isReservedKey(whiteKey)
  ) {
    return;
  }

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
  const rated = rateGame(
    { rating: black.rating, ratedGames: black.ratedGames },
    { rating: white.rating, ratedGames: white.ratedGames },
    blackScore,
  );

  await prisma.$transaction([
    prisma.player.update({
      where: { key: blackKey },
      data: {
        rating: rated.first.rating,
        ratedGames: rated.first.ratedGames,
        wins: { increment: winner === "black" ? 1 : 0 },
        losses: { increment: winner === "white" ? 1 : 0 },
        draws: { increment: winner === null ? 1 : 0 },
      },
    }),
    prisma.player.update({
      where: { key: whiteKey },
      data: {
        rating: rated.second.rating,
        ratedGames: rated.second.ratedGames,
        wins: { increment: winner === "white" ? 1 : 0 },
        losses: { increment: winner === "black" ? 1 : 0 },
        draws: { increment: winner === null ? 1 : 0 },
      },
    }),
  ]);

  await recordVariantResult(blackName, whiteName, winner, variant);
}

/** One row of the directory: a member, with their record if they have one. */
export type DirectoryEntry = {
  email: string;
  name: string;
  picture: string;
  lastSeenAt: string;
  joinedAt: string;
  /** Joined within the last two weeks: someone to welcome. */
  isNew: boolean;
  profile: PlayerProfile | null;
};

/** How long a member counts as new in the directory. */
const NEW_FOR_DAYS = 14;

/**
 * Everyone who has come in, most recently seen first, with the record their
 * name has earned. A member who has not finished a game yet is still listed —
 * the directory is how people find each other to play.
 */
export async function fetchDirectory(limit: number): Promise<DirectoryEntry[]> {
  const members = await prisma.member.findMany({ orderBy: { lastSeenAt: "desc" }, take: limit });
  const keys = members.map((member) => playerKey(member.name)).filter((key) => key !== "");
  const players = keys.length === 0 ? [] : await prisma.player.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(players.map((row) => [row.key, toProfile(row)]));
  return members.map((member) => ({
    email: member.email,
    name: member.name,
    picture: member.picture,
    lastSeenAt: member.lastSeenAt.toISOString(),
    joinedAt: member.createdAt.toISOString(),
    isNew: Date.now() - member.createdAt.getTime() < NEW_FOR_DAYS * 86_400_000,
    profile: byKey.get(playerKey(member.name)) ?? null,
  }));
}
