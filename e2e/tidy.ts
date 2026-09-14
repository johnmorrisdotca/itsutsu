import { test } from "@playwright/test";
import { PrismaClient, type Prisma } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { playerKey } from "../src/lib/rating/playerKey";
import { removePlayedUnder } from "./members";

/**
 * Clears what an earlier run of this suite left behind.
 *
 * The specs post seats and never take them down, so a local database
 * accumulates them a few at a time until the lobby specs start failing on
 * each other's leavings: "Post the seat" is never offered because a matching
 * seat is already waiting, and a row filtered by a player's name matches two
 * of them and fails on strict mode. Three sessions have now spent time
 * triaging failures that were nothing but this.
 *
 * Only unplayed open seats, which is exactly the litter and nothing else. A
 * game with a stone on it is somebody's game and is left alone whatever its
 * age; a seat nobody ever answered is not a record of anything.
 *
 * The guard is the point of the file. This deletes rows, so it refuses to run
 * against anything but a database on this machine — a suite that can quietly
 * delete from production because somebody exported the wrong URL is a far
 * worse thing than the mess it is cleaning up.
 */

export async function clearAbandonedSeats(): Promise<number> {
  /*
   * The dev server reads .env itself; this process has to be told, exactly as
   * e2e/members.ts is. Without it DATABASE_URL is undefined, the guard says
   * "not local" and this quietly does nothing at all — which would look like
   * a working tidy-up and be no tidy-up whatever.
   */
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const gone = await prisma.game.deleteMany({
      where: { status: "active", openSeat: { not: null }, moveCount: 0 },
    });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * How long a game must have sat untouched before this will consider it left
 * behind. The suite runs in ten minutes, so it can never reach its own.
 */
const STALE_MS = 60 * 60 * 1000;

/**
 * A member this suite made, known by two marks together.
 *
 * `invitedWith: "playwright"` is stamped by e2e/members.ts and by nothing else,
 * and the address is in a reserved example domain no real person can hold.
 * NEITHER MARK IS ENOUGH ALONE, and the stamp has proved it: the owner's real
 * row on this machine carries `invitedWith: "playwright"` — the suite used to
 * sign in as his address, and `ensureMember` stamps a row it makes — so the
 * stamp alone had every sweep here counting his games as the suite's. A
 * computer player is refused outright as well.
 */
const SUITE_MEMBER: Prisma.MemberWhereInput = {
  invitedWith: "playwright",
  botTier: null,
  OR: [{ email: { endsWith: "@example.com" } }, { email: { endsWith: "@example.test" } }],
};

/**
 * The games the suite has left behind, which nothing was clearing.
 *
 * `clearAbandonedSeats` takes away open seats with no moves. These are the
 * other kind, and there are far more of them: real two-seated games with
 * stones on them that the suite started and never finished. Every run leaves
 * a few hundred. Mine had reached **8,566 active games**, one member holding
 * 1,925 of them.
 *
 * They were harmless right up until they were not. A limit landed that counts
 * how many games one member is holding at once, and from that moment the
 * suite failed a dozen specs with a message about a twenty-game cap — in
 * files that had nothing to do with the cap and were testing something else
 * entirely. Raising the cap for the suite was necessary and nowhere near
 * enough: one member was at five times even the relieved limit.
 *
 * **Narrow twice over, and the second mark is the important one.** The rule
 * this file has always kept is that sweeping by age alone would eventually
 * take away a game somebody was playing on the dev site, and that is still
 * true — so age is never the only test. A game is only a candidate if one of
 * its seats belongs to a member this suite made — `SUITE_MEMBER`, both marks,
 * because the stamp alone matched the owner's own row and would have taken his
 * unfinished games. Age is the second mark, not the first: it keeps this off a
 * game being played right now, including the suite's own while it runs.
 *
 * Order matters, and it is the reason this runs before `clearSeededMembers`.
 * Nothing has a foreign key to Member, so a seat is a plain id string: clear
 * the members first and their games become unattributable, which is how a
 * pile like this one grows unnoticed in the first place.
 */
export async function clearSuiteGames(): Promise<number> {
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const theirs = await prisma.member.findMany({
      where: SUITE_MEMBER,
      select: { id: true },
    });
    if (theirs.length === 0) return 0;
    const ids = theirs.map((one) => one.id);

    const gone = await prisma.game.deleteMany({
      where: {
        status: "active",
        updatedAt: { lt: new Date(Date.now() - STALE_MS) },
        OR: [{ blackMemberId: { in: ids } }, { whiteMemberId: { in: ids } }],
      },
    });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * How long an unattributable game must have sat before this counts it left
 * behind. Six hours: far longer than a suite run, which takes ten minutes,
 * and long enough to survive somebody stepping away from a hot-seat game.
 */
const ORPHAN_STALE_MS = 6 * 60 * 60 * 1000;

/**
 * The games with nobody on either seat, which is the harder half.
 *
 * Six thousand of these had accumulated: hot-seat and anonymous games the
 * suite starts under a typed-in name, with no account on either side. They
 * cost nothing against the twenty-game cap, which only counts members, so
 * they are untidiness rather than breakage — but they are most of the rows in
 * a table every listing reads, and this file already knows what a database
 * that has grown too big does to lobby specs.
 *
 * **Age is genuinely all there is here, and that is worth saying out loud.**
 * Everything else in this file refuses to sweep on age alone, and it is right
 * to: `clearSuiteGames` has the suite's own mark on a seat and uses age only
 * as a second test. A game with no member on either seat carries no mark to
 * find. So this is the one exception, taken deliberately rather than by
 * forgetting the rule, and hedged the only two ways left — a database on this
 * machine, and a window six hours wide.
 *
 * What that costs, stated rather than glossed: a hot-seat game somebody set
 * up on their own dev site and left overnight will be taken. On a local
 * database that is a fair price for a listing that reflects reality; on any
 * other it would not be, which is why the guard above is not optional.
 */
export async function clearAnonymousGames(): Promise<number> {
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const gone = await prisma.game.deleteMany({
      where: {
        status: "active",
        blackMemberId: null,
        whiteMemberId: null,
        updatedAt: { lt: new Date(Date.now() - ORPHAN_STALE_MS) },
      },
    });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Takes one game away again, for a spec that made a seat it does not want to
 * leave standing.
 *
 * A seat left behind changes what another spec reads in the sentence, which
 * is how this suite spent a day failing on its own leavings. Same guard as
 * everything else here: a database on this machine, or nothing at all.
 */
export async function removeGame(id: string): Promise<void> {
  await removeGames([id]);
}

/**
 * The same, for every game one spec file made.
 *
 * One connection and one statement rather than one of each per game. A spec
 * that makes four games and takes them away one at a time opens four
 * connections to delete four rows, which is a slow way to be tidy and slow
 * enough that somebody stops being tidy.
 */
export async function removeGames(ids: readonly string[]): Promise<number> {
  if (ids.length === 0) return 0;
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const gone = await prisma.game.deleteMany({ where: { id: { in: [...ids] } } });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * A spec's own games, taken away when it finishes.
 *
 * `const mine = gamesMade();` at the top of a describe, then `mine(id)` on
 * each game as it is created. The afterAll is registered here so that being
 * tidy is one line rather than six, because a cleanup that takes six lines to
 * write is one that specs quietly go without.
 *
 * Only what this file made. Sweeping by age or by name ALONE would eventually
 * take away a game somebody was playing on the dev site, and a tidy-up that
 * can do that is worse than the mess — which is why `clearSuiteGames` above
 * needs the suite's own mark on a seat before age counts for anything.
 */
export function gamesMade(): (id: string) => string {
  const ids: string[] = [];
  test.afterAll(async () => {
    await removeGames(ids);
    ids.length = 0;
  });
  return (id: string) => {
    ids.push(id);
    return id;
  };
}

/**
 * The NAMES a spec's games were played under, taken away when it finishes.
 *
 * `const under = namesPlayedUnder();` beside `gamesMade()`, then
 * `blackName: under(\`Kaya ${stamp}\`)` where the name is invented. The games
 * go with `gamesMade`; this takes away what OUTLIVES them.
 *
 * Because a live game is created rated, and finishing one writes a `Player`
 * row and a `PlayerVariantRating` row keyed by the folded name — rows
 * `gamesMade` knows nothing about, so every run leaves two behind for ever.
 * Read off this machine on 2026-09-12: 413 `Kaya …` players, 413 variant
 * ratings, and one row named plain **Sumi** carrying 409 rated games and 409
 * losses, because two specs used a FIXED name for white. AGENTS.md names the
 * consequence — the name is taken for ever and `PATCH /api/me` answers 409 to
 * anybody who later asks for it.
 *
 * So a name a spec invents must be unique to the run AND taken away with it.
 * Only what this file made, by the same bargain as everything else here: a
 * bare "Sumi" is four hundred other games' standing and is not ours to drop.
 */
export function namesPlayedUnder(): (name: string) => string {
  const names: string[] = [];
  test.afterAll(async () => {
    await removePlayedUnder(names);
    names.length = 0;
  });
  return (name: string) => {
    names.push(name);
    return name;
  };
}

/**
 * And the members those runs invented.
 *
 * Every spec that needs a signed-in player writes one, and none of them take
 * it away, so a local database gains a handful per run for ever. Mine reached
 * a thousand — and that is not merely untidy. The members page shows the two
 * hundred most recently seen, so real rows fall off the end of it and real
 * tests fail for reasons that have nothing to do with the code. I spent an
 * evening triaging five such failures and called all five noise; two of them
 * were a genuine bug that only a database this size could show.
 *
 * Narrow on purpose, and narrow twice over — see `SUITE_MEMBER`. The suite's
 * operator is one of these ON PURPOSE: a test address, made by `ensureMember`
 * with the same stamp, so each run starts from an operator with no profile,
 * zone, preferences or record left by the last one. A real person's account
 * cannot carry both marks, and e2e/operator.ts refuses to sign the suite in as
 * anything that could.
 *
 * Nothing has a foreign key to Member — every reference to one is a plain
 * string — so this cannot cascade into anybody's game, and a finished game
 * keeps the names it was played under in its own columns either way.
 */
export async function clearSeededMembers(): Promise<number> {
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const gone = await prisma.member.deleteMany({ where: SUITE_MEMBER });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * The rating records those members earned, which outlive the members.
 *
 * A finished rated game writes a `Player` row and a `PlayerVariantRating` row
 * for each seat, keyed by the name played under and anchored by `memberId` to
 * the account behind it. `namesPlayedUnder` takes them away where a spec TYPED
 * the name. Where the name came from an account — a challenge between two
 * seeded members, a game against a program, anything played as the operator —
 * nothing did, and every run left some behind: 431 `Again …` and `Foe …` rows
 * on this machine on 2026-09-13, one rated game each.
 *
 * By the anchor, not the name, so a rating goes with the suite member who
 * earned it. Runs before `clearSeededMembers`, which removes the anchor. A row
 * whose member an earlier run already removed is not found by this.
 *
 * **Never a key a member outside the suite also answers to.** `memberIdForName`
 * anchors a row to the first member whose name folds to its key, whoever that
 * is — so a spec that seeds a member called "John Morris" can put its own id on
 * the owner's rating row. A name held outside the suite breaks the tie toward
 * keeping the row.
 */
export async function clearSeededRatings(): Promise<number> {
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const seeded = await prisma.member.findMany({ where: SUITE_MEMBER, select: { id: true } });
    if (seeded.length === 0) return 0;
    const ids = seeded.map((one) => one.id);
    const others = await prisma.member.findMany({ where: { id: { notIn: ids } }, select: { name: true } });
    const heldOutside = [...new Set(others.map((one) => playerKey(one.name)))];

    const where = { memberId: { in: ids }, key: { notIn: heldOutside } };
    await prisma.playerVariantRating.deleteMany({ where });
    const gone = await prisma.player.deleteMany({ where });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}
