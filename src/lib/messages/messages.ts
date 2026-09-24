import "server-only";

import { recordInbox } from "@/lib/inbox/inbox";
import { INBOX_KINDS } from "@/lib/inbox/inbox.constants";
import { prisma } from "@/lib/prisma";
import { listable } from "@/lib/social/listable";
import { mayReachMember } from "@/lib/social/childReach";
import { isIgnoring } from "@/lib/social/ignores";

import { MESSAGE_TEXT_MAX, THREAD_SHOWN, type MessageRefusal } from "./messages.constants";

/**
 * MESSAGES BETWEEN MEMBERS, off the board (John, 2026-09-08): the one place
 * direct messages are written or read, so the ignore list is applied in one
 * place and in full.
 *
 * - A member somebody has ignored cannot write to them: `sendMessage` refuses,
 *   in words that say no more than "not from you".
 * - Nothing from a member the reader has ignored is shown: `readThread` hands
 *   back nothing from them, however old — ignoring somebody is not only about
 *   what they send next.
 * - A reader who has ignored somebody cannot write to them either, until they
 *   take it off: a conversation one side can speak in and the other cannot
 *   hear is not a conversation.
 *
 * A message also lands in the recipient's inbox, which is how they hear of it:
 * nothing is polled.
 */

export type SentOutcome = { ok: true } | { ok: false; reason: MessageRefusal };

export async function sendMessage(fromId: string, toId: string, text: string): Promise<SentOutcome> {
  const said = text.trim();
  if (said === "") return { ok: false, reason: "empty" };
  if (said.length > MESSAGE_TEXT_MAX) return { ok: false, reason: "too-long" };
  if (fromId === toId) return { ok: false, reason: "to-yourself" };

  const [to, from] = await Promise.all([
    prisma.member.findUnique({ where: { id: toId }, select: { id: true, botTier: true, unclaimableBecause: true } }),
    prisma.member.findUnique({ where: { id: fromId }, select: { name: true } }),
  ]);
  if (to === null || from === null) return { ok: false, reason: "no-such-member" };
  if (!listable(to)) return { ok: false, reason: "not-a-person" };
  if (await isIgnoring(toId, fromId)) return { ok: false, reason: "not-taking-messages" };
  if (await isIgnoring(fromId, toId)) return { ok: false, reason: "you-ignore-them" };
  if (!(await mayReachMember(toId, fromId))) return { ok: false, reason: "child-buddies-only" };

  await prisma.directMessage.create({ data: { fromId, toId, text: said } });
  await recordInbox([{ memberId: toId, kind: INBOX_KINDS.message, fromName: from.name, fromMemberId: fromId, detail: said }]);
  return { ok: true };
}

export type ThreadMessage = { id: string; mine: boolean; text: string; createdAt: string };

/**
 * The conversation between the reader and one other member, oldest first —
 * and nothing at all from them if the reader has ignored them. Reading it marks
 * what was sent to the reader as read.
 */
export async function readThread(meId: string, otherId: string, now = new Date()): Promise<ThreadMessage[]> {
  const theyAreIgnored = await isIgnoring(meId, otherId);
  const rows = await prisma.directMessage.findMany({
    where: {
      OR: [
        { fromId: meId, toId: otherId },
        ...(theyAreIgnored ? [] : [{ fromId: otherId, toId: meId }]),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: THREAD_SHOWN,
  });
  const unread = rows.filter((row) => row.toId === meId && row.readAt === null).map((row) => row.id);
  if (unread.length > 0) await prisma.directMessage.updateMany({ where: { id: { in: unread } }, data: { readAt: now } });
  return rows.reverse().map((row) => ({
    id: row.id,
    mine: row.fromId === meId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  }));
}
