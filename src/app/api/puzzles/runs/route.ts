import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { progressFits } from "@/lib/puzzles/puzzleProgress";
import { PUZZLE_CODE_LONGEST, PUZZLE_KIND_LIST, PUZZLE_LEVEL_LIST, PUZZLE_SPECS, isCheckAllowance } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { isSeed } from "@/lib/puzzles/random";
import { keepRun } from "@/lib/puzzles/server/puzzleRuns";

/**
 * An unfinished puzzle, kept: sent when it is paused or its page is left (by
 * `navigator.sendBeacon`, so a page being closed still sends it), never while
 * it is being solved. One upsert per grid. The server checks the shape of what
 * it is keeping and nothing else — there is no answer to check yet, and the
 * time is the browser's, as a finished solve's is.
 */
const bodySchema = z.object({
  kind: z.enum(PUZZLE_KIND_LIST as [string, ...string[]]),
  size: z.number().int(),
  level: z.enum(PUZZLE_LEVEL_LIST as [string, ...string[]]),
  seed: z.number().int(),
  checksAllowed: z.number().int().nullable().optional(),
  checksUsed: z.number().int().nonnegative().optional(),
  progress: z.string().max(PUZZLE_CODE_LONGEST),
  /** The time so far; a month is more than anybody spends on one grid. */
  elapsedMs: z.number().int().nonnegative().max(31 * 24 * 60 * 60 * 1000),
});

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "puzzle-run", RATE_LIMITS.puzzleRun);
    if (tooMany !== null) return tooMany;
    const memberId = await currentMemberId();
    // Nobody to keep it for: a visitor's puzzle lasts the page, as it always did.
    if (memberId === null) return NextResponse.json({ error: "Keeping a puzzle needs an account." }, { status: 401, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("A puzzle, its size, level and seed, and what is written on it.");
    const kind = parsed.data.kind as PuzzleKind;
    const { size, seed, progress } = parsed.data;
    if (!PUZZLE_SPECS[kind].sizes.includes(size)) return unprocessable(`No ${kind} at ${size}.`);
    if (!isSeed(seed)) return badRequest("Not a seed.");
    if (!progressFits(kind, size, progress)) return unprocessable("Not a grid of that size.");
    const checksAllowed = parsed.data.checksAllowed ?? null;
    if (!isCheckAllowance(checksAllowed)) return unprocessable("No such Check allowance.");

    await keepRun({
      memberId,
      kind,
      size,
      level: parsed.data.level as PuzzleLevel,
      seed,
      checksAllowed,
      checksUsed: Math.min(parsed.data.checksUsed ?? 0, checksAllowed ?? Number.MAX_SAFE_INTEGER),
      progress,
      elapsedMs: parsed.data.elapsedMs,
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not keep that puzzle.");
  }
}
