/**
 * Fills in the streak columns from the games, once.
 *
 * `20260911160000_a_record_keeps_its_streak` adds the three rated runs on
 * `Player` and `PlayerVariantRating`, and
 * `20260912010000_a_member_keeps_the_run_over_every_game` adds the fourth on
 * `Member`. All of them start empty, which is honest — null means nobody has
 * finished a game and the tables print an em dash for it. But every record that
 * already exists was earned before the columns did, so without this every row
 * on the site shows a dash until its player happens to play again. This reads
 * the games and says what the run WAS.
 *
 * A ONE-OFF, AND THE ONLY THING HERE THAT READS GAMES TO WORK OUT A STREAK.
 * From now on `recordResult` carries it forward — it already has the row in
 * hand when it writes, so a streak costs no query at all. That is the whole
 * design, and this is its one exception: it runs once against a database whose
 * columns have never been filled, and never again.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT ONLY WRITES A ROW IT CAN RECONSTRUCT EXACTLY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A stored streak sits beside stored wins and losses. If the two are about
 * different sets of games the row contradicts itself in a way a reader can
 * see — the ladder showed "99 played … W100" on the first run of this, which
 * is worse than the dash it replaced.
 *
 * The set `recordResult` counts is narrower than "finished and rated" in ways
 * the game row cannot fully report:
 *
 *   - a HOT-SEAT game is filed and never rated (`isHotSeat`);
 *   - an ANONYMOUS seat, or one name in both seats, or a name reserved for
 *     somebody remembered here, is refused by `isRateable`;
 *   - and a game FILED FROM ONE BROWSER through `recordGame` was stored with
 *     `rated` at its column default of true, and no rating ever moved. Nothing
 *     on the row distinguishes it from a shared game that was rated. That is a
 *     question the Game table cannot answer.
 *
 * **THE STORED `rated` FLAG IS NOT TRUSTED**, and `isHotSeat` is not enough on
 * its own. Read read-only from production on 2026-09-11: fourteen rows are
 * stamped rated that no rating ever moved — eight active, six finished. Twelve
 * of them are hot-seat. The other two are not, and one of those is a FINISHED
 * `John Morris` versus `John Morris` with two different seat tokens, which only
 * `ratingRefusal`'s one-player check catches. The write path was fixed for new
 * games in 0.145.2; these rows remain. So every test the write side applies is
 * asked here, from the same modules, and the reconciliation below is what
 * catches whatever those tests still cannot see.
 *
 * So this does not guess. It rebuilds each record's wins, losses and draws
 * alongside the run, and **writes only where the rebuilt record matches the
 * one already stored**. Where it does not match, the row keeps its null — the
 * honest "nothing said" — and the run is reported as unreconstructable rather
 * than written anyway. Silence is the safe answer; a plausible number is the
 * dangerous one.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE FOURTH RUN IS CHECKED AGAINST THE NUMBER THE PAGE PRINTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `Member.playedStreak` is over EVERY decided game, rated or not, and there is
 * no stored record beside it to reconcile with: PLAYED is not a column, it is
 * counted from the games on every render by `fetchPlayedTallies`. So that
 * function is what this reconciles against — imported, never restated — and a
 * member's run is written only where the rebuild reproduces its tally exactly.
 * A disagreement of one game is precisely the fault this scope exists to fix,
 * so a member who disagrees keeps the dash and is named in the report, and a
 * dry run FAILS on even one of them rather than mentioning it in passing.
 *
 * That half needs no `rated`, `isHotSeat` or `isRateable` test — it uses
 * `playedSides` from `playedRun.ts`, which is the live path's own definition —
 * and it is the only half that can speak for a member who has never played a
 * rated game and therefore has no `Player` row at all.
 *
 * The rules themselves are IMPORTED rather than restated. A first draft was a
 * plain `scripts/*.ts`, which cannot resolve `@/`, so it copied the folding
 * and the pool test by hand and disagreed with the stored tallies on the first
 * row it was checked against.
 *
 * It is a vitest file for exactly the reason `botSeries.play.test.ts` is, and
 * AGENTS.md says so: a plain node script cannot resolve the app's own paths.
 * It does nothing unless asked, and writes nothing unless asked twice.
 *
 *   BACKFILL_STREAKS=1 npx vitest run src/lib/rating/backfillStreaks.play.test.ts --disable-console-intercept
 *   BACKFILL_STREAKS=1 BACKFILL_STREAKS_RUN=1 npx vitest run … --disable-console-intercept
 *
 * WHAT IT COSTS. One query for every DECIDED game ordered by when it was
 * played, no moves loaded; one each for the player rows, the standings and the
 * members, to check the rebuild against; one more inside `fetchPlayedTallies`,
 * which reads the same games its own way on purpose; then one small update per
 * row that reconciles. Production on 2026-09-11 held 129 games, 116 of them
 * decided, 45 of those rated, with 9 player rows, 25 standings and 11 members
 * — a few hundred kilobytes read and at most fifty small writes, which is the
 * cheapest work Neon does. The development database has thousands of games and
 * it is still one pass.
 *
 * SAFE TO RUN TWICE: the answer is read from the games each time, so a second
 * run writes what the first one wrote. It is not an append.
 */
