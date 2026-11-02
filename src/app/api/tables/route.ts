import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, refuseWith, serverError } from "@/lib/api/apiResponse";
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
  /** Only kept to a sane number here: each game's rules take the sizes they offer and refuse the rest. Hitotsu's is the points it plays to, 500 at most. */
  size: z.number().int().min(0).max(1000).default(0),
  seats: z.array(z.unknown()).min(1).max(8),
  /** What a game's set-up sends beyond a size and the seats (Kumimoji's settings and the bag its browser dealt); its rules check it. */
  setup: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "table", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;
    const me = await currentMemberRow();
    if (me === null) return refuse(401, "err.table.signInSet", undefined, { headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.table.setShape");
    const asks = parsed.data.seats.map(readSeatAsk);
    if (asks.some((ask) => ask === null)) return badRequest("err.table.seatKinds");

    const made = await createTable({
      game: parsed.data.game,
      size: parsed.data.size,
      asks: asks.flatMap((ask) => (ask === null ? [] : [ask])),
      maker: { id: me.id, name: me.name ?? "" },
      setup: parsed.data.setup,
    });
    if ("refused" in made) return refuseWith(made.status, made.refused, { headers: NO_STORE });
    return NextResponse.json({ id: made.id, at: tablePath(parsed.data.game, made.id) }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.table.setFailed");
  }
}
