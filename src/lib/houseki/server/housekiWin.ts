import "server-only";

import { prisma } from "@/lib/prisma";

import { housekiPrice } from "../../points/housekiLadder";
import type { HousekiKind, HousekiRequest } from "../houseki.types";
import { verifyHousekiWin, type HousekiRefusal } from "../housekiVerify";

/** What became of a win handed in: counted (and what it is worth), or why not. */
export type HousekiWinResult = { ok: true; ip: number; first: boolean } | { ok: false; why: HousekiRefusal };

/** Today in UTC, as a Daily names its day. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * KEEPS A WON LEVEL OR DAILY, once the server has played it again
 * (`housekiVerify.ts`): one row for each thing a member has won
 * (`HousekiWin`), written the first time and refreshed after, never doubled.
 * What it is worth is not written: the row says its campaign and marks, and the
 * ladder prices it when a board is drawn (`housekiLadder.ts`).
 *
 * `first` says whether this is the first time the member has won it, so the page
 * can say "counted" the first time and "your win still stands" the next; a better
 * score replaces the old one, a worse one changes nothing, and neither pays twice.
 */
export async function recordHousekiWin(memberId: string, kind: HousekiKind, request: HousekiRequest, text: string, now = new Date()): Promise<HousekiWinResult> {
  const checked = verifyHousekiWin(kind, request, text, utcDay(now));
  if (!checked.ok) return { ok: false, why: checked.why };
  const ip = housekiPrice(checked.campaign, checked.marks);
  const where = { memberId_kind_levelKey: { memberId, kind, levelKey: checked.levelKey } };
  const was = await prisma.housekiWin.findUnique({ where, select: { score: true } });
  if (was === null) {
    try {
      await prisma.housekiWin.create({ data: { memberId, kind, campaign: checked.campaign, levelKey: checked.levelKey, number: checked.number, marks: checked.marks, score: checked.score, save: checked.save, finishedAt: now } });
      return { ok: true, ip, first: true };
    } catch {
      // Two wins handed in at once: the other made the row, and this one is the second.
    }
  }
  if (was === null || checked.score > was.score) {
    await prisma.housekiWin.update({ where, data: { score: checked.score, save: checked.save, finishedAt: now } });
  }
  return { ok: true, ip, first: false };
}
