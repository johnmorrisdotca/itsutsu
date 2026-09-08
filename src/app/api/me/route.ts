import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchProfile, renameMember, updateProfile } from "@/lib/auth/members";
import { PLAYER_SESSION_DAYS, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { PLAYER_NAME_MAX } from "@/lib/history/gameHistory.constants";

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least two characters.")
    .max(PLAYER_NAME_MAX)
    .regex(/^[^\s<>\/\\]+(?: [^\s<>\/\\]+)*$/, "Letters, numbers and single spaces.")
    .optional(),
  city: z.string().trim().max(60).optional(),
  country: z.string().trim().max(60).optional(),
  timeZone: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(500).optional(),
  showOnline: z.boolean().optional(),
  emailNotify: z.boolean().optional(),
});

/** A time zone the platform knows, or blank. Anything else is refused rather than stored. */
function knownTimeZone(zone: string): boolean {
  if (zone === "") return true;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Changes the signed-in member's display name. The name is what other
 * players see and what the record is kept under, so it must be theirs alone.
 * The session cookie is minted again so the header shows the new name at once.
 */
export async function PATCH(request: Request) {
  try {
    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = nameSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "That name will not do.");

    if ((await fetchProfile(me.email)) === null) {
      return NextResponse.json({ error: "No profile yet: sign in with Google first." }, { status: 404, headers: NO_STORE });
    }
    const { name, ...profile } = parsed.data;
    if (profile.timeZone !== undefined && !knownTimeZone(profile.timeZone)) return badRequest("Unknown time zone.");
    if (Object.keys(profile).length > 0) await updateProfile(me.email, profile);

    let shown = me.name ?? "";
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    if (name !== undefined) {
      const member = await renameMember(me.email, name);
      if (member === null) {
        return NextResponse.json({ error: "Someone here already has that name." }, { status: 409, headers: NO_STORE });
      }
      shown = member.name;
      const token = await signSession({ ...me, name: member.name });
      if (token !== null) response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(PLAYER_SESSION_DAYS));
    }
    return NextResponse.json({ ok: true, name: shown }, { headers: response.headers });
  } catch (error) {
    console.error(error);
    return serverError("Could not change the name.");
  }
}
