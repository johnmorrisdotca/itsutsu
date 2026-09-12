import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { RATING_START, rateGame } from "./elo";
import { playerKey } from "./playerKey";
import { memberIdForName } from "./players";
import { outcomeFor, poolWrite, standingIn, type RatingPool } from "./pools";
import { isRateable } from "./rateable";
import { PLAYER_STREAK_SCOPES, VARIANT_STREAK_SCOPES, streakWrite, type StreakOutcome } from "./streak";
import { scoreForBlack } from "./variantRatings";

/**
 * Records one finished game: win, loss and draw tallies for both players, a
 * rating exchange, and the run each of them is now on — on BOTH ladders, in
 * ONE transaction.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS ITS OWN MODULE, AND WHY THE TRANSACTION IS THE WHOLE POINT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A rated game moves two records of the same fact: the ladder across every
 * game (`Player`) and the standing at the one game it was played under
 * (`PlayerVariantRating`). They are two tables and one truth, so the count in
 * one has to be the count in the other.
 *
 * Until this module they were written by two functions in two files, each
 * opening a transaction of its own: `recordResult` committed the `Player`
 * half and then called `recordVariantResult`, which committed the standings
 * half separately. Two commits, sequentially, with an await between them —
 * so anything at all that stopped the second one left the first one standing:
 *
 *   - a throw inside the standings half. The likeliest one is a unique
 *     violation on `(key, variant)`: for an established name the `Player`
 *     upsert always takes the UPDATE path and cannot collide, while the
 *     standing for a game that name has not played before does not exist yet
 *     and takes the CREATE path. Two games of that variant finishing at once
 *     — which is exactly what a bot batch does — raced on the same new
 *     primary key, and the loser threw AFTER the ladder had already been
 *     credited. `appendMove` catches the same race one layer up, which is how
 *     we know it happens here.
 *   - the invocation being killed between the two commits. The finishing move
 *     of a game against a computer is the most expensive request this site
 *     makes; it is the one most likely to be cut off.
 *
 * Either way the ladder counted a game the standing never saw, **and the gap
 * is permanent**: from the next game on both tables increment by one, so the
 * standing stays exactly that far behind for ever. Nothing reports it. The
 * game is already filed as finished by the time `recordResult` is called, so
 * a throw here is a 500 on a request whose work has otherwise landed, and on
 * the bot path it is a line in a batch log nobody reads.
 *
 * That is the fault filed as `two-per-game-standings-are-one-game-behind-the-
 * ladder`: two computer players one game apart between the two tables, which
 * also stops `backfillStreaks.play.test.ts` writing their runs — it refuses to
 * believe a rebuild that disagrees with the record stored beside it, and quite
 * rightly.
 *
 * So there is now ONE function that records a result, it is the only thing
 * anywhere that writes either table's figures, and the four updates it makes
 * go in a single `$transaction`. Both ladders move together or neither does.
 * `standings.coverage.test.ts` is what keeps it that way.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IS OUTSIDE THE TRANSACTION, AND WHY THAT IS SAFE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The four rows have to be READ to work out the exchange and carry the run
 * forward, and a row that does not exist yet has to be created first. That is
 * `openRow` below, and it runs before the transaction.
 *
 * A row it creates and the transaction then fails to fill is a row at the
 * starting rating over no games at all — which is what "this name has never
 * played" already looks like, and every reader filters it out on
 * `ratedGames > 0`. It says nothing untrue and the next game fills it in. The
 * figures are the thing that must never disagree, and the figures are all
 * inside the one commit.
 *
 * `openRow` also no longer throws on the race described above: a unique
 * violation there means the other writer has just created the row this one
 * wanted, so it is read back rather than raised. That removes the trigger as
 * well as the damage.
 */

const UNIQUE_VIOLATION = "P2002";

/** One seat's half of a result: who, and how it went for them. */
type Seat = {
  key: string;
  name: string;
  memberId: string | null;
  outcome: StreakOutcome;
};

/**
 * Whether this is the "two writers created the same row at once" error.
 *
 * The loser of that race wanted a row that now exists, which is the thing it
 * was asking for — so it is read rather than raised. Anything else is a real
 * failure and is left to throw, because a result nobody recorded is better
 * than half a result nobody can see.
 */
function isRaceOnCreate(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION;
}

/** The ladder row for one name, made if it is not there, as it now stands. */
async function openPlayer(seat: Seat): Promise<Record<string, unknown>> {
  const where = { key: seat.key };
  const create = { key: seat.key, name: seat.name, rating: RATING_START, memberId: seat.memberId };
  const update = { name: seat.name, ...(seat.memberId === null ? {} : { memberId: seat.memberId }) };
  try {
    return (await prisma.player.upsert({ where, create, update })) as unknown as Record<string, unknown>;
  } catch (error) {
    if (!isRaceOnCreate(error)) throw error;
    return (await prisma.player.update({ where, data: update })) as unknown as Record<string, unknown>;
  }
}

