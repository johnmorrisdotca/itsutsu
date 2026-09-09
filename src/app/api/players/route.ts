import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, serverError } from "@/lib/api/apiResponse";
import { suggestPlayers } from "@/lib/history/gameHistory";
import {
  PLAYER_NAME_MAX,
  PLAYER_SUGGEST_LIMIT_DEFAULT,
  PLAYER_SUGGEST_LIMIT_MAX,
  PLAYER_SUGGEST_MIN_QUERY,
} from "@/lib/history/gameHistory.constants";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";

const suggestSchema = z.object({
  q: z.string().min(PLAYER_SUGGEST_MIN_QUERY).max(PLAYER_NAME_MAX),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PLAYER_SUGGEST_LIMIT_MAX)
    .default(PLAYER_SUGGEST_LIMIT_DEFAULT),
});

/**
 * Player-name autocomplete, drawn from the names games were actually recorded
 * under. A query shorter than the minimum answers an empty list rather than an
 * error, so a name box can call this on every keystroke without special-casing
 * the first one.
 */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "players", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const url = new URL(request.url);
    const parsed = suggestSchema.safeParse({
      q: url.searchParams.get("q") ?? "",
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      const tooShort = parsed.error.issues.every((issue) => issue.path[0] === "q");
      if (tooShort) {
        return NextResponse.json({ items: [] }, { status: 200 });
      }
      return badRequest("Invalid autocomplete parameters.");
    }

    const items = await suggestPlayers(parsed.data.q, parsed.data.limit);
    return NextResponse.json(
      { items },
      {
        status: 200,
        // Keystroke traffic; a few seconds of reuse costs nothing and helps a lot.
        headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" },
      },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not load player suggestions.");
  }
}
