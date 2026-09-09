import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, notFound, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import {
  EMBED_TOKEN_PARAM,
  allowsData,
  verifyEmbedToken,
} from "@/lib/auth/embedToken";
import { fetchEmbedSummary } from "@/lib/embed/embedSummary";
import { PLAYER_NAME_MAX } from "@/lib/history/gameHistory.constants";

/**
 * What an embedded board may read from the server.
 *
 * The token is checked again here rather than trusted from the gate, because
 * the gate only establishes that *an* embed token was presented — this route
 * additionally needs one carrying the `data` scope. A board-scoped token gets
 * 404, the same answer the operator routes give, so the endpoint does not
 * advertise itself to an embed that was never meant to reach it.
 */
const querySchema = z.object({
  player: z.string().max(PLAYER_NAME_MAX).optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const token = await verifyEmbedToken(
      url.searchParams.get(EMBED_TOKEN_PARAM) ?? undefined,
    );
    if (!allowsData(token)) return notFound();

    const tooMany = overLimit(request, "embed-summary", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const parsed = querySchema.safeParse({
      player: url.searchParams.get("player") ?? undefined,
    });
    if (!parsed.success) return badRequest("Invalid summary parameters.");

    return NextResponse.json(
      await fetchEmbedSummary(parsed.data.player ?? null),
      {
        // A board in someone else's page can afford to be a few seconds stale.
        headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" },
      },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not load the summary.");
  }
}
