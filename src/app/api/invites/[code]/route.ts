import { NextResponse } from "next/server";

import { NO_STORE, notFound, serverError } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { revokeInviteCode } from "@/lib/invite/inviteStore";
import { overLimit } from "@/lib/api/rateLimit";

/** Revokes a code immediately. Operator only, and 404 to anyone else. */
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/invites/[code]">,
) {
  try {
    const tooMany = overLimit(request, "invite-revoke");
    if (tooMany !== null) return tooMany;

    if ((await currentAdmin()) === null) return notFound();

    const { code } = await ctx.params;
    if (!(await revokeInviteCode(decodeURIComponent(code)))) {
      return notFound("No such invite code.");
    }
    return new NextResponse(null, { status: 204, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not revoke that invite code.");
  }
}
