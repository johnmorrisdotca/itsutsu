import "server-only";

import { prisma } from "@/lib/prisma";
import { consentDecision, needsConsent, type Consent, type ConsentDecision, type ConsentOffer } from "@/lib/social/ageBand";
import type { AgeBand } from "@/lib/social/ageBand.constants";

import { OPERATOR_ACTIONS } from "./operatorLog.constants";
import { operatorActionWrite } from "./operatorLog";
import type { OperatorActor } from "./operatorLog.types";
import { CHILD_CLEARED, isChild } from "@/lib/social/childRules";

/**
 * The age band and its consent, written together.
 *
 * ONE TRANSACTION, so a member is never under 13 without a parent on file: the
 * band and the consent row land or neither does. That is the whole safety
 * property, and it is why there is no sweep for a half-answered welcome —
 * there is no half state to sweep. The rule that decides what may be written
 * is `consentDecision`, pure and tested; this file only reads whether a
 * consent is already held and then writes what the rule allows.
 */

export async function consentHeld(memberId: string): Promise<boolean> {
  const row = await prisma.parentalConsent.findUnique({ where: { memberId }, select: { id: true } });
  return row !== null;
}

/** The member's band and whether a consent is on file, for a page drawing the form. */
export async function ageBandOf(memberId: string): Promise<{ band: string | null; consented: boolean }> {
  const row = await prisma.member.findUnique({
    where: { id: memberId },
    select: { ageBand: true, parentalConsent: { select: { id: true } } },
  });
  return { band: row?.ageBand ?? null, consented: row?.parentalConsent != null };
}

/**
 * Whether this band may be recorded for this member with what came with it.
 * A consent already on file stands in for a new one; nothing else does.
 */
export async function ageBandGate(memberId: string, band: AgeBand, offer: ConsentOffer | null): Promise<ConsentDecision> {
  const held = needsConsent(band) ? await consentHeld(memberId) : false;
  return consentDecision(band, offer, held);
}

/**
 * Write the band, the consent that came with it, and, when the operator did
 * it, the log line: the band before and after, and whether a consent was
 * written. Never the parent's name; the log is read on a page the name has
 * no business on.
 */
export async function recordAgeBand(
  memberId: string,
  band: AgeBand,
  consent: Consent | null,
  by?: { actor: OperatorActor; before: string | null },
): Promise<void> {
  /*
   * A CHILD KEEPS NOTHING THAT SAYS WHERE THEY ARE: the city, country and bio
   * go in the same write as the band (childRules.ts, PRIV-03), so no page
   * can show what an earlier answer left behind.
   */
  const writes = [
    prisma.member.update({ where: { id: memberId }, data: isChild(band) ? { ageBand: band, ...CHILD_CLEARED } : { ageBand: band } }),
  ];
  if (consent !== null) {
    writes.push(
      prisma.parentalConsent.upsert({
        where: { memberId },
        create: { memberId, name: consent.name, relationship: consent.relationship },
        update: {},
      }) as never,
    );
  }
  if (by !== undefined) {
    writes.push(
      operatorActionWrite({
        actor: by.actor,
        action: OPERATOR_ACTIONS.ageBand,
        subjectId: memberId,
        detail: `${by.before ?? "unsaid"} → ${band}${consent === null ? "" : ", consent recorded"}`,
      }) as never,
    );
  }
  await prisma.$transaction(writes);
}
