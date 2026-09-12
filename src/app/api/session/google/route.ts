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
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";
import { mayJoin } from "@/lib/site/site";
import { registrationMode } from "@/lib/site/siteStore";

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
  const tooMany = overLimit(request, "google-sign-in", RATE_LIMITS.read);
  if (tooMany !== null) return tooMany;

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

  /*
   * Known to Google, not yet to us. THIS IS THE SIGNUP DECISION, and the only
   * one on this route — every line above it is about an address the site has
   * already met, and none of them reads how signing up is set.
   *
   * `invite-only` sends them to the door to be asked for the code, exactly as
   * this route has always done. `closed` sends them to the door too, which then
   * says the site is not taking new members — a redirect rather than a refusal,
   * because the door is where the site explains itself and a bare 403 out of an
   * OAuth callback explains nothing to anybody. `open` falls through to the
   * ordinary path below, where `admitMember` creates the row and `created`
   * sends them on to choose a name: Google having proved the address was always
   * the whole of what the code stood in for here.
   *
   * The mode is only read when there is a decision to make. An address already
   * a member costs no query at all, which is nearly every sign-in.
   */
  const member = await findMember(email);
  if (member === null && !mayJoin(await registrationMode(), false)) {
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
