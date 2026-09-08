import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { authOptions } from "@/lib/auth/google";
import { admitMember, findMember, foldEmail } from "@/lib/auth/members";
import { safeDestination } from "@/lib/auth/redirect";
import {
  ADMIN_SESSION_DAYS,
  PLAYER_SESSION_DAYS,
  SESSION_COOKIE,
  expiryInDays,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";

/**
 * Where a Google sign-in becomes a session this site understands.
 *
 * The gate in `proxy.ts` reads one signed cookie and knows nothing about
 * OAuth. A completed Google sign-in is exchanged here for the same cookie an
 * invite code produces — if the address is welcome. The operator's address
 * gets the operator's cookie; a member's gets a member's, carrying their name
 * and picture; anyone else is sent back to the door, where the Google identity
 * waits for the invite code that will make them a member.
 *
 * Both lists are consulted here on every sign-in rather than trusted from the
 * OAuth callback, so removing somebody takes effect on their next visit.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = safeDestination(url.searchParams.get("next"));

  const google = await getServerSession(authOptions);
  const email = google?.user?.email;
  if (!email) return NextResponse.redirect(new URL("/join", url.origin));
  const name = google?.user?.name ?? "";
  const picture = google?.user?.image ?? "";

  if (isAdminEmail(email)) {
    // The operator is a member too: listed, with a profile, like everyone else.
    await admitMember({ email, name, picture });
    return grant(
      { kind: "admin", email: foldEmail(email), name, picture, exp: expiryInDays(ADMIN_SESSION_DAYS) },
      ADMIN_SESSION_DAYS,
      destination,
      url.origin,
    );
  }

  const member = await findMember(email);
  if (member === null) {
    // Known to Google, not yet to us: the door will ask for the invite code.
    const join = new URL("/join", url.origin);
    if (destination !== "/") join.searchParams.set("next", destination);
    return NextResponse.redirect(join);
  }

  const admitted = await admitMember({ email, name, picture });
  // The first visit is the registration: choose the name other players will see.
  const welcome = `/me?welcome=1&next=${encodeURIComponent(destination)}`;
  return grant(
    { kind: "player", email: foldEmail(email), name: admitted.name, picture, exp: expiryInDays(PLAYER_SESSION_DAYS) },
    PLAYER_SESSION_DAYS,
    admitted.created ? welcome : destination,
    url.origin,
  );
}

async function grant(
  session: Parameters<typeof signSession>[0],
  days: number,
  destination: string,
  origin: string,
): Promise<NextResponse> {
  const token = await signSession(session);
  if (token === null) {
    return NextResponse.redirect(new URL("/join?error=no-secret", origin));
  }
  const response = NextResponse.redirect(new URL(destination, origin));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(days));
  return response;
}
