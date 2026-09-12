/**
 * Proves the fourth run is REACHED on an UNRATED game, not merely present.
 *
 * `playedRun.test.ts` proves the rule and the cost against a mocked client.
 * Neither it nor any other unit test can tell you whether the four endings in
 * `liveGame.ts` and `liveGameEndings.ts` actually call `recordPlayed` — they
 * import the modules, and a call site that was never wired reads identically.
 * AGENTS.md spends a section on exactly that distinction, and the whole point
 * of this scope is the games `recordResult` is NOT called for: an all-games run
 * maintained only on rated games is a rated run wearing a different name, and
 * it would pass every other test in this directory.
 *
 * So this plays one real FRIENDLY game — `rated: false` — through the same
 * function that answers a real move request, and then asks three things:
 *
 *   - both members' stored run moved, by the result each of them got;
 *   - `fetchPlayedTallies` counts exactly the games that run counts;
 *   - THE FOUR STORED COUNTS SAY THE SAME THING AS `fetchPlayedTallies`, on the
 *     same rows, after the same games. `Member.played`, `.won`, `.lost` and
 *     `.drawn` are what the members directory now SORTS and PAGES by, so a
 *     column that drifted from the function would put a member in the wrong
 *     place in an order and show the right number in the cell — the one failure
 *     shape that cannot be seen by looking at the row. They are written in the
 *     same update as the run, at the same four endings, which is why this file
 *     is where they are checked rather than a second runner beside it;
 *   - and NO rating row was written, which is what makes the game unrated
 *     rather than merely labelled so. That is the assertion that fails if
 *     somebody ever "tidies" this call inside the `row.rated` test.
 *
 * IT BRINGS ITS OWN WORLD and takes it away again: two members nobody else has
 * ever heard of, one game between them, and a `finally` that deletes all three.
 * A run asserted about a row this file did not create would be a test about
 * this machine's history — the rule AGENTS.md states twice.
 *
 *   PLAYED_RUN_CHECK=1 npx vitest run src/lib/rating/playedRun.play.test.ts --disable-console-intercept
 *
 * It writes to whatever `DATABASE_URL` points at, so it does nothing unless it
 * is asked for by name. It is a `.play.test.ts` for the reason the others are:
 * a plain script cannot resolve this app's own `@/` paths.
 */
import { afterAll, describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, STONES } from "@/lib/gomoku/gomoku.constants";
import { appendMove, createLiveGame } from "@/lib/history/liveGame";
import { fetchPlayedTallies } from "@/lib/history/playerRecord";
import { prisma } from "@/lib/prisma";
import { playerKey } from "./playerKey";
import { streakIn } from "./streak";

const ASKED = process.env.PLAYED_RUN_CHECK === "1";

/** A name and an id nothing else on any database will collide with. */
function fresh(what: string): { id: string; name: string } {
  const tag = Math.random().toString(36).slice(2, 10);
  return { id: `played-run-${what}-${tag}`, name: `PlayedRun ${what} ${tag}` };
}

/**
 * The four stored counts, and what `fetchPlayedTallies` makes of the same
 * games — asked of the real column and the real function rather than reasoned
 * about.
 *
 * Returned together so that every assertion below compares them in one
 * `toEqual`: two separate expectations would let one of them be quietly
 * dropped, and the whole claim here is that the pair agree.
 */
async function tallyAndColumns(ids: string[]) {
  const tallies = await fetchPlayedTallies(ids);
  const rows = await prisma.member.findMany({
    where: { id: { in: ids } },
    select: { id: true, played: true, won: true, lost: true, drawn: true },
  });
  const columns = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => {
    const tally = tallies.get(id) ?? { wins: 0, losses: 0, draws: 0 };
    const column = columns.get(id);
    return {
      id,
      counted: { ...tally, played: tally.wins + tally.losses + tally.draws },
      stored: {
        wins: column?.won ?? -1,
        losses: column?.lost ?? -1,
        draws: column?.drawn ?? -1,
        played: column?.played ?? -1,
      },
    };
  });
}

const black = fresh("black");
const white = fresh("white");
const made: { games: string[] } = { games: [] };

afterAll(async () => {
  if (!ASKED) return;
  // Everything this file made, and nothing else. The moves go with the game.
  for (const id of made.games) {
    await prisma.move.deleteMany({ where: { gameId: id } });
    await prisma.game.deleteMany({ where: { id } });
  }
  await prisma.player.deleteMany({ where: { key: { in: [playerKey(black.name), playerKey(white.name)] } } });
  await prisma.member.deleteMany({ where: { id: { in: [black.id, white.id] } } });
});

