import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { keepFinishedDaysFor } from "@/lib/auth/members";
import { currentMemberId } from "@/lib/auth/currentSession";
import { ratedRecordOf, type RatedRecord } from "@/lib/rating/ratedRecord";

import { gamesGoing } from "./gamesGoing";
import { fetchMyGames } from "./myGames";
import { seatClaims } from "./seatCookie";

/** The header's four figures: what is waiting on the reader, what they have going, and their rated record. */
export type HeaderCounts = { yourMove: number; going: number; offered: number; record: RatedRecord | null };

/**
 * THE HEADER'S GAME COUNTS, WORKED OUT IN THE PAGE'S OWN RENDER.
 *
 * The badge beside Play and the strip under the masthead used to ask
 * `/api/games/mine` from the browser after every page arrived — a second paid
 * request per page view, through the gate and a function, which rebuilt the
 * whole queue, read a page of finished games and sent every group back, for
 * four numbers. Measured 2026-09-26 on a production build: every page view
 * was the page, `/api/session` and this.
 *
 * Now the page works them out while it renders, streamed in behind a Suspense
 * boundary so the header does not wait on them (`HeaderCountsSeed`), with no
 * finished page to speak of (`limit: 1`, the pager's smallest — none of the four counts a finished game, and it cannot page by nothing) and
 * nothing sent but the four. The route stays for a tab that comes back into
 * focus, and for the advance to the next game, which reads its groups.
 *
 * Cached for the one request, since the badge and the strip both ask.
 */
export const headerCounts = cache(async (): Promise<HeaderCounts | null> => {
  const claims = seatClaims((await cookies()).getAll());
  const memberId = await currentMemberId();
  if (claims.size === 0 && memberId === null) return null;
  const keepFinishedDays = await keepFinishedDaysFor(memberId);
  const [queue, record] = await Promise.all([
    fetchMyGames(claims, memberId, new Date(), keepFinishedDays, { limit: 1 }),
    ratedRecordOf(memberId),
  ]);
  const { groups } = queue;
  return { yourMove: groups.yourMove.length, going: gamesGoing(groups), offered: groups.offered.length, record };
});
