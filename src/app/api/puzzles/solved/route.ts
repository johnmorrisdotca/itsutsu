import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { checkSolution } from "@/lib/puzzles/puzzleCheck";
import { keepSolve } from "@/lib/puzzles/server/puzzleSolves";
import { PUZZLE_CODE_LONGEST, PUZZLE_KIND_LIST, PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
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

    const verdict = checkSolution(kind, size, givens, answer);
    if (!verdict.ok) return unprocessable(`Not solved: ${verdict.reason}.`);

    const now = new Date();
    /* Kept, so the puzzle's page can show the fastest solves and a member
       their own. The browser's clock, said back to it: a solo solve is
       timed by nobody else, which is why a race is timed by the server. */
    await keepSolve({ memberId, kind, size, level: parsed.data.level as (typeof PUZZLE_LEVEL_LIST)[number], givens, elapsedMs: parsed.data.elapsedMs ?? 0 });
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
