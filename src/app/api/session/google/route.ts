import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { authOptions } from "@/lib/auth/google";
import { safeDestination } from "@/lib/auth/redirect";
import {
  ADMIN_SESSION_DAYS,
  SESSION_COOKIE,
  expiryInDays,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";

/**
 * Where a Google sign-in becomes a session this site understands.
 *
 * The gate in `proxy.ts` reads one signed cookie and knows nothing about
 * OAuth. Rather than teach it a second kind of credential, a completed Google
 * sign-in is exchanged here for the same cookie an invite code produces. One
 * thing to verify on every request, one thing to expire, one thing to revoke.
 *
 * The allowlist is checked again here even though the sign-in callback already
 * checked it, because removing an address from ADMIN_EMAILS should take effect
 * on the next visit rather than whenever a Google session happens to lapse.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = safeDestination(url.searchParams.get("next"));

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!isAdminEmail(email)) {
    const join = new URL("/join", url.origin);
    join.searchParams.set("error", "not-allowed");
    return NextResponse.redirect(join);
  }

  const token = await signSession({
    kind: "admin",
    email: email!.trim().toLowerCase(),
    exp: expiryInDays(ADMIN_SESSION_DAYS),
  });
  if (token === null) {
    return NextResponse.redirect(new URL("/join?error=no-secret", url.origin));
  }

  const response = NextResponse.redirect(new URL(destination, url.origin));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(ADMIN_SESSION_DAYS));
  return response;
}
