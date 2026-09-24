import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberRow, currentSession } from "@/lib/auth/currentSession";
import { removalConfirmed, signedInRecently } from "@/lib/auth/removeAccountRules";
import { removeMember } from "@/lib/auth/removeMember";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

const bodySchema = z.object({
  confirm: z.string().max(200),
  blankSeats: z.boolean(),
});

/**
 * A member removes their own account (PRIV-04): the name typed, the choice
 * about the name on old games, and for a Google account a sign-in within the
 * last few minutes. Then `removeMember`, and the session cookie goes with it,
 * so the next page is a stranger's. The games stay for the other players;
 * what goes is said on the Profile tab before the press and on the privacy
 * page.
 */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "write");
    if (tooMany !== null) return tooMany;

    const session = await currentSession();
    const row = await currentMemberRow();
    if (session === null || row === null) {
      return NextResponse.json({ error: "Sign in to remove your account." }, { status: 401, headers: NO_STORE });
    }
    const body = bodySchema.safeParse(await readJson(request));
    if (!body.success) return badRequest("Say whether your name stays on your old games, and type the confirmation.");

    if (!removalConfirmed(body.data.confirm, row.name)) {
      return NextResponse.json(
        { error: "That is not what the box asks for, so nothing was removed.", reason: "not-confirmed" },
        { status: 422, headers: NO_STORE },
      );
    }
    if (!signedInRecently(session)) {
      return NextResponse.json(
        { error: "Sign in with Google again first, so we know it is you asking.", reason: "sign-in-again" },
        { status: 409, headers: NO_STORE },
      );
    }

    const removal = await removeMember(row.id, { blankSeats: body.data.blankSeats });
    const response = NextResponse.json({ removed: removal !== null }, { headers: NO_STORE });
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
    return response;
  } catch (error) {
    console.error(error);
    return serverError("Your account could not be removed, and it may be only part way. Write to us and we will finish it.");
  }
}
