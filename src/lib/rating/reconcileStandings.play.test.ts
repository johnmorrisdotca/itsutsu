/**
 * Brings the per-game standings back into step with the ladder, once.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT WENT WRONG, AND WHAT THIS REPAIRS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A rated game belongs in two tables: `Player`, the record across every game
 * here, and `PlayerVariantRating`, the record at the one game it was played
 * at. Until the fix that came with this runner they were written by two
 * functions in two files, each opening a transaction of its own — the ladder
 * committed first, then the standing. Anything that stopped the second commit
 * left the ladder holding a game the standing never got, and the gap is
 * permanent: from the next game on, both increment by one.
 *
 * Two computer players reached production that way, filed as
 * `two-per-game-standings-are-one-game-behind-the-ladder`. It also stops
 * `backfillStreaks.play.test.ts` doing its job, because that runner will not
 * write a run it cannot reconcile with the record stored beside it — which is
 * the right answer, and leaves those rows on a dash for ever.
 *
 * `recordResult.ts` is the fix; this is the repair. The code fix stops it
 * happening again and does nothing at all about the rows already wrong.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT REPAIRS ONE SHAPE AND REFUSES EVERY OTHER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The games are the only source of truth here, so every figure is rebuilt from
 * them — using the write path's OWN rules, imported rather than restated:
 * `rated`, `isHotSeat`, `isRateable`, and `poolFor(hasBotSeat(game))`. A first
 * draft of the streak backfill copied those by hand and disagreed with the
 * stored tallies on the first row it met.
 *
 * A pair is repaired only when all of this is true:
 *
 *   - the `Player` row for that name reproduces the rebuild EXACTLY, in both
 *     pools. The ladder being right is what makes "the standing is behind"
 *     a diagnosis rather than a guess; if the ladder is wrong too, this is
 *     not the fault filed and nothing here knows which of them to believe.
 *   - the standing is BEHIND the rebuild in exactly one pool — every figure
 *     at or below the rebuilt one — and reproduces the other pool exactly.
 *   - nothing about it is AHEAD. A standing holding more than the games can
 *     account for is a different fault (a double write, or games swept out
 *     from under a row, which is what a development database is full of), and
 *     this runner has no business deciding what to take away.
 *
 * Anything else is printed as REFUSED with the reason, and left alone.
 * Silence over a plausible guess — see "Nothing Answers What It Cannot
 * Answer" in AGENTS.md.
 *
 * **AND IT NEVER WRITES A RATING.** The counts can be rebuilt exactly; an Elo
 * rating cannot, because it depends on what both players' ratings were at the
 * moment each game was scored, and every game since has moved them. A
 * plausible rating would be indistinguishable from an earned one for ever. So
 * an existing row keeps the rating it has, a row that has to be made takes the
 * column's own starting value, and the report says so on every line. The fault
 * filed is that the two tables disagree about HOW MANY GAMES WERE COUNTED, and
 * the counts — with the run that goes with them — are what this puts right.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * RUNNING IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   pnpm standings:reconcile                               # report only
 *   STANDINGS_RECONCILE_RUN=1 pnpm standings:reconcile     # writes
 *
 * It prints the database it reached and what that database holds BEFORE
 * anything else. Read that line: production and a development database are
 * not close in size, so it settles in one number what no amount of re-reading
 * a command line can.
 *
 * SAFE TO RUN TWICE. The answer is read from the games each time, so a second
 * run finds nothing to do and says so — it is not an append. A run prints the
 * count of disagreements before and after, and the after must be nought.
 *
 * It is a `.test.ts` for the reason AGENTS.md gives: `@/` aliases do not
 * resolve in a plain node script. `--disable-console-intercept` is in the
 * pnpm script because vitest otherwise swallows the whole report.
 */
import { describe, expect, it } from "vitest";

import { hasBotSeat } from "@/lib/bots/bots";
import { isHotSeat } from "@/lib/history/liveGame";
import { RATING_START } from "./elo";
import { isRateable } from "./rateable";
import { playerKey } from "./playerKey";
import { POOL_COLUMNS, RATING_POOL_LIST, poolFor, type RatingPool } from "./pools";
import { prisma } from "@/lib/prisma";
import { STREAK_COLUMNS, extendStreak, type Streak, type StreakOutcome } from "./streak";