describe("a friendly game moves the run over every game played", () => {
  it.runIf(ASKED)(
    "carries both seats' run forward, agrees with the played count, and writes no rating",
    async () => {
      for (const who of [black, white]) {
        await prisma.member.create({ data: { id: who.id, email: `${who.id}@example.invalid`, name: who.name } });
      }

      const game = await createLiveGame({
        variant: "freestyle",
        size: 15,
        winLength: 5,
        opener: STONES.black,
        blackName: black.name,
        whiteName: white.name,
        blackMemberId: black.id,
        whiteMemberId: white.id,
        obstacles: DEFAULT_SETTINGS.obstacles,
        opening: DEFAULT_SETTINGS.opening,
        handicap: DEFAULT_SETTINGS.handicap,
        drawLimit: DEFAULT_SETTINGS.drawLimit,
        // No clock: nobody is waiting, and a deadline would end this on time
        // rather than on the board.
        moveTimeMs: null,
        open: false,
        /*
         * THE WHOLE POINT OF THE FILE. `recordResult` is never called for this
         * game, so if the run moves it is because `recordPlayed` moved it.
         */
        rated: false,
        timeoutPenalty: "turn",
        allowResign: true,
      });
      made.games.push(game.id);

      // Black takes a row of five; white answers along the top edge and never
      // blocks. The ninth stone wins, which is the ending a real game has.
      for (let step = 0; step < 5; step += 1) {
        const played = await appendMove(game.id, game.blackToken, { kind: "place", row: 7, col: step });
        expect(played.ok, `black's move ${step + 1} was refused`).toBe(true);
        if (step === 4) break;
        const answered = await appendMove(game.id, game.whiteToken, { kind: "place", row: 0, col: step });
        expect(answered.ok, `white's move ${step + 1} was refused`).toBe(true);
      }

      const finished = await prisma.game.findUnique({
        where: { id: game.id },
        select: { status: true, result: true, winner: true, rated: true },
      });
      expect(finished).toMatchObject({ status: "finished", winner: "black", rated: false });

      const rows = await prisma.member.findMany({
        where: { id: { in: [black.id, white.id] } },
        select: { id: true, playedStreakKind: true, playedStreakCount: true },
      });
      const runs = new Map(rows.map((row) => [row.id, streakIn(row as unknown as Record<string, unknown>, "played")]));
      expect(runs.get(black.id)).toEqual({ kind: "win", count: 1 });
      expect(runs.get(white.id)).toEqual({ kind: "loss", count: 1 });

      // And the run counts the games the column beside it counts — asked of the
      // real function, on a real row, rather than reasoned about.
      const tallies = await fetchPlayedTallies([black.id, white.id]);
      expect(tallies.get(black.id)).toEqual({ wins: 1, losses: 0, draws: 0 });
      expect(tallies.get(white.id)).toEqual({ wins: 0, losses: 1, draws: 0 });

      /*
       * AND THE STORED COLUMNS SAY THE SAME. This is the pair the directory
       * depends on: the cell is drawn from the column and the ORDER is decided
       * by it, so the two have to be one set of games. Compared as whole
       * objects, and the counted half is asserted against a written-out figure
       * as well — otherwise a bug that zeroed both halves would pass.
       */
      const pair = await tallyAndColumns([black.id, white.id]);
      for (const row of pair) expect(row.stored, `${row.id}'s columns`).toEqual(row.counted);
      expect(pair[0].stored).toEqual({ wins: 1, losses: 0, draws: 0, played: 1 });
      expect(pair[1].stored).toEqual({ wins: 0, losses: 1, draws: 0, played: 1 });

      /*
       * NOTHING WAS RATED. If this ever finds a Player row, the game was rated
       * after all and the run above proves nothing about a friendly — which is
       * the only failure this file exists to catch.
       */
      const rated = await prisma.player.findMany({
        where: { key: { in: [playerKey(black.name), playerKey(white.name)] } },
      });
      expect(rated).toEqual([]);
    },
    120_000,
  );

  it.runIf(ASKED)(
    "carries it forward on a resignation too, which is the other module's wiring",
    async () => {
      /*
       * A SECOND ENDING, because there are four of them in two files and a call
       * wired into one says nothing about the other three. This is the cheapest
       * of the remaining three to drive and it lives in `liveGameEndings.ts`, so
       * it covers the file the case above does not touch. It runs after that
       * one, so the runs move from 1 to 2 rather than starting again — which
       * also proves the carry-forward rather than a fresh write.
       */
      const { resignGame } = await import("@/lib/history/liveGameEndings");
      const game = await createLiveGame({
        variant: "freestyle",
        size: 15,
        winLength: 5,
        opener: STONES.black,
        blackName: black.name,
        whiteName: white.name,
        blackMemberId: black.id,
        whiteMemberId: white.id,
        obstacles: DEFAULT_SETTINGS.obstacles,
        opening: DEFAULT_SETTINGS.opening,
        handicap: DEFAULT_SETTINGS.handicap,
        drawLimit: DEFAULT_SETTINGS.drawLimit,
        moveTimeMs: null,
        open: false,
        rated: false,
        timeoutPenalty: "turn",
        allowResign: true,
      });
      made.games.push(game.id);

      const given = await resignGame(game.id, game.whiteToken);
      expect(given.ok).toBe(true);

      const rows = await prisma.member.findMany({
        where: { id: { in: [black.id, white.id] } },
        select: { id: true, playedStreakKind: true, playedStreakCount: true },
      });
      const runs = new Map(rows.map((row) => [row.id, streakIn(row as unknown as Record<string, unknown>, "played")]));
      expect(runs.get(black.id)).toEqual({ kind: "win", count: 2 });
      expect(runs.get(white.id)).toEqual({ kind: "loss", count: 2 });

      const tallies = await fetchPlayedTallies([black.id, white.id]);
      expect(tallies.get(black.id)).toEqual({ wins: 2, losses: 0, draws: 0 });
      expect(tallies.get(white.id)).toEqual({ wins: 0, losses: 2, draws: 0 });

      // The columns again, and from TWO rather than from one: an increment that
      // only ever fired on the first game of a member's life would have passed
      // the case above and would put every established player in the wrong
      // place in every order the directory offers.
      const pair = await tallyAndColumns([black.id, white.id]);
      for (const row of pair) expect(row.stored, `${row.id}'s columns`).toEqual(row.counted);
      expect(pair[0].stored).toEqual({ wins: 2, losses: 0, draws: 0, played: 2 });
      expect(pair[1].stored).toEqual({ wins: 0, losses: 2, draws: 0, played: 2 });
    },
    120_000,
  );

  it("does nothing unless it is asked for by name", () => {
    // The case above is skipped on an ordinary `pnpm test:unit`, so this is
    // what keeps the file from reporting green having run nothing at all.
    expect(ASKED || made.games.length === 0).toBe(true);
  });
});
