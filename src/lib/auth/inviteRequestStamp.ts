import { nowInSeconds, signPayload, verifyPayload, type Signed } from "./signing";

/**
 * WHEN THE INVITE-REQUEST FORM WAS DRAWN, SIGNED SO NOBODY ELSE CAN SAY SO.
 *
 * A person reads the form, types an address and a sentence, and presses Send:
 * that takes seconds. A script posts the moment it has the page, or posts a
 * form it fetched once, over and over, for days. The stamp tells those apart
 * without asking the person anything — no puzzle, no service, no cookie — and
 * because it is signed with the site's secret a script cannot write a stamp
 * that says it waited.
 */
type FormStamp = Signed & { kind: "invite-request-form"; iat: number };

/** Faster than this from drawing to sending, and nobody read the form. */
export const STAMP_QUICKEST_SECONDS = 3;
/** A form older than this is not one somebody is filling in now. */
export const STAMP_LONGEST_SECONDS = 24 * 60 * 60;

/** A stamp for a form drawn now, or null where the site has no secret to sign with. */
export function stampInviteRequestForm(now: number = nowInSeconds()): Promise<string | null> {
  return signPayload<FormStamp>({ kind: "invite-request-form", iat: now, exp: now + STAMP_LONGEST_SECONDS });
}

/**
 * Whether a submitted stamp is a form a person filled in. Missing, altered,
 * signed by somebody else, expired, and sent too soon all answer false, and
 * none of them says which — the caller treats them all as a bot.
 */
export async function stampIsAPerson(stamp: string | undefined, now: number = nowInSeconds()): Promise<boolean> {
  const read = await verifyPayload<FormStamp>(stamp, "invite-request-form");
  if (read === null) return false;
  return now - read.iat >= STAMP_QUICKEST_SECONDS;
}
