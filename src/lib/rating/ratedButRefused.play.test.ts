/**
 * Finds — and, asked twice, corrects — every finished row whose `rated` column
 * claims a rating that never moved.
 *
 * Twelve of these were found on production by a data audit on 2026-09-11. All
 * twelve were played at one screen; ten of them had two ordinary, different
 * names, so nothing about the row LOOKED wrong, and the pages showed them as
 * counted results. 0.147.2 fixed what the pages SAY (`gameRatingRefusal`, which
 * asks about the seats as well as the names); the rows themselves were left
 * carrying the wrong answer, and this is the other half.
 *
 * The column is not decoration. Everything that trusts it rather than asking
 * the question reads the twelve as rated games: the record's `?rated=yes`
 * filter lists them, `settingsToCarry` hands the flag to a fork or a rematch —
 * which is how one bad row makes another — and the setup screen prefills
 * "Rated" from it. What does NOT read it is worth saying too, because it
 * bounds the damage: the ladder asks `isHotSeat` first and never counted them;
 * `fetchPlayedTallies`, `gameCounts.ts` and the whole XP ledger count games
 * PLAYED and never look at `rated` at all.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FINISHED ROWS ONLY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `ratedButRefused` will not judge an active game, and the reason is in that
 * file: a live board's names are not settled, so a refusal today is a warning
 * rather than a verdict, and writing `rated: false` onto one would decide a
 * game still being played. Eight of the fourteen rows the 2026-09-11 audit
 * turned up were active. Those are left exactly as they are — the board tells
 * their players what it tells them, and whatever they finish as is what the
 * write path will honour.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT WRITES, AND WHAT THAT COSTS A READER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `rated = false` on exactly the rows it lists, by id, and nothing else. The
 * consequence on the page is worth knowing before running it: a corrected row
 * stops showing "This game did not count 同卓 …" and shows the ordinary
 * "Friendly · unrated" badge instead, because `gameRatingRefusal` reads the
 * column first — so the twelve become indistinguishable from every other
 * hot-seat game on the site, which is what they always were. That is the
 * intended end state and not a loss: the reason is a fact about the seats, and
 * a hot-seat game's page says so from the seats whether or not this has run.
 *
 * `updatedAt` moves, being `@updatedAt`. Nothing reads it on a Game — the
 * record sorts by `playedAt`, the XP replay orders by `playedAt` for the
 * reasons `backfillXp.ts` gives — so that is inert.
 *
 * SAFE TO RUN TWICE: the set is computed from the rows each time, and a row it
 * has fixed no longer matches. A second run finds nothing and writes nothing.
 *
 *   RATED_AUDIT=1 npx vitest run src/lib/rating/ratedButRefused.play.test.ts --disable-console-intercept
 *   RATED_AUDIT=1 RATED_AUDIT_RUN=1 npx vitest run … --disable-console-intercept
 *
 * `pnpm rated:audit` is the first of those. There is deliberately no script
 * for the second: a write to a real record is asked for by name, in full, the
 * way `bots:play` and `xp:backfill` are.
 *
 * WHAT IT COSTS. One query for the finished games — six columns, no moves — one
 * count, and one `updateMany` per hundred rows it corrects. Production held 129
 * games when this was written; the development database holds six thousand and
 * it is still one pass.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { ratedButRefused } from "./ratedButRefused";
import { RATING_REFUSALS, RATING_REFUSAL_DISPLAY, type RatingRefusal } from "./rateable.constants";

const ASKED = process.env.RATED_AUDIT === "1";
const RUN = process.env.RATED_AUDIT_RUN === "1";

/** How many rows are named in the report before it starts counting instead. */
const NAMED_AT_MOST = 40;

/** Rows are corrected in batches of this many, by id. */
const BATCH = 100;

