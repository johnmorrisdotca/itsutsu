import "server-only";

import { isBotId } from "@/lib/bots/bots";
import { prisma } from "@/lib/prisma";

import { INBOX_KEEP_DAYS, INBOX_KINDS, INBOX_SHOWN, type InboxKind } from "./inbox.constants";

/**
 * THE INBOX: what happened while a member was away.
 *
 * Written at the moment each thing happens, by the code that makes it happen —
 * one row, one insert — and read only when the member opens /inbox. Nothing is
 * polled, nothing is recomputed per page, and there is no unread count on
 * every page's header: that would be a query on every render for a number that
 * changes a few times a day. /play shows the count, and the account menu the
 * way in.
 *
 * Never written for a program, which has no inbox to read, and never allowed to
 * stop the thing it records: a failure to write is logged and forgotten, the
 * way a notice is.
 */

export type InboxEntry = {
  memberId: string | null | undefined;
  kind: InboxKind;
  gameId?: string | null;
  variant?: string | null;
  fromName?: string | null;
  fromMemberId?: string | null;
  detail?: string | null;
};

/** Records things for members' inboxes; programs and empty seats are left out. */
export async function recordInbox(entries: readonly InboxEntry[]): Promise<void> {
  const rows = entries
    .filter((entry): entry is InboxEntry & { memberId: string } => !!entry.memberId && !isBotId(entry.memberId))
    .map((entry) => ({
      memberId: entry.memberId,
      kind: entry.kind,
      gameId: entry.gameId ?? null,
      variant: entry.variant ?? null,
      fromName: entry.fromName?.trim() ?? "",
      fromMemberId: entry.fromMemberId ?? null,
      detail: entry.detail?.trim() ?? "",
    }));
  if (rows.length === 0) return;
  try {
    await prisma.inboxItem.createMany({ data: rows });
  } catch (error) {
    console.error("[inbox] could not record", error);
  }
}

export type InboxItemShown = {
  id: string;
  kind: InboxKind;
  gameId: string | null;
  variant: string | null;
  fromName: string;
  fromMemberId: string | null;
  detail: string;
  createdAt: string;
  unread: boolean;
};

/**
 * A member's inbox, newest first — and, having shown it, everything in it is
 * read and anything past thirty days is gone. Opening the page is the only time
 * the inbox is touched, so it is the only place that tidies it.
 */
export async function openInbox(memberId: string, now = new Date()): Promise<InboxItemShown[]> {
  const cutoff = new Date(now.getTime() - INBOX_KEEP_DAYS * 24 * 60 * 60 * 1000);
  await prisma.inboxItem.deleteMany({ where: { memberId, createdAt: { lt: cutoff } } });
  const rows = await prisma.inboxItem.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: INBOX_SHOWN,
  });
  const unread = rows.filter((row) => row.readAt === null).map((row) => row.id);
  if (unread.length > 0) {
    await prisma.inboxItem.updateMany({ where: { id: { in: unread } }, data: { readAt: now } });
  }
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as InboxKind,
    gameId: row.gameId,
    variant: row.variant,
    fromName: row.fromName,
    fromMemberId: row.fromMemberId,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
    unread: row.readAt === null,
  }));
}

/** How many items a member has not seen, for the one page that says so. */
export async function unreadInbox(memberId: string | null): Promise<number> {
  if (memberId === null) return 0;
  return prisma.inboxItem.count({ where: { memberId, readAt: null } });
}

/**
 * Somebody took a seat a member posted for anyone: ItsYourTurn's "Opponent has
 * joined your Waiting Room game", told to the member who posted it. One read of
 * the row, for the poster's id and the game's name.
 */
export async function inboxSeatTaken(gameId: string, taken: "black" | "white", takerName: string): Promise<void> {
  try {
    const row = await prisma.game.findUnique({
      where: { id: gameId },
      select: { blackMemberId: true, whiteMemberId: true, blackName: true, whiteName: true, variant: true },
    });
    if (row === null) return;
    const poster = taken === "black" ? row.whiteMemberId : row.blackMemberId;
    const taker = taken === "black" ? row.blackMemberId : row.whiteMemberId;
    const name = takerName.trim() || (taken === "black" ? row.blackName : row.whiteName);
    await recordInbox([
      { memberId: poster, kind: INBOX_KINDS.seatTaken, gameId, variant: row.variant, fromName: name, fromMemberId: taker },
    ]);
  } catch (error) {
    console.error("[inbox] could not tell the poster", error);
  }
}
