import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentSession } from "@/lib/auth/currentSession";
import { mintInviteCode } from "@/lib/invite/inviteStore";

/** How long a friend has to use an invitation, and how many may. */
const INVITE_DAYS = 30;
const INVITE_USES = 1;

/**
 * An invitation from a member to a friend: one code, one use, a month to
 * take it. The code is tied to the member who issued it, so the operator can
 * see who let whom in.
 */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "invite", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;

    const me = await currentSession();
    if (!me?.email) {
      return NextResponse.json({ error: "Sign in to invite someone." }, { status: 401, headers: NO_STORE });
    }
    const invite = await mintInviteCode(me.email, {
      note: `from ${me.name || me.email}`,
      maxUses: INVITE_USES,
      expiresInDays: INVITE_DAYS,
    });
    return NextResponse.json({ code: invite.code }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not create an invitation.");
  }
}