describe("auditing the rated column", () => {
  it.runIf(ASKED)(
    "lists every finished row whose rated column claims a rating that never moved",
    async () => {
      /*
       * The host FIRST, before a single row is read, and the totals before any
       * verdict. Production and a development database are not close in size,
       * so one line settles which one this reached — `.env` has silently
       * overridden an inline DATABASE_URL in this project before.
       */
      const url = process.env.DATABASE_URL ?? "";
      console.log(`Database: ${url.replace(/:[^:@/]*@/, ":****@").replace(/\?.*$/, "")}`);

      const [all, games] = await Promise.all([
        prisma.game.count(),
        prisma.game.findMany({
          where: { status: "finished" },
          orderBy: { playedAt: "asc" },
          select: {
            id: true,
            variant: true,
            result: true,
            playedAt: true,
            rated: true,
            status: true,
            blackToken: true,
            whiteToken: true,
            blackName: true,
            whiteName: true,
            blackMemberId: true,
            whiteMemberId: true,
          },
        }),
      ]);

      const ratedRows = games.filter((game) => game.rated);
      console.log(`  ${all} games in all, ${games.length} finished, ${ratedRows.length} of those stamped rated`);

      const found: { id: string; refusal: RatingRefusal; line: string }[] = [];
      const byReason = new Map<RatingRefusal, number>();
      for (const game of games) {
        const refusal = ratedButRefused(game);
        if (refusal === null) continue;
        byReason.set(refusal, (byReason.get(refusal) ?? 0) + 1);
        found.push({
          id: game.id,
          refusal,
          line:
            `${game.id} ${game.variant} ${game.playedAt.toISOString().slice(0, 10)}` +
            ` ${game.result} — ${refusal} —` +
            ` black ${JSON.stringify(game.blackName)}${game.blackMemberId === null ? "" : " (member)"}` +
            ` vs white ${JSON.stringify(game.whiteName)}${game.whiteMemberId === null ? "" : " (member)"}`,
        });
      }

      console.log(`  ${found.length} of them could never have moved a rating:`);
      for (const reason of Object.values(RATING_REFUSALS)) {
        const many = byReason.get(reason) ?? 0;
        if (many > 0) console.log(`    ${many} × ${reason} — ${RATING_REFUSAL_DISPLAY[reason].filed}`);
      }
      for (const row of found.slice(0, NAMED_AT_MOST)) console.log(`    ! ${row.line}`);
      if (found.length > NAMED_AT_MOST) {
        console.log(`    … and ${found.length - NAMED_AT_MOST} more, not named here`);
      }

      /*
       * ASSERTED RATHER THAN REPORTED, so a dry run is a statement about the
       * database it reached instead of a green tick over a console log.
       *
       * A TOLERANT ASSERTION ENUMERATES WHAT IT TOLERATES: the count of rows
       * is not one of these, because zero is the correct answer on a database
       * that has already been corrected — and asserting a number would make
       * the second, idempotent run the failing one.
       */
      expect(games.length).toBeGreaterThan(0);
      const byId = new Map(games.map((game) => [game.id, game]));
      for (const row of found) {
        // Nothing is listed that the audit may not judge, and nothing is
        // listed whose reason the report cannot word.
        const game = byId.get(row.id);
        expect(game?.status, row.line).toBe("finished");
        expect(game?.rated, row.line).toBe(true);
        expect(RATING_REFUSAL_DISPLAY[row.refusal].sentence.length, row.line).toBeGreaterThan(20);
      }
      /*
       * IDEMPOTENCE, PROVEN ON THE REAL ROWS rather than promised in the prose
       * above: the write applied in memory, the predicate asked again, and
       * nothing left to do. A runner whose second pass would find its own work
       * again is one nobody can run twice safely, and this is the cheapest
       * possible proof that this one is not.
       */
      const listed = new Set(found.map((row) => row.id));
      const corrected = games.map((game) => (listed.has(game.id) ? { ...game, rated: false } : game));
      expect(corrected.filter((game) => ratedButRefused(game) !== null)).toEqual([]);

      if (!RUN) {
        console.log("Report only. Set RATED_AUDIT_RUN=1 to write rated = false on exactly the rows above.");
        return;
      }

      let written = 0;
      for (let at = 0; at < found.length; at += BATCH) {
        const ids = found.slice(at, at + BATCH).map((row) => row.id);
        const done = await prisma.game.updateMany({ where: { id: { in: ids } }, data: { rated: false } });
        written += done.count;
      }
      console.log(`Wrote rated = false on ${written} rows.`);

      /*
       * READ BACK. The write is the whole point of the run, so it is checked
       * against the database rather than against the count the driver
       * returned — and a re-read is also the second run, which must find
       * nothing.
       */
      const again = await prisma.game.findMany({
        where: { status: "finished" },
        select: {
          rated: true,
          status: true,
          blackToken: true,
          whiteToken: true,
          blackName: true,
          whiteName: true,
        },
      });
      const left = again.filter((game) => ratedButRefused(game) !== null);
      console.log(`  ${left.length} left to correct on a second pass (expected 0).`);
      expect(left).toEqual([]);
    },
    900_000,
  );

  it("does nothing unless it is asked for by name", () => {
    // The runner above is skipped on an ordinary `pnpm test:unit`, so this case
    // is what keeps the file from reporting green having run nothing at all —
    // see A Tolerant Assertion Enumerates What It TOLERATES.
    expect(ASKED || !RUN).toBe(true);
  });
});
