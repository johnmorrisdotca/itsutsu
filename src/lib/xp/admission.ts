import "server-only";

/**
 * What being let in pays: the day, and — the first time only — joining.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE SIGN-IN WAS SPENDING THE DAY IT NEVER PAID FOR
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `awardDailyVisit` rides `touchMember`'s write and is correct: it compares the
 * stored `lastSeenAt` with now BEFORE the stamp goes over it, so the first page
 * load of a new day pays and the four hundred after it cost one comparison.
 *
 * `admitMember` also writes `lastSeenAt` — every Google sign-in refreshes the
 * row it finds — and it paid nothing. So the order on any day a member SIGNED
 * IN was: sign-in stamps today, page load asks "is this a new day", reads the
 * stamp the sign-in just wrote, answers no, pays nothing. The day was gone
 * before anything could earn it, and nothing logged a thing, because no award
 * was ever attempted for `awardXp` to swallow.
 *
 * It is worst for the OPERATOR, and he is the person who noticed. His session
 * lasts `ADMIN_SESSION_DAYS` — one day — so he signs in through Google every
 * single day, which means the sign-in consumed the day every single day.
 * `dailyVisit` was, for him, unreachable by construction.
 *
 * Measured before it was fixed, against a scratch database through the real
 * server: a member last seen yesterday, `admitMember`, then a real page load —
 * `xp: 0`, ledger empty. The same member with the sign-in left out — `xp: 5`,
 * one `dailyVisit` row. The only difference between the two was the stamp.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND THE DAY A MEMBER JOINS IS A DAY THEY WERE HERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `Member.lastSeenAt` is `@default(now())`, so a row created by a sign-up
 * already says "seen today" before anybody has looked at anything. A new member
 * therefore got `joined` and no `dailyVisit` — and since THE LEDGER IS THE
 * CALENDAR (`dayRunMilestone` counts the `dailyVisit` rows), their first day was
 * missing from their own run of days for ever: a seven-day streak would have
 * been reached on their eighth day.
 *
 * So an admission that made the row passes `lastSeenAt: null` — there is no
 * previous visit, which is a different fact from "they were here today" — and
 * gets both awards in ONE batch. One transaction, and one toast that says
 * joining and the day rather than a second call replacing the first's flash.
 */

import { awardXp } from "./awardXp";
import { visitAwards } from "./dailyVisit";
import { XP_EVENTS } from "./xp.constants";
import type { XpAward } from "./xp.types";

/**
 * The member being let in, AS THEY WERE before the sign-in stamped them.
 *
 * `lastSeenAt` is null when this admission is what created the row, and only
 * then: it is the one moment there is genuinely no previous visit to compare
 * with. Every other field is read on the lookup `admitMember` already makes, so
 * this costs no query of its own.
 */
export type AdmittedMember = {
  id: string;
  lastSeenAt: Date | null;
  timeZone: string | null;
  awayUntil: Date | null;
};

export async function awardAdmission(row: AdmittedMember, now = new Date()): Promise<void> {
  /* `joined` is once ever and keyed on "" — so a row admitted again cannot be
     paid for joining twice, whatever is passed here; the unique index refuses
     it. This branch is about the batch reading right for a new member, not
     about being the thing that keeps it once. */
  const joining: XpAward[] = row.lastSeenAt === null ? [{ type: XP_EVENTS.joined }] : [];
  const awards = [...joining, ...(await visitAwards(row, now))];
  if (awards.length === 0) return;
  await awardXp({ memberId: row.id, awards, now });
}
