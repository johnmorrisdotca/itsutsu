import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/api/rateLimit";
import { isOperatorLogin } from "@/lib/auth/admin";
import {
  ADMIN_SESSION_DAYS,
  PLAYER_SESSION_DAYS,
  SESSION_COOKIE,
  expiryInDays,
  sessionCookieOptions,
  signSession,
  verifySession,
} from "@/lib/auth/session";
import { redeemInviteCode } from "@/lib/invite/inviteStore";

/**
 * Getting in, and finding out whether you already are.
 *
 * Two ways in, and both end the same way: a signed cookie. The invite phrase
 * and the operator token are each exchanged exactly once, so neither has to
 * be presented again or stored anywhere by the client.
 */
const signInSchema = z.union([
  z.object({ kind: z.literal("invite"), code: z.string().min(1).max(120) }),
  z.object({
    kind: z.literal("admin"),
    email: z.string().min(3).max(200),
    token: z.string().min(1).max(300),
  }),
]);

/** Who the caller is, for a page deciding what to show. */
export async function GET(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  const session = await verifySession(cookie);
  return NextResponse.json(
    {
      signedIn: session !== null,
      admin: session?.kind === "admin",
      email: session?.email ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = signInSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid sign-in.");

    /*
     * Rate limited hard, and keyed per address rather than per code, because
     * this is the endpoint a guesser would hammer. Three ordinary words is a
     * small keyspace; five tries a minute is what keeps it a safe one.
     */
    const limit =
      parsed.data.kind === "admin" ? RATE_LIMITS.adminSignIn : RATE_LIMITS.redeemCode;
    // Keyed per kind as well as per address, so the two limits stay separate
    // rather than sharing one counter with two different ceilings.
    const result = checkRateLimit(
      `session:${parsed.data.kind}:${getClientIp(request)}`,
      limit,
    );
    if (!result.allowed) return createRateLimitResponse(result);

    if (parsed.data.kind === "admin") {
      if (!isOperatorLogin(parsed.data.email, parsed.data.token)) {
        return refused();
      }
      return await grant(
        {
          kind: "admin",
          email: parsed.data.email.trim().toLowerCase(),
          exp: expiryInDays(ADMIN_SESSION_DAYS),
        },
        ADMIN_SESSION_DAYS,
      );
    }

    const redeemed = await redeemInviteCode(parsed.data.code);
    // Every failure answers identically: a guesser learns nothing from which.
    if (!redeemed.ok) return refused();

    return await grant(
      { kind: "player", code: redeemed.code, exp: expiryInDays(PLAYER_SESSION_DAYS) },
      PLAYER_SESSION_DAYS,
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not sign in.");
  }
}

/** Signing out. Clearing the cookie is the whole of it. */
export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}

function refused(): NextResponse {
  return NextResponse.json(
    { error: "That code was not accepted." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

async function grant(
  session: Parameters<typeof signSession>[0],
  days: number,
): Promise<NextResponse> {
  const token = await signSession(session);
  if (token === null) {
    // No AUTH_SECRET: refuse rather than hand out a session nothing can verify.
    return serverError("This deployment cannot issue sessions.");
  }

  const response = NextResponse.json(
    { signedIn: true, admin: session.kind === "admin" },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(days));
  return response;
}
