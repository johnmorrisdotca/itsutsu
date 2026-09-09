import "server-only";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { prisma } from "@/lib/prisma";
import { BOT_MEMBERS, BOT_MEMBER_LIST, type BotMember } from "./bots.constants";
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
       * Everything that is a fact about being a computer player, and nothing
       * that is earned or chosen: a rating is never written here.
       *
       * `unclaimableBecause` belongs in that first group and had been left
       * out of it, so a row written before that column existed never gained
       * it. It is not what decides the robot badge — `memberKind` reads
       * `botTier` for that, and an earlier version of this comment said
       * otherwise, wrongly. What it does decide is that a computer player's
       * page cannot be claimed by a person, which is worth being true of
       * rows written a year ago as well as rows written today.
       *
       * The rule under it is the point: any value a release decides has to
       * be in the update as well as the create, or the create is the only
       * release that ever applies.
       */
      update: {
        name: bot.name,
        bio: bot.bio,
        botTier: bot.tier,
        country: bot.country,
        unclaimableBecause: UNCLAIMABLE_REASONS.computer,
      },
      create: {
        id: bot.id,
        // No address: a computer player never signs in, and never can.
        email: null,
        name: bot.name,
        bio: bot.bio,
        botTier: bot.tier,
        country: bot.country,
        unclaimableBecause: UNCLAIMABLE_REASONS.computer,
        // Not in the "who is here" list: it is always here, which is not news.
        showOnline: false,
        emailNotify: false,
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
