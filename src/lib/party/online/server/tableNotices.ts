import "server-only";

import { recordInbox } from "@/lib/inbox/inbox";
import { INBOX_KINDS } from "@/lib/inbox/inbox.constants";

import { ONLINE_SEAT_KINDS } from "../online.constants";
import type { TableRow } from "./tableRead";

/**
 * WHAT A TABLE TELLS ITS MEMBERS, through the inbox: one insert, written by
 * the code that makes it happen, never polled. There is no "your move" email:
 * every game notice is off site-wide until a digest exists (`NOTICES.sending`),
 * and the site's your-turn notice is written for two-player games; My games'
 * "your move" is the notice meanwhile, as it is for those.
 */

/** A seat given to a member by name: told in their inbox, with who asked. */
export async function noticeInvited(
  table: { id: string; game: string },
  invited: readonly string[],
  maker: { id: string; name: string },
): Promise<void> {
  await recordInbox(
    invited.map((memberId) => ({
      memberId,
      kind: INBOX_KINDS.tableInvite,
      gameId: table.id,
      variant: table.game,
      fromName: maker.name,
      fromMemberId: maker.id,
    })),
  );
}

/**
 * How a table ended for one seat: won, shared, lost, or ended with nobody
 * winning — by a member, or by rules that named no winner (a race where
 * nobody can move). "Lost" is said only where somebody else won.
 */
export function resultFor(seat: number, winners: readonly number[], ended: boolean): "won" | "shared" | "lost" | "ended" {
  if (ended || winners.length === 0) return "ended";
  if (!winners.includes(seat)) return "lost";
  return winners.length > 1 ? "shared" : "won";
}

/** Every member at a table that has finished or been ended is told how it went for them. */
export async function noticeTableOver(row: Pick<TableRow, "id" | "game" | "seats">, winners: readonly number[], ended: boolean): Promise<void> {
  await recordInbox(
    row.seats
      .filter((seat) => seat.kind === ONLINE_SEAT_KINDS.member && seat.memberId !== null)
      .map((seat) => ({
        memberId: seat.memberId,
        kind: INBOX_KINDS.tableOver,
        gameId: row.id,
        variant: row.game,
        detail: resultFor(seat.seat, winners, ended),
      })),
  );
}
