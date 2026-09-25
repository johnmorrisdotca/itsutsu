import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { checkOutOfGuesses, checkSolution } from "@/lib/puzzles/puzzleCheck";
import { dropRun } from "@/lib/puzzles/server/puzzleRuns";
import { keepSolve } from "@/lib/puzzles/server/puzzleSolves";
import { PUZZLE_CODE_LONGEST, PUZZLE_KIND_LIST, PUZZLE_LEVEL_LIST, PUZZLE_SPECS, isCheckAllowance } from "@/lib/puzzles/puzzles.constants";
import { awardXp } from "@/lib/xp/awardXp";
import { puzzleAwards } from "@/lib/xp/xpPuzzle";
import { awardTourBonuses } from "@/lib/xp/xpTour";

/**
 * A finished puzzle, handed in once.
 *
 * THE ONE THING THE SERVER DOES FOR A PUZZLE. Generation, the uniqueness
 * check, the rating and the timer all ran in the browser (John: "should cost
 * me nothing, no server calculations"); what arrives here is a grid, and the
 * whole of the server's work is `checkSolution` — O(cells), no search — and
 * the ledger writes `awardXp` makes for a finished game. A member is paid
 * for a grid that is RIGHT, never for one that was posted: 422 says which
 * rule the grid breaks, in words, and pays nothing.
 *
 * Trust, said plainly: the browser that made the puzzle held its answer,
 * and a member who reads it out of the page has cheated themselves of a
 * puzzle for twenty-five XP under a six-a-day cap — the same trust the site
 * already places in a browser that plays a computer's move. What the server
 * refuses is a grid that is not a solution, a puzzle that is not one this
 * site makes, a stranger, and the same grid twice (the ledger's unique index).
 */
const bodySchema = z.object({
  kind: z.enum(PUZZLE_KIND_LIST as [string, ...string[]]),
  size: z.number().int(),
  level: z.enum(PUZZLE_LEVEL_LIST as [string, ...string[]]),
  givens: z.string().max(PUZZLE_CODE_LONGEST),
  answer: z.string().max(PUZZLE_CODE_LONGEST),
  /** The browser's own clock, kept only to say it back: nothing here is timed. */
  elapsedMs: z.number().int().nonnegative().optional(),
  /*
   * The Check allowance, the checks spent and the time paused, as the browser
   * kept them — the same word the elapsed time is — so a one-check solve is
   * never shown as though it had checked freely. Left out, as by a browser
   * from before the allowance: no limit, not recorded, none.
   */
  checksAllowed: z.number().int().nullable().optional(),
  checksUsed: z.number().int().nonnegative().optional(),
  pausedMs: z.number().int().nonnegative().optional(),
  /** How many times Hint was pressed — kept with the solve, so a helped time is shown as one. */
  hintsUsed: z.number().int().nonnegative().optional(),
  /** The grid's seed, so the unfinished run kept of it (if any) is taken off the member's games. */
  seed: z.number().int().optional(),
  /**
   * A word puzzle whose guesses ran out: ended, not solved. Checked as a solve
   * is (`checkOutOfGuesses`), kept with `solved` false for the letters it
   * found, paid `puzzleEnded`, and its kept run comes off the member's games.
   */
  outOfGuesses: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "puzzle-solved", RATE_LIMITS.puzzleSolved);
    if (tooMany !== null) return tooMany;

    const memberId = await currentMemberId();
    if (memberId === null) {
      return NextResponse.json({ error: "Solving for XP needs an account." }, { status: 401, headers: NO_STORE });
    }

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("A puzzle, its size and level, the givens and the answer.");
    const { size, givens, answer } = parsed.data;
    const kind = parsed.data.kind as (typeof PUZZLE_KIND_LIST)[number];
    const spec = PUZZLE_SPECS[kind];
    if (!spec.sizes.includes(size)) return unprocessable(`No ${kind} at ${size}.`);
    if (givens.length > spec.mostCells || answer.length > spec.mostCells) return unprocessable("Not a grid of that size.");

    const checksAllowed = parsed.data.checksAllowed ?? null;
    if (!isCheckAllowance(checksAllowed)) return unprocessable("No such Check allowance.");
    const checksUsed = parsed.data.checksUsed ?? 0;
    if (checksAllowed !== null && checksUsed > checksAllowed) return unprocessable("More checks than the allowance.");

    if (parsed.data.outOfGuesses === true) {
      const ended = checkOutOfGuesses(kind, size, givens, answer);
      if (!ended.ok) return unprocessable(`Not over: ${ended.reason}.`);
      const level = parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number];
      /* Kept, not solved: it scores the letters it found (`wordScore`) on the
         points boards and waits in the member's own list, and nothing that
         counts solves ever sees it. John, 2026-09-25: "0 points is only
         possible for never hitting even one letter". */
      await keepSolve({
        memberId,
        kind,
        size,
        level,
        givens,
        elapsedMs: parsed.data.elapsedMs ?? 0,
        checksAllowed: null,
        checksUsed: 0,
        pausedMs: parsed.data.pausedMs ?? 0,
        hintsUsed: 0,
        answer,
        solved: false,
      });
      if (parsed.data.seed !== undefined) await dropRun(memberId, kind, size, level, parsed.data.seed);
      const now = new Date();
      const paid = await awardXp({ memberId, awards: puzzleAwards(kind, size, givens, false), now });
      await awardTourBonuses({ memberId, paid, variant: kind, now });
      return NextResponse.json(
        { ok: true, points: paid.points, awards: paid.awards.filter((award) => award.points > 0).map((award) => award.type) },
        { headers: NO_STORE },
      );
    }

    const verdict = checkSolution(kind, size, givens, answer);
    if (!verdict.ok) return unprocessable(`Not solved: ${verdict.reason}.`);

    const now = new Date();
    /* Kept, so the puzzle's page can show the fastest solves and a member
       their own. The browser's clock, said back to it: a solo solve is
       timed by nobody else, which is why a race is timed by the server. */
    await keepSolve({
      memberId,
      kind,
      size,
      level: parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number],
      givens,
      elapsedMs: parsed.data.elapsedMs ?? 0,
      checksAllowed,
      checksUsed,
      pausedMs: parsed.data.pausedMs ?? 0,
      hintsUsed: parsed.data.hintsUsed ?? 0,
      answer,
    });
    // Finished, so no longer going: the run kept of this grid comes off the member's games.
    if (parsed.data.seed !== undefined) await dropRun(memberId, kind, size, parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number], parsed.data.seed);
    const paid = await awardXp({ memberId, awards: puzzleAwards(kind, size, givens), now });
    /* The tour, as after a finished game: a first solve of a puzzle can complete
       every game played, and a first puzzle at all can complete every family. */
    await awardTourBonuses({ memberId, paid, variant: kind, now });

    return NextResponse.json(
      { ok: true, points: paid.points, awards: paid.awards.filter((award) => award.points > 0).map((award) => award.type) },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not record that puzzle.");
  }
}