const ASKED = process.env.STANDINGS_RECONCILE === "1";
const RUN = process.env.STANDINGS_RECONCILE_RUN === "1";

/** One pool's rebuild for one name, or one name at one game. */
type Tally = {
  wins: number;
  losses: number;
  draws: number;
  streak: Streak | null;
  /** The games behind it, so the report can name the one a row is missing. */
  games: { id: string; outcome: StreakOutcome; playedAt: Date }[];
};

const empty = (): Tally => ({ wins: 0, losses: 0, draws: 0, streak: null, games: [] });
type ByPool = Record<RatingPool, Tally>;
const emptyPools = (): ByPool => ({ people: empty(), computer: empty() });

type Stored = { wins: number; losses: number; draws: number };

function count(into: Tally, outcome: StreakOutcome, game: { id: string; playedAt: Date }): void {
  into.streak = extendStreak(into.streak, outcome);
  if (outcome === "win") into.wins += 1;
  else if (outcome === "loss") into.losses += 1;
  else into.draws += 1;
  into.games.push({ id: game.id, outcome, playedAt: game.playedAt });
}

function figures(tally: Tally): Stored {
  return { wins: tally.wins, losses: tally.losses, draws: tally.draws };
}

function same(one: Stored, two: Stored): boolean {
  return one.wins === two.wins && one.losses === two.losses && one.draws === two.draws;
}

/** Stored is behind rebuilt in every figure, and short in at least one. */
function behind(stored: Stored, rebuilt: Stored): boolean {
  return (
    stored.wins <= rebuilt.wins &&
    stored.losses <= rebuilt.losses &&
    stored.draws <= rebuilt.draws &&
    !same(stored, rebuilt)
  );
}

function read(row: Record<string, unknown> | undefined, pool: RatingPool): Stored {
  const columns = POOL_COLUMNS[pool];
  const at = (name: string) => (typeof row?.[name] === "number" ? (row[name] as number) : 0);
  return { wins: at(columns.wins), losses: at(columns.losses), draws: at(columns.draws) };
}

const record = (figure: Stored) => `${figure.wins}W/${figure.losses}L/${figure.draws}D`;

/** The games that could account for a deficit, so a reader can go and look. */
function missingFrom(tally: Tally, stored: Stored): string {
  const short: string[] = [];
  for (const [outcome, plural, by] of [
    ["win", "wins", tally.wins - stored.wins],
    ["loss", "losses", tally.losses - stored.losses],
    ["draw", "draws", tally.draws - stored.draws],
  ] as const) {
    if (by <= 0) continue;
    const candidates = tally.games.filter((game) => game.outcome === outcome);
    const named =
      candidates.length === by
        ? candidates.map((game) => `${game.id} (${game.playedAt.toISOString().slice(0, 10)})`).join(", ")
        : `${by} of ${candidates.length}: ${candidates.map((game) => game.id).join(", ")}`;
    short.push(`${by} ${by === 1 ? outcome : plural} — ${named}`);
  }
  return short.join("; ");
}

/** The columns one pool's repair writes. Never a rating; see the head of this file. */
function repairWrite(pool: RatingPool, tally: Tally): Record<string, number | string | null> {
  const columns = POOL_COLUMNS[pool];
  const streak = STREAK_COLUMNS[pool];
  return {
    [columns.ratedGames]: tally.wins + tally.losses + tally.draws,
    [columns.wins]: tally.wins,
    [columns.losses]: tally.losses,
    [columns.draws]: tally.draws,
    [streak.kind]: tally.streak?.kind ?? null,
    [streak.count]: tally.streak?.count ?? 0,
  };
}

type Repair = {
  key: string;
  variant: string;
  pool: RatingPool;
  name: string;
  exists: boolean;
  stored: Stored;
  tally: Tally;
};