import { describe, expect, it } from "vitest";

import { hasBotSeat } from "@/lib/bots/bots";
import { isHotSeat } from "@/lib/history/liveGame";
import { fetchPlayedTallies } from "@/lib/history/playerRecord";
import { isRateable } from "./rateable";
import { playedSides } from "./playedRun";
import { playerKey } from "./playerKey";
import { poolFor, type RatingPool } from "./pools";
import { prisma } from "@/lib/prisma";
import { STREAK_COLUMNS, extendStreak, type Streak, type StreakOutcome } from "./streak";

const ASKED = process.env.BACKFILL_STREAKS === "1";
const RUN = process.env.BACKFILL_STREAKS_RUN === "1";

/** What one pool's rebuild came to: the run, and the record that made it. */
type Rebuilt = { streak: Streak | null; wins: number; losses: number; draws: number };

const nothing = (): Rebuilt => ({ streak: null, wins: 0, losses: 0, draws: 0 });

/** The three scopes a Player row keeps; a standing keeps the first two. */
type Scopes = "people" | "computer" | "all" | "played";
type Rebuild = Record<Scopes, Rebuilt>;

const noRebuild = (): Rebuild => ({
  people: nothing(),
  computer: nothing(),
  all: nothing(),
  played: nothing(),
});

function add(into: Rebuilt, outcome: StreakOutcome): void {
  into.streak = extendStreak(into.streak, outcome);
  if (outcome === "win") into.wins += 1;
  else if (outcome === "loss") into.losses += 1;
  else into.draws += 1;
}

function sameRecord(rebuilt: Rebuilt, stored: { wins: number; losses: number; draws: number }): boolean {
  return (
    rebuilt.wins === stored.wins && rebuilt.losses === stored.losses && rebuilt.draws === stored.draws
  );
}

/** One scope's two columns, from a rebuild that has been checked. */
function columnsFor(rebuilt: Rebuilt, scope: Scopes): Record<string, string | number | null> {
  const columns = STREAK_COLUMNS[scope];
  return { [columns.kind]: rebuilt.streak?.kind ?? null, [columns.count]: rebuilt.streak?.count ?? 0 };
}