/** The same, for one name's standing at one game. */
async function openStanding(seat: Seat, variant: string): Promise<Record<string, unknown>> {
  const where = { key_variant: { key: seat.key, variant } };
  const create = { key: seat.key, variant, name: seat.name, rating: RATING_START, memberId: seat.memberId };
  const update = { name: seat.name, ...(seat.memberId === null ? {} : { memberId: seat.memberId }) };
  try {
    return (await prisma.playerVariantRating.upsert({
      where,
      create,
      update,
    })) as unknown as Record<string, unknown>;
  } catch (error) {
    if (!isRaceOnCreate(error)) throw error;
    return (await prisma.playerVariantRating.update({ where, data: update })) as unknown as Record<
      string,
      unknown
    >;
  }
}

/**
 * `pool` says which ladder this game moves — see `pools.ts`. It is required
 * rather than defaulted, so that every place a game is recorded has had to
 * decide whether it was played against a person or against the computer. A
 * default here would quietly rate a game against Meijin on the ladder of
 * people, which is the one thing the two pools exist to prevent.
 *
 * A game with a blank name on either side, both seats under one name, or a
 * name kept for somebody who never played here changes nothing — the rule is
 * `rateable.ts`, so a page can say what it decided rather than leaving a
 * player to work out why nothing happened. A draw scores a half each.
 */
export async function recordResult(
  blackName: string,
  whiteName: string,
  winner: "black" | "white" | null,
  variant: string,
  pool: RatingPool,
): Promise<void> {
  if (!isRateable(blackName, whiteName)) return;

  /*
   * Whose record this is. A rating is earned by a person rather than by a
   * spelling, so it is anchored to the member's opaque id wherever there is
   * one to anchor it to. A name nobody holds an account under stays open —
   * inventing an identity for every name typed into a game at one screen
   * would be worse than leaving the question unanswered until it is asked.
   *
   * Asked ONCE for the whole result. The two halves used to ask separately,
   * which read the Member table four times to answer one game twice.
   */
  const [blackId, whiteId] = await Promise.all([
    memberIdForName(blackName),
    memberIdForName(whiteName),
  ]);

  const black: Seat = {
    key: playerKey(blackName),
    name: blackName.trim(),
    memberId: blackId,
    outcome: outcomeFor(winner, "black"),
  };
  const white: Seat = {
    key: playerKey(whiteName),
    name: whiteName.trim(),
    memberId: whiteId,
    outcome: outcomeFor(winner, "white"),
  };

  const [blackRow, whiteRow, blackStanding, whiteStanding] = await Promise.all([
    openPlayer(black),
    openPlayer(white),
    openStanding(black, variant),
    openStanding(white, variant),
  ]);

  /*
   * The same maths on both ladders, from `elo.ts`, applied to two different
   * pairs of rows — a standing at one game is its own Elo and moves at its own
   * speed. Both sides are read from, and written to, the same pool: that is
   * what makes a game against the computer a symmetric rated game rather than
   * an exhibition.
   */
  const score = scoreForBlack(winner);
  const ladder = rateGame(standingIn(blackRow, pool), standingIn(whiteRow, pool), score);
  const standing = rateGame(standingIn(blackStanding, pool), standingIn(whiteStanding, pool), score);

  /*
   * The run is carried forward from the rows already in hand — THE WRITER
   * ALREADY KNOWS. Nothing is read back: the rows above returned the run so
   * far, and one more result extends it or starts a new one. A streak worked
   * out by reading a player's games would be a query per row on every page
   * that lists people, which is the cost this design exists to avoid.
   *
   * The ladder keeps three runs and a standing keeps two, which is why the
   * scopes are passed in rather than assumed — see `streak.ts`.
   */
  const writes = [
    {
      key: black.key,
      ladder: { ...poolWrite(pool, ladder.first.rating, ladder.first.ratedGames, black.outcome), ...streakWrite(blackRow, black.outcome, PLAYER_STREAK_SCOPES) },
      standing: { ...poolWrite(pool, standing.first.rating, standing.first.ratedGames, black.outcome), ...streakWrite(blackStanding, black.outcome, VARIANT_STREAK_SCOPES) },
    },
    {
      key: white.key,
      ladder: { ...poolWrite(pool, ladder.second.rating, ladder.second.ratedGames, white.outcome), ...streakWrite(whiteRow, white.outcome, PLAYER_STREAK_SCOPES) },
      standing: { ...poolWrite(pool, standing.second.rating, standing.second.ratedGames, white.outcome), ...streakWrite(whiteStanding, white.outcome, VARIANT_STREAK_SCOPES) },
    },
    /*
     * SORTED BY KEY, so that any two of these lock the same rows in the same
     * order. Two games between the same pair with the colours swapped would
     * otherwise take the two locks the opposite way round and deadlock — and a
     * deadlock aborts the commit, which now means a result nobody recorded
     * rather than half of one, but a lost result is still a lost result. Which
     * seat is black decides the FIGURES, never the order they are written in.
     */
  ].sort((one, two) => one.key.localeCompare(two.key));

  await prisma.$transaction([
    ...writes.map((seat) => prisma.player.update({ where: { key: seat.key }, data: seat.ladder as never })),
    ...writes.map((seat) =>
      prisma.playerVariantRating.update({
        where: { key_variant: { key: seat.key, variant } },
        data: seat.standing as never,
      }),
    ),
  ]);
}
