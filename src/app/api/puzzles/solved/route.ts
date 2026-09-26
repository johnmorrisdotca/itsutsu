import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { preparePuzzle } from "@/lib/puzzles/generate";
import { HEAD_START_HINTS, offersHeadStart } from "@/lib/puzzles/gomoji/headStart";
import { checkOutOfGuesses, checkSolution } from "@/lib/puzzles/puzzleCheck";
import { progressFits } from "@/lib/puzzles/puzzleProgress";
import { decodeStepLog, STEP_LOG_LONGEST } from "@/lib/puzzles/stepLog";
import { dropRun } from "@/lib/puzzles/server/puzzleRuns";
import { keepSolve } from "@/lib/puzzles/server/puzzleSolves";
import { PUZZLE_CODE_LONGEST, PUZZLE_KIND_LIST, PUZZLE_LEVEL_LIST, PUZZLE_SPECS, isCheckAllowance } from "@/lib/puzzles/puzzles.constants";
import { awardXp } from "@/lib/xp/awardXp";
import { puzzleAwards } from "@/lib/xp/xpPuzzle";
import { awardTourBonuses } from "@/lib/xp/xpTour";

/**
 * The steps a solve is kept with, for the replay on its page: the log as sent
 * when every grid in it is one this puzzle could have been, else none. A log
 * that does not read is dropped, never the solve — the solve was checked by
 * its answer, and the steps are only its story.
 */
function stepsOfSolve(kind: (typeof PUZZLE_KIND_LIST)[number], size: number, log: string | undefined): string | null {
  if (log === undefined || PUZZLE_SPECS[kind].helps === false) return null;
  const codes = decodeStepLog(log, size * size);
  return codes !== null && codes.every((code) => progressFits(kind, size, code)) ? log : null;
}

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
  /**
   * A word puzzle played with its Head start (`headStart.ts`): easy only, and
   * kept as the one help it is, a Hint's price off its points. Nothing in the
   * check changes: the keys it greyed are never letters of the word, and no
   * guess was spent on them.
   */
  headStart: z.boolean().optional(),
  /**
   * Every grid it was on the way (`stepLog.ts`, as a kept run's), for the
   * replay on the solve's page. Kept only where it reads; a word sends none,
   * its guesses being its steps.
   */
  steps: z.string().max(STEP_LOG_LONGEST).optional(),
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
    // A word puzzle's only help is its Head start; every other puzzle's hints are the ones it says it pressed.
    const words = spec.helps === false;
    const headStart = parsed.data.headStart === true && offersHeadStart(kind, parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number]);
    const hintsUsed = words ? (headStart ? HEAD_START_HINTS : 0) : (parsed.data.hintsUsed ?? 0);

    // A kana Gomoji's word list is loaded a length at a time; the check needs this one.
    await preparePuzzle(kind, size);

    if (parsed.data.outOfGuesses === true) {
      const ended = checkOutOfGuesses(kind, size, givens, answer, parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number]);
      if (!ended.ok) return unprocessable(`Not over: ${ended.reason}.`);
      const level = parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number];
      /* Kept, not solved: it scores the letters it found (`wordScore`) on the
         points boards and waits in the member's own list, and nothing that
         counts solves ever sees it. John, 2026-09-25: "0 points is only
         possible for never hitting even one letter". */
      const solveId = await keepSolve({
        memberId,
        kind,
        size,
        level,
        givens,
        elapsedMs: parsed.data.elapsedMs ?? 0,
        checksAllowed: null,
        checksUsed: 0,
        pausedMs: parsed.data.pausedMs ?? 0,
        hintsUsed,
        answer,
        solved: false,
      });
      if (parsed.data.seed !== undefined) await dropRun(memberId, kind, size, level, parsed.data.seed);
      const now = new Date();
      const paid = await awardXp({ memberId, awards: puzzleAwards(kind, size, givens, false), now });
      await awardTourBonuses({ memberId, paid, variant: kind, now });
      return NextResponse.json(
        { ok: true, points: paid.points, awards: paid.awards.filter((award) => award.points > 0).map((award) => award.type), solveId },
        { headers: NO_STORE },
      );
    }

    const verdict = checkSolution(kind, size, givens, answer, parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number]);
    if (!verdict.ok) return unprocessable(`Not solved: ${verdict.reason}.`);

    const now = new Date();
    /* Kept, so the puzzle's page can show the fastest solves and a member
       their own. The browser's clock, said back to it: a solo solve is
       timed by nobody else, which is why a race is timed by the server. */
    const solveId = await keepSolve({
      memberId,
      kind,
      size,
      level: parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number],
      givens,
      elapsedMs: parsed.data.elapsedMs ?? 0,
      checksAllowed,
      checksUsed,
      pausedMs: parsed.data.pausedMs ?? 0,
      hintsUsed,
      answer,
      steps: stepsOfSolve(kind, size, parsed.data.steps),
    });
    // Finished, so no longer going: the run kept of this grid comes off the member's games.
    if (parsed.data.seed !== undefined) await dropRun(memberId, kind, size, parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number], parsed.data.seed);
    const paid = await awardXp({ memberId, awards: puzzleAwards(kind, size, givens), now });
    /* The tour, as after a finished game: a first solve of a puzzle can complete
       every game played, and a first puzzle at all can complete every family. */
    await awardTourBonuses({ memberId, paid, variant: kind, now });

    // Which row it became, so the card that says "solved" can open it again, replay and all.
    return NextResponse.json(
      { ok: true, points: paid.points, awards: paid.awards.filter((award) => award.points > 0).map((award) => award.type), solveId },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not record that puzzle.");
  }
}