describe("backfilling the streak columns", () => {
  it.runIf(ASKED)(
    "writes the run each record was on, and only where it can rebuild that record exactly",
    async () => {
      const [games, players, standings, members] = await Promise.all([
        prisma.game.findMany({
          /*
           * EVERY DECIDED GAME, not only the rated ones — one query still, and
           * the rated half is filtered in the loop below. `Member.playedStreak`
           * is over every finished game whether or not anything rated it, so a
           * `rated: true` filter here would have made the member rebuild a
           * rated run wearing a different name.
           */
          where: { status: "finished", result: { not: "abandoned" } },
          /*
           * OLDEST FIRST, because a run is built by carrying it forward — the
           * same direction `recordResult` works in, so the two cannot arrive
           * at different answers. `streak.test.ts` pins that equivalence.
           */
          orderBy: { playedAt: "asc" },
          select: {
            /* `playedSides` takes a DecidedGame, which carries the id since
               0.159.0 so the XP ledger can key a game's awards on it. The
               backfill never awards XP — it rebuilds runs from history and
               nothing more — but it is handed the same rows, so it reads the
               same columns. */
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
          },
        }),
        prisma.player.findMany({
          select: {
            key: true,
            wins: true,
            losses: true,
            draws: true,
            computerWins: true,
            computerLosses: true,
            computerDraws: true,
          },
        }),
        prisma.playerVariantRating.findMany({
          select: {
            key: true,
            variant: true,
            wins: true,
            losses: true,
            draws: true,
            computerWins: true,
            computerLosses: true,
            computerDraws: true,
          },
        }),
        // Every member, because the fourth run is keyed by id rather than by a
        // folded name, and a member who has only ever played friendly games has
        // no Player row for a name-keyed pass to find.
        prisma.member.findMany({ select: { id: true, name: true } }),
      ]);

      const byPlayer = new Map<string, Rebuild>();
      /*
       * The per-game rebuilds keep their two halves on the VALUE rather than
       * joined into the key. A folded name has spaces in it — "john morris" —
       * so a composite key would have to be taken apart again on a separator a
       * name cannot contain, and there is not one.
       */
      const byStanding = new Map<string, { key: string; variant: string; rebuild: Rebuild }>();
      /** The fourth run, keyed by member id — see `playedRun.ts`. */
      const byMember = new Map<string, Rebuild>();

      let counted = 0;
      for (const game of games) {
        /*
         * THE MEMBER HALF FIRST, AND BEFORE EVERY TEST BELOW IT. A run over
         * every game played asks nothing about rating, hot seat or rateable
         * names — `playedSides` is the whole definition and it is imported from
         * the module the live path uses, so this cannot drift from it. Note it
         * runs on a hot-seat game and on a friendly, which is the point.
         */
        for (const side of playedSides(game)) {
          const rebuild = byMember.get(side.memberId) ?? noRebuild();
          add(rebuild.played, side.outcome);
          byMember.set(side.memberId, rebuild);
        }

        // And now the rated half. Exactly `liveGame.ts`'s three tests, in the
        // same order, from the same modules — not a copy of them.
        if (!game.rated) continue;
        if (isHotSeat(game)) continue;
        if (!isRateable(game.blackName, game.whiteName)) continue;
        counted += 1;

        // `hasBotSeat` and nothing resembling it: the pool is decided by the
        // seats, and this must be the answer the writer was given. A first
        // draft tested the NAMES as well, which is one more way to disagree
        // with the row it is supposed to be reconstructing.
        const pool: RatingPool = poolFor(hasBotSeat(game));
        const sides: [string, StreakOutcome][] = [
          [playerKey(game.blackName), game.winner === null ? "draw" : game.winner === "black" ? "win" : "loss"],
          [playerKey(game.whiteName), game.winner === null ? "draw" : game.winner === "white" ? "win" : "loss"],
        ];

        for (const [key, outcome] of sides) {
          const rebuild = byPlayer.get(key) ?? noRebuild();
          add(rebuild[pool], outcome);
          // The both-pools run moves on every rated game, whichever pool
          // scored it — it is what the members list and a member's own
          // headline are counting.
          add(rebuild.all, outcome);
          byPlayer.set(key, rebuild);

          const at = `${key} ${game.variant}`;
          const perGame = byStanding.get(at) ?? { key, variant: game.variant, rebuild: noRebuild() };
          add(perGame.rebuild[pool], outcome);
          byStanding.set(at, perGame);
        }
      }

      const url = process.env.DATABASE_URL ?? "";
      console.log(`Database: ${url.replace(/:[^:@/]*@/, ":****@").replace(/\?.*$/, "")}`);
      console.log(`  ${games.length} decided games, ${counted} of them rated and rateable`);

      /*
       * A rebuild is only believed where it reproduces the record already
       * stored — BOTH pools, since one game moves one of them and the row
       * carries both. A row that does not reconcile keeps its null.
       */
      const storedFor = (row: {
        wins: number;
        losses: number;
        draws: number;
        computerWins: number;
        computerLosses: number;
        computerDraws: number;
      }) => ({
        people: { wins: row.wins, losses: row.losses, draws: row.draws },
        computer: { wins: row.computerWins, losses: row.computerLosses, draws: row.computerDraws },
        all: {
          wins: row.wins + row.computerWins,
          losses: row.losses + row.computerLosses,
          draws: row.draws + row.computerDraws,
        },
      });

      const playerWrites: { key: string; rebuild: Rebuild }[] = [];
      let playersSkipped = 0;
      for (const row of players) {
        const rebuild = byPlayer.get(row.key);
        const stored = storedFor(row);
        const rebuilt = rebuild ?? noRebuild();
        const agrees =
          sameRecord(rebuilt.people, stored.people) &&
          sameRecord(rebuilt.computer, stored.computer) &&
          sameRecord(rebuilt.all, stored.all);
        if (!agrees) {
          playersSkipped += 1;
          continue;
        }
        // A row with nothing to say is left alone rather than written as null:
        // a no-op write is still a write, and there are thousands of them.
        if (rebuilt.all.streak !== null) playerWrites.push({ key: row.key, rebuild: rebuilt });
      }

      const standingWrites: { key: string; variant: string; rebuild: Rebuild }[] = [];
      let standingsSkipped = 0;
      /*
       * Named rather than merely counted. A row that cannot be rebuilt keeps
       * its dash for good, so whoever runs this needs to be able to go and
       * look at why — a count alone is a number nobody can act on.
       */
      const unreconciled: string[] = [];
      for (const row of standings) {
        const rebuild = byStanding.get(`${row.key} ${row.variant}`)?.rebuild ?? noRebuild();
        const stored = storedFor(row);
        if (!sameRecord(rebuild.people, stored.people) || !sameRecord(rebuild.computer, stored.computer)) {
          standingsSkipped += 1;
          if (unreconciled.length < 20) {
            unreconciled.push(
              `${row.key} @ ${row.variant}: stored ${stored.people.wins}/${stored.people.losses}/${stored.people.draws}` +
                ` + ${stored.computer.wins}/${stored.computer.losses}/${stored.computer.draws},` +
                ` rebuilt ${rebuild.people.wins}/${rebuild.people.losses}/${rebuild.people.draws}` +
                ` + ${rebuild.computer.wins}/${rebuild.computer.losses}/${rebuild.computer.draws}`,
            );
          }
          continue;
        }
        if (rebuild.people.streak !== null || rebuild.computer.streak !== null) {
          standingWrites.push({ key: row.key, variant: row.variant, rebuild });
        }
      }

      /*
       * THE MEMBER HALF RECONCILES AGAINST THE NUMBER THE PAGE PRINTS.
       *
       * The rated rows above are checked against the tallies stored beside
       * them; a member's row has no stored record to check against, because
       * PLAYED is not stored anywhere — it is counted from the games by
       * `fetchPlayedTallies` on every render. So that function IS the
       * reconciliation, imported rather than restated: the rebuild is believed
       * only where it reproduces, exactly, the record the members list will
       * print this run beside. A disagreement of one game is the whole fault
       * this scope was added to avoid, so a row that disagrees keeps its dash
       * and is named.
       */
      const played = await fetchPlayedTallies(members.map((one) => one.id));
      const memberWrites: { id: string; rebuild: Rebuild }[] = [];
      let membersSkipped = 0;
      for (const member of members) {
        const rebuilt = byMember.get(member.id) ?? noRebuild();
        const tally = played.get(member.id) ?? { wins: 0, losses: 0, draws: 0 };
        if (!sameRecord(rebuilt.played, tally)) {
          membersSkipped += 1;
          if (unreconciled.length < 40) {
            unreconciled.push(
              `${member.name || member.id} (member): PLAYED says` +
                ` ${tally.wins}/${tally.losses}/${tally.draws}, rebuilt` +
                ` ${rebuilt.played.wins}/${rebuilt.played.losses}/${rebuilt.played.draws}`,
            );
          }
          continue;
        }
        // Nothing to say is left alone rather than written as null — the same
        // rule the rated rows follow, for the same reason.
        if (rebuilt.played.streak !== null) memberWrites.push({ id: member.id, rebuild: rebuilt });
      }

      console.log(
        `  ${playerWrites.length} of ${players.length} player rows reconcile` +
          ` (${playersSkipped} could not be rebuilt and keep their dash)`,
      );
      console.log(
        `  ${standingWrites.length} of ${standings.length} standings reconcile` +
          ` (${standingsSkipped} could not be rebuilt and keep their dash)`,
      );
      console.log(
        `  ${memberWrites.length} of ${members.length} members' played runs reconcile` +
          ` with what fetchPlayedTallies counts (${membersSkipped} could not and keep their dash)`,
      );
      for (const line of unreconciled) console.log(`    ! ${line}`);

      if (!RUN) {
        console.log("Report only. Set BACKFILL_STREAKS_RUN=1 to write.");
        /*
         * A dry run still proves it can RECONCILE, which is the half that can
         * be wrong — and it asserts, rather than reporting green having looked
         * at nothing.
         *
         * MOST ROWS MUST RECONCILE. If the rebuild disagrees with the writer
         * on a large share of them, the rebuild is wrong and nothing it
         * produces should be written — so that is a failure here rather than a
         * line in a report somebody skims. The bar is deliberately generous,
         * because a development database is full of rows whose tallies were
         * seeded rather than played; on production, where every rated row got
         * there through `recordResult`, it should be all of them.
         */
        expect(players.length).toBeGreaterThan(0);
        expect(playersSkipped / players.length).toBeLessThan(0.5);
        /*
         * AND EVERY MEMBER MUST RECONCILE, with no allowance at all.
         *
         * The rated rows get a generous bar because their stored tallies may
         * have been seeded rather than played, and a development database is
         * full of those. This half has nothing seeded in it: both sides are
         * read from the games table on this run, by the same definition, so a
         * single disagreement means the two definitions have drifted — which
         * is exactly the failure a streak beside a count must never have.
         */
        expect(members.length).toBeGreaterThan(0);
        expect(membersSkipped).toBe(0);
        return;
      }

      for (const { key, rebuild } of playerWrites) {
        await prisma.player.update({
          where: { key },
          data: {
            ...columnsFor(rebuild.people, "people"),
            ...columnsFor(rebuild.computer, "computer"),
            ...columnsFor(rebuild.all, "all"),
          } as never,
        });
      }
      for (const { key, variant, rebuild } of standingWrites) {
        await prisma.playerVariantRating.update({
          where: { key_variant: { key, variant } },
          data: {
            ...columnsFor(rebuild.people, "people"),
            ...columnsFor(rebuild.computer, "computer"),
          } as never,
        });
      }
      for (const { id, rebuild } of memberWrites) {
        await prisma.member.update({
          where: { id },
          data: columnsFor(rebuild.played, "played") as never,
        });
      }
      console.log(
        `Wrote ${playerWrites.length} player rows, ${standingWrites.length} standings` +
          ` and ${memberWrites.length} members' played runs.`,
      );
    },
    900_000,
  );

  it("does nothing unless it is asked for by name", () => {
    // The runner above is skipped on an ordinary `pnpm test:unit`, so this
    // case is what keeps the file from reporting green having run nothing at
    // all — see A Tolerant Assertion Enumerates What It TOLERATES.
    expect(ASKED || !RUN).toBe(true);
  });
});
