"use server";

import { headers } from "next/headers";

import { stampIsAPerson } from "@/lib/auth/inviteRequestStamp";
import { RATE_LIMITS, checkRateLimit } from "@/lib/api/rateLimit";
import { MAIL_REFUSAL_TEXT } from "@/lib/mail/mail.constants";
import { readInviteRequest, sendInviteRequest } from "@/lib/mail/inviteRequest";
import { fetchSiteSettings } from "@/lib/site/siteStore";
import type { AskForInviteState } from "@/components/auth/askForInvite.types";

/**
 * A visitor's request for an invitation, from the form on /join.
 *
 * A Server Action on the join page rather than a route under /api, because
 * /join is already open to somebody with no session and the gate in
 * `proxy.ts` is not this feature's to widen. Next answers a Server Action only
 * when its Origin is this site's own host, so a form posted from anywhere else
 * never reaches this function.
 *
 * Every check is in `readInviteRequest` and `sendInviteRequest`; this reads
 * the request's surroundings — whether asking is offered at all, who is
 * asking, how often — and says what happened in words the page can show.
 */
export async function askForInvite(_before: AskForInviteState, form: FormData): Promise<AskForInviteState> {
  /*
   * Only while the door is invite-only. Open, nobody needs to ask; closed,
   * the operator has shut it on purpose and a request would be a way round.
   */
  if ((await fetchSiteSettings()).registration !== "invite-only") {
    return { kind: "problem", message: "Invitations are not being asked for at the moment." };
  }

  const asked = await headers();
  const from = (asked.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || asked.get("x-real-ip") || "unknown";

  const limit = checkRateLimit(`invite-request:${from}`, RATE_LIMITS.inviteRequest);
  if (!limit.allowed) {
    return { kind: "problem", message: "That is a lot of requests from one place. Please try again in an hour." };
  }

  /*
   * A BOT IS TOLD IT WORKED. The hidden field filled in, or a form that was
   * never drawn by this site, or one sent faster than anybody reads — each is
   * answered exactly as a sent request is, so a script learns nothing to
   * change. Nothing is sent and nothing is counted.
   */
  const stamp = form.get("stamp");
  const reading = readInviteRequest(form);
  if (reading.kind === "bot" || !(await stampIsAPerson(typeof stamp === "string" ? stamp : undefined))) {
    return SENT;
  }
  if (reading.kind === "problem") return { kind: "problem", message: reading.problem };

  const outcome = await sendInviteRequest(reading.request, from);
  if (outcome.sent) return SENT;
  /*
   * The refusals a visitor can act on get their own sentence; the rest — the
   * site not sending mail at all here, a provider that failed — are said as
   * what they are, with the address to write to instead.
   */
  return { kind: "problem", message: MAIL_REFUSAL_TEXT[outcome.refusal] };
}

const SENT: AskForInviteState = {
  kind: "sent",
  message: "Sent. You will hear back at the address you gave.",
};
