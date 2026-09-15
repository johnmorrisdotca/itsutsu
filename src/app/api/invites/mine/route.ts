import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentEmail, currentMemberRow } from "@/lib/auth/currentSession";
import { mintInviteCode } from "@/lib/invite/inviteStore";
import { inviteMail } from "@/lib/mail/inviteMail";
import { MAIL_REFUSAL_TEXT, SITE_ORIGIN } from "@/lib/mail/mail.constants";
import { sendMail } from "@/lib/mail/sendMail";

/** How long a friend has to use an invitation, and how many may. */
const INVITE_DAYS = 30;
const INVITE_USES = 1;

/**
 * Optionally, the friend's address, for the site to email the invitation to.
 * Used for that one email and then forgotten: it is not stored, not logged and
 * not echoed back.
 */
const inviteSchema = z.object({
  sendTo: z.string().trim().max(254).email().optional(),
});

/**
 * An invitation from a member to a friend: one code, one use, a month to
 * take it. The code is tied to the member who issued it, so the operator can
 * see who let whom in.
 *
 * ANY MEMBER, and a member who came in with an invite code is one — somebody
 * John let in can bring a friend the same way they were brought. `createdBy`
 * says who: the address where there is one, as it always has, and `member:<id>`
 * where there is not, which reads as what it is rather than passing an id off as
 * an address.
 *
 * WITH `sendTo`, the site emails it too — the first email the site sends, and
 * it is this one because it is the one a person asks for with a click, to one
 * address, with a link in it that is useless to anybody else. The code is made
 * either way, so when the email is refused (a cap, no key) the member is told
 * why and still has the link to send themselves.
 */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "invite", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;

    const [row, email] = await Promise.all([currentMemberRow(), currentEmail()]);
    if (row === null) {
      return NextResponse.json({ error: "Sign in to invite someone." }, { status: 401, headers: NO_STORE });
    }

    const body = await readJson(request);
    const parsed = inviteSchema.safeParse(body ?? {});
    if (!parsed.success) return badRequest("That does not look like an email address.");
    const sendTo = parsed.data.sendTo;

    const invite = await mintInviteCode(email ?? `member:${row.id}`, {
      note: `from ${row.name || email || row.id}`,
      maxUses: INVITE_USES,
      expiresInDays: INVITE_DAYS,
    });
    if (sendTo === undefined) {
      return NextResponse.json({ code: invite.code }, { status: 201, headers: NO_STORE });
    }

    const outcome = await sendMail(
      inviteMail({
        to: sendTo,
        // The name they go by here, never their address: this goes to somebody else.
        inviterName: row.name,
        joinUrl: `${SITE_ORIGIN}/join?code=${encodeURIComponent(invite.code)}`,
        days: INVITE_DAYS,
      }),
      { memberId: row.id },
    );
    return NextResponse.json(
      {
        code: invite.code,
        emailed: outcome.sent,
        notice: outcome.sent ? null : MAIL_REFUSAL_TEXT[outcome.refusal],
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not create an invitation.");
  }
}
