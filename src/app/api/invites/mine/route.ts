import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentEmail, currentMemberRow } from "@/lib/auth/currentSession";
import { mintInviteCode } from "@/lib/invite/inviteStore";

/** How long a friend has to use an invitation, and how many may. */
const INVITE_DAYS = 30;
const INVITE_USES = 1;

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
 */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "invite", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;

    const [row, email] = await Promise.all([currentMemberRow(), currentEmail()]);
    if (row === null) {
      return NextResponse.json({ error: "Sign in to invite someone." }, { status: 401, headers: NO_STORE });
    }
    const invite = await mintInviteCode(email ?? `member:${row.id}`, {
      note: `from ${row.name || email || row.id}`,
      maxUses: INVITE_USES,
      expiresInDays: INVITE_DAYS,
    });
    return NextResponse.json({ code: invite.code }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not create an invitation.");
  }
}
