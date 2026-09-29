import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberRow } from "@/lib/auth/currentSession";
import { ONLINE_GAME_LIST } from "@/lib/party/online/onlineGames";
import type { OnlineGameKey } from "@/lib/party/online/online.types";
import { tablePath } from "@/lib/party/online/onlinePaths";
import { readSeatAsk } from "@/lib/party/online/onlineSeats";
import { createTable } from "@/lib/party/online/server/tableCreate";

/**
 * A party table made for several devices, from a game's set-up: the game, its
 * board, and one ask per seat — the maker's own first, then a buddy by id, a
 * link, or a computer. Answers with the table's address. What is checked, and
 * in what order, is `createTable`'s; see docs/plans/party-online/README.md.
 */
const bodySchema = z.object({
  game: z.enum(ONLINE_GAME_LIST as [OnlineGameKey, ...OnlineGameKey[]]),
  size: z.number().int().min(0).max(40).default(0),
  seats: z.array(z.unknown()).min(1).max(8),
});

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "table", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;
    const me = await currentMemberRow();
    if (me === null) return NextResponse.json({ error: "Sign in to set a table." }, { status: 401, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("A game, its board and its seats.");
    const asks = parsed.data.seats.map(readSeatAsk);
    if (asks.some((ask) => ask === null)) return badRequest("Each seat is you, a buddy, a link or a computer.");

    const made = await createTable({
      game: parsed.data.game,
      size: parsed.data.size,
      asks: asks.flatMap((ask) => (ask === null ? [] : [ask])),
      maker: { id: me.id, name: me.name ?? "" },
    });
    if ("refused" in made) return NextResponse.json({ error: made.refused }, { status: made.status, headers: NO_STORE });
    return NextResponse.json({ id: made.id, at: tablePath(parsed.data.game, made.id) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not set that table.");
  }
}
