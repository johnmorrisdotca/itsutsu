import "server-only";

import { prisma } from "@/lib/prisma";
import { BOT_MEMBERS, BOT_MEMBER_LIST, botRowFields, type BotMember } from "./bots.constants";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * The computer players' member rows.
 *
 * Written once and then left alone. Their ids are curated and fixed, so this
 * is an upsert on a known id rather than a search for a name — and it is
 * idempotent for the same reason the features board's seeding is: the keys
 * come with the data, so running it twice writes nothing the second time.
 *
 * They are unclaimable, with a reason of their own. A computer player is not a
 * placeholder waiting for a person to take it over.
 */

/** How long a cached "yes, they exist" is trusted, so this is not a query a move. */
const REMEMBER_MS = 5 * 60_000;
let seededUntil = 0;

/** Writes a row for each rung of the ladder, if it is not already there. Safe to call often. */
export async function ensureBotMembers(now = Date.now()): Promise<void> {
  if (now < seededUntil) return;
  for (const bot of BOT_MEMBER_LIST) {
    await prisma.member.upsert({
      where: { id: bot.id },
      /*
       * The same description on both halves, so a value cannot be decided by
       * a release and then only ever reach rows that release created. That
       * had happened twice — `unclaimableBecause`, and then `showOnline` —
       * and both times the rule was written down rather than made true.
       */
      update: botRowFields(bot),
      create: {
        id: bot.id,
        // No address: a computer player never signs in, and never can.
        email: null,
        ...botRowFields(bot),
      },
    });
  }
  seededUntil = now + REMEMBER_MS;
}

/** The member row for one grade, writing it first if it is somehow missing. */
export async function botMemberFor(tier: BotTier): Promise<BotMember> {
  await ensureBotMembers();
  return BOT_MEMBERS[tier];
}

/**
 * Forgets that the rows were checked. For tests, and for the operator's page
 * after a database has been reset under a running server.
 */
export function forgetBotMembers(): void {
  seededUntil = 0;
}
