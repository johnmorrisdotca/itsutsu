import "server-only";

import type { CapRefusal, MailRefusal, MailSender, OutgoingMail, SendDeps, SendOutcome, TransportResult } from "./mail.types";
import { prismaMailCounter } from "./mailCounter";
import { limitsFor } from "./mailLimits";
import { mailRefusalFor } from "./mailSwitch";
import { resendTransport } from "./resendTransport";
import { foldEmail } from "@/lib/auth/foldEmail";
import { prisma } from "@/lib/prisma";
import { mayBeEmailed } from "@/lib/social/childRules";

/** Whether an address belongs to a member under 13. An address with no member behind it is nobody's child. */
async function childAddress(address: string): Promise<boolean> {
  const member = await prisma.member.findUnique({ where: { email: foldEmail(address) }, select: { ageBand: true } });
  return member !== null && !mayBeEmailed(member.ageBand);
}

/**
 * THE ONE WAY THE SITE SENDS AN EMAIL.
 *
 * Every call names the member the email is counted against, and there is no
 * caller on a timer, a poll or a batch. A route a person clicked asks here
 * directly; anything the SITE decides to send goes through a door in this
 * folder first — `sendNotice` is the one for game notices, and it is switched
 * off, because a your-turn email on every move would spend the site's day
 * before lunch. `oneSender.coverage.test.ts` holds both halves of that.
 *
 * In order, and each step fails closed:
 *
 *   1. Is sending switched on? Outside production, or with no key, nothing is
 *      counted and nothing is sent. A test that hands in a `transport` is the
 *      only way past this, and only for that call.
 *   2. Is there room? One place is taken under the member's day, the site's
 *      day and the site's month together, or under none (`mailCounter.ts`).
 *      If the count cannot be read, nothing is sent: a cap that cannot measure
 *      must not wave a send through.
 *   3. Send, once. A transport error after the count keeps the count — the
 *      provider may have accepted it — so an error can only make the site stop
 *      sooner, never later.
 *
 * It never throws and never answers "sent" for anything but a transport that
 * said so. Every refusal is logged with its reason, and never with the address.
 */
export async function sendMail(mail: OutgoingMail, sender: MailSender, deps: SendDeps = {}): Promise<SendOutcome> {
  /*
   * 0. NEVER TO A CHILD, before anything else and in every environment: the
   *    site sends no email to a member under 13 (childRules.ts, PRIV-03). If
   *    the question cannot be answered, nothing is sent — a rule that cannot
   *    measure must not wave a send through.
   */
  try {
    if (await (deps.isChildAddress ?? childAddress)(mail.to)) return notSent("to-a-child");
  } catch (error) {
    console.error("[mail] could not tell whether the address is a child's", error);
    return notSent("count-unavailable");
  }

  let transport = deps.transport;
  if (transport === undefined) {
    const env = deps.env ?? process.env;
    const off = mailRefusalFor(env);
    if (off !== null) return notSent(off);
    transport = resendTransport((env.RESEND_API_KEY ?? "").trim());
  }

  let full: CapRefusal | null;
  try {
    full = await (deps.counter ?? prismaMailCounter).reserve(limitsFor(sender, deps.now ?? new Date()));
  } catch (error) {
    console.error("[mail] the send counter could not be read", error);
    return notSent("count-unavailable");
  }
  if (full !== null) return notSent(full);

  let result: TransportResult;
  try {
    result = await transport(mail);
  } catch (error) {
    result = { ok: false, detail: error instanceof Error ? error.name : "transport threw" };
  }
  if (!result.ok) return notSent("transport-error", result.detail);
  return { sent: true, id: result.id };
}

function notSent(refusal: MailRefusal, detail?: string): SendOutcome {
  console.warn(`[mail] not sent: ${refusal}${detail === undefined ? "" : ` (${detail})`}`);
  return { sent: false, refusal };
}