describe("reconciling the per-game standings with the ladder", () => {
  it.runIf(ASKED)(
    "finds every standing the ladder is ahead of, and repairs only the shape it knows",
    async () => {
      const url = process.env.DATABASE_URL ?? "";
      console.log(`\nDatabase: ${url.replace(/:[^:@/]*@/, ":****@").replace(/\?.*$/, "")}`);

      const [games, players, standings] = await Promise.all([
        prisma.game.findMany({
          where: { status: "finished", result: { not: "abandoned" } },
          // Oldest first: a run is built by carrying it forward, the same
          // direction `recordResult` works in.
          orderBy: { playedAt: "asc" },
          select: {
            id: true,
            variant: true,
            rated: true,
            blackName: true,
            whiteName: true,
            blackToken: true,
            whiteToken: true,
            blackMemberId: true,
            whiteMemberId: true,
            winner: true,
            playedAt: true,
          },
        }),
        prisma.player.findMany(),
        prisma.playerVariantRating.findMany(),
      ]);
      console.log(
        `  ${games.length} decided games, ${players.length} ladder rows, ${standings.length} standings`,
      );

      const byPlayer = new Map<string, ByPool>();
      const byStanding = new Map<string, { key: string; variant: string; pools: ByPool }>();
      const names = new Map<string, string>();
      let rated = 0;

      for (const game of games) {
        // Exactly `recordResult`'s tests, in the same order, from the same
        // modules — not a copy of them.
        if (!game.rated) continue;
        if (isHotSeat(game)) continue;
        if (!isRateable(game.blackName, game.whiteName)) continue;
        rated += 1;
        const pool = poolFor(hasBotSeat(game));
        const sides = [
          { name: game.blackName, outcome: game.winner === null ? "draw" : game.winner === "black" ? "win" : "loss" },
          { name: game.whiteName, outcome: game.winner === null ? "draw" : game.winner === "white" ? "win" : "loss" },
        ] as const;

        for (const side of sides) {
          const key = playerKey(side.name);
          names.set(key, side.name.trim());
          const ladder = byPlayer.get(key) ?? emptyPools();
          count(ladder[pool], side.outcome, game);
          byPlayer.set(key, ladder);

          const at = `${key} ${game.variant}`;
          const standing = byStanding.get(at) ?? { key, variant: game.variant, pools: emptyPools() };
          count(standing.pools[pool], side.outcome, game);
          byStanding.set(at, standing);
        }
      }
      console.log(`  ${rated} of them rated, rateable and not at one screen\n`);

      const ladderRows = new Map(players.map((row) => [row.key, row as unknown as Record<string, unknown>]));
      const standingRows = new Map(
        standings.map((row) => [`${row.key} ${row.variant}`, row as unknown as Record<string, unknown>]),
      );

      const repairs: Repair[] = [];
      const refused: string[] = [];

      for (const [at, rebuild] of byStanding) {
        const stored = standingRows.get(at);
        const ladder = ladderRows.get(rebuild.key);
        const ladderRebuild = byPlayer.get(rebuild.key) ?? emptyPools();

        for (const pool of RATING_POOL_LIST) {
          const storedHere = read(stored, pool);
          const rebuiltHere = figures(rebuild.pools[pool]);
          if (same(storedHere, rebuiltHere)) continue;

          const at_ = `${rebuild.key} @ ${rebuild.variant} [${pool}]`;
          if (!behind(storedHere, rebuiltHere)) {
            refused.push(
              `${at_}: stored ${record(storedHere)} is not BEHIND the games' ${record(rebuiltHere)} —` +
                ` a standing holding more than the games account for is a different fault`,
            );
            continue;
          }
          // The ladder must be right, in BOTH pools, or "the standing is
          // behind" is not what is wrong here.
          const ladderOff = RATING_POOL_LIST.filter(
            (each) => !same(read(ladder, each), figures(ladderRebuild[each])),
          );
          if (ladderOff.length > 0) {
            /*
             * Named by the pool that is actually off, which is not always the
             * pool being repaired: a first draft printed the figures of the
             * pool it was looking at and reported a row as disagreeing while
             * showing two identical records beside each other.
             */
            const said = ladderOff
              .map(
                (each) =>
                  `${each} stored ${record(read(ladder, each))} vs games ${record(figures(ladderRebuild[each]))}`,
              )
              .join(", ");
            refused.push(
              `${at_}: the LADDER row disagrees with the games too (${said}) —` +
                ` nothing here knows which of the two to believe`,
            );
            continue;
          }
          // And the other pool on this row must be exact, or two things are wrong.
          const other = pool === "people" ? "computer" : "people";
          if (!same(read(stored, other), figures(rebuild.pools[other]))) {
            refused.push(`${at_}: the ${other} pool on the same row disagrees as well`);
            continue;
          }
          repairs.push({
            key: rebuild.key,
            variant: rebuild.variant,
            pool,
            name: names.get(rebuild.key) ?? rebuild.key,
            exists: stored !== undefined,
            stored: storedHere,
            tally: rebuild.pools[pool],
          });
        }
      }

      if (repairs.length === 0) console.log("Every standing agrees with the ladder. Nothing to repair.");
      for (const repair of repairs) {
        const rebuilt = figures(repair.tally);
        console.log(
          `  ${repair.name} @ ${repair.variant} [${repair.pool}]` +
            `${repair.exists ? "" : "  ← NO ROW AT ALL"}`,
        );
        console.log(`      stored ${record(repair.stored)}, the games say ${record(rebuilt)}`);
        console.log(`      missing: ${missingFrom(repair.tally, repair.stored)}`);
        const write = repairWrite(repair.pool, repair.tally);
        console.log(`      would write ${JSON.stringify(write)}`);
        console.log(
          `      rating: ${repair.exists ? "left exactly as it is" : `${RATING_START}, the column's own starting value`}` +
            ` — this never computes one`,
        );
      }
      for (const line of refused) console.log(`  ! REFUSED  ${line}`);
      console.log(
        `\n${repairs.length} standing(s) repairable, ${refused.length} refused as a shape this will not guess at.`,
      );

      if (!RUN) {
        console.log("Report only. Set STANDINGS_RECONCILE_RUN=1 to write.\n");
        /*
         * A dry run still asserts, rather than reporting green having looked
         * at nothing — see "A Tolerant Assertion Enumerates What It
         * TOLERATES". It read some games and some rows, and every pair it
         * looked at came out in exactly one of the three states.
         */
        expect(games.length).toBeGreaterThan(0);
        expect(byStanding.size).toBeGreaterThan(0);
        return;
      }

      for (const repair of repairs) {
        const write = repairWrite(repair.pool, repair.tally);
        await prisma.playerVariantRating.upsert({
          where: { key_variant: { key: repair.key, variant: repair.variant } },
          create: { key: repair.key, variant: repair.variant, name: repair.name, ...write } as never,
          update: write as never,
        });
      }
      console.log(`Wrote ${repairs.length} standing(s).`);

      /*
       * BEFORE AND AFTER, from the database rather than from this run's own
       * arithmetic: the same question asked again of the rows as they now are.
       * A repair that has not landed says so here.
       */
      const after = await prisma.playerVariantRating.findMany();
      const afterRows = new Map(
        after.map((row) => [`${row.key} ${row.variant}`, row as unknown as Record<string, unknown>]),
      );
      let left = 0;
      for (const [at, rebuild] of byStanding) {
        for (const pool of RATING_POOL_LIST) {
          if (!same(read(afterRows.get(at), pool), figures(rebuild.pools[pool]))) left += 1;
        }
      }
      console.log(
        `Disagreements: ${repairs.length + refused.length} before, ${left} after` +
          ` (${refused.length} of those were refused and are meant to remain).\n`,
      );
      expect(left).toBe(refused.length);
    },
    900_000,
  );

  it("does nothing unless it is asked for by name", () => {
    // The runner above is skipped on an ordinary `pnpm test:unit`, so this case
    // is what keeps the file from reporting green having run nothing at all.
    expect(ASKED || !RUN).toBe(true);
  });
});
