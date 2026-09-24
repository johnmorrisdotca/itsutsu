import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberRow } from "@/lib/auth/currentSession";
import { matchPath, seatPath } from "@/lib/gomoku/slugs";
import { PUZZLE_KIND_LIST, PUZZLE_LEVEL_LIST } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { isSeed } from "@/lib/puzzles/random";
import { createRace } from "@/lib/puzzles/server/puzzleRaces";

/**
 * A race made: the host's browser generated the puzzle and posts it whole,
 * givens and answer, with the seed it came from. The server checks the answer
 * against the givens once, keeps both (the answer never goes back out), and
 * answers with the race's address and the guest's seat link — the one thing
 * the host has to give the other person.
 */
const bodySchema = z.object({
  kind: z.enum(PUZZLE_KIND_LIST as [string, ...string[]]),
  size: z.number().int(),
  level: z.enum(PUZZLE_LEVEL_LIST as [string, ...string[]]),
  seed: z.number().int(),
  givens: z.string().max(200),
  solution: z.string().max(200),
});

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "puzzle-race", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;
    const me = await currentMemberRow();
    if (me === null) return NextResponse.json({ error: "Racing needs an account." }, { status: 401, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("A puzzle, its size, level and seed, the givens and the answer.");
    if (!isSeed(parsed.data.seed)) return badRequest("Not a seed.");

    const made = await createRace({
      kind: parsed.data.kind as PuzzleKind,
      size: parsed.data.size,
      level: parsed.data.level as PuzzleLevel,
      seed: parsed.data.seed,
      givens: parsed.data.givens,
      solution: parsed.data.solution,
      hostMemberId: me.id,
      hostName: me.name ?? "",
    });
    if ("refused" in made) return unprocessable(made.refused);
    return NextResponse.json(
      { id: made.id, at: matchPath(parsed.data.kind, made.id), seat: seatPath(parsed.data.kind, made.id, made.guestToken) },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not make that race.");
  }
}
