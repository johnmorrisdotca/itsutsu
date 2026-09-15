import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { getServerSession } from "next-auth";

import { isOperatorLogin } from "@/lib/auth/admin";
import { authOptions } from "@/lib/auth/google";
import { admitInviteMember, legacyInviteMemberId } from "@/lib/auth/inviteMember";
import { memberKeyOf } from "@/lib/auth/memberKey";
import { admitMember, findMember, foldEmail, isBanned, touchMember } from "@/lib/auth/members";
import { mayJoin } from "@/lib/site/site";
import { registrationMode } from "@/lib/site/siteStore";
import {
  ADMIN_SESSION_DAYS,
  PLAYER_SESSION_DAYS,
  SESSION_COOKIE,
  expiryInDays,
  sessionCookieOptions,
  signSession,
  verifySession,
  type Session,
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

const DAY_MS = 86_400_000;

/** This site's own session cookie off the request, or undefined. */
function cookieFrom(request: Request): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
}

/**
 * Who the caller is, for a page deciding what to show.
 *
 * AND WHERE AN INVITE COOKIE FROM BEFORE ACCOUNTS BECOMES ONE. A browser that
 * redeemed a code before a code made a member holds a session with no member in
 * it: signed in, and able to do little. Every page's account menu asks this route
 * who is here, so this is the first request such a browser makes that can both
 * write a member and hand back a cookie naming them. Its id is derived from the
 * cookie, so the two parts of a page that ask at once make one member, not two —
 * see `legacyInviteMemberId`. The cookie keeps the expiry it had.
 */
export async function GET(request: Request) {
  const cookie = cookieFrom(request);
  let session = await verifySession(cookie);
  let reissued: { token: string; days: number } | null = null;

  if (cookie !== undefined && session?.kind === "player" && !session.memberId && !session.email && session.code) {
    const code = session.code;
    const member = await legacyInviteMemberId(cookie)
      .then((id) => admitInviteMember(code, id))
      .catch((error: unknown) => {
        console.error("Could not make a member for an invite session.", error);
        return null;
      });
    if (member !== null) {
      session = { ...session, memberId: member.id, name: member.name };
      const token = await signSession(session);
      if (token !== null) {
        reissued = { token, days: Math.max(1, Math.ceil((session.exp * 1000 - Date.now()) / DAY_MS)) };
      }
    }
  }

  // Every page asks who is here; that is also how the site knows who is here.
  const key = memberKeyOf(session);
  if (key !== null) await touchMember(key.by, key.value).catch(() => undefined);
  const response = NextResponse.json(
    {
      signedIn: session !== null,
      admin: session?.kind === "admin",
      email: session?.email ?? null,
      name: session?.name ?? null,
      picture: session?.picture ?? null,
      /** Whether there is a member behind this session — by Google or by invite code alike. */
      member: key !== null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (reissued !== null) response.cookies.set(SESSION_COOKIE, reissued.token, sessionCookieOptions(reissued.days));
  return response;
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
    const tooMany = overLimit(request, `session:${parsed.data.kind}`, limit);
    if (tooMany !== null) return tooMany;

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

    /*
     * A code redeemed while a Google identity is waiting at the door makes
     * that address a member: from now on Google alone lets them in, on any
     * device. A code redeemed with no identity behind it makes a member too —
     * one with no address, whose way back in is this browser's cookie.
     *
     * Asked BEFORE the code is spent, so a door that is going to refuse does
     * not use up somebody's invitation doing it.
     */
    const google = await getServerSession(authOptions);
    const email = google?.user?.email ?? null;
    // A shut account is shut whatever code is presented at the door.
    if (email !== null && (await isBanned(email))) return refused();
    /*
     * The only other place a stranger becomes a member. A code IS the thing
     * `invite-only` asks for, so it passes; `closed` turns it away, because a
     * mode that let last week's code still make members would not be the mode
     * the panel says it is.
     *
     * Asked only of a stranger. An address already a member never reaches
     * the question — `admitMember` refreshes the row it finds — so no setting
     * here can shut out somebody already in. A code with no Google identity is
     * always a stranger: it is about to make a member.
     */
    const stranger = email === null || (await findMember(email)) === null;
    if (stranger && !mayJoin(await registrationMode(), true)) return refused();

    const redeemed = await redeemInviteCode(parsed.data.code);
    // Every failure answers identically: a guesser learns nothing from which.
    if (!redeemed.ok) return refused();

    if (email !== null) {
      const member = await admitMember({
        email,
        name: google?.user?.name ?? "",
        picture: google?.user?.image ?? "",
        invitedWith: redeemed.code,
      });
      return await grant(
        {
          kind: "player",
          email: foldEmail(member.email),
          memberId: member.id,
          name: member.name,
          picture: member.picture,
          code: redeemed.code,
          exp: expiryInDays(PLAYER_SESSION_DAYS),
        },
        PLAYER_SESSION_DAYS,
        member.created,
      );
    }

    const member = await admitInviteMember(redeemed.code);
    return await grant(
      { kind: "player", memberId: member.id, name: member.name, code: redeemed.code, exp: expiryInDays(PLAYER_SESSION_DAYS) },
      PLAYER_SESSION_DAYS,
      true,
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not sign in.");
  }
}

/**
 * Signing out. The site's cookie goes, and so do Google's session cookies,
 * so the next sign-in asks Google again rather than silently reusing the
 * last account — which matters on a shared phone.
 */
export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  for (const name of GOOGLE_COOKIES) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}

/** next-auth's own cookies, under both the plain and the secure-prefixed names. */
const GOOGLE_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

function refused(): NextResponse {
  return NextResponse.json(
    { error: "That code was not accepted." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * The cookie, and the answer the door reads. `welcome` says a member was just
 * made, so the door sends them to choose a name before anything else.
 */
async function grant(session: Session, days: number, welcome = false): Promise<NextResponse> {
  const token = await signSession(session);
  if (token === null) {
    // No AUTH_SECRET: refuse rather than hand out a session nothing can verify.
    return serverError("This deployment cannot issue sessions.");
  }

  const response = NextResponse.json(
    { signedIn: true, admin: session.kind === "admin", welcome },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(days));
  return response;
}
