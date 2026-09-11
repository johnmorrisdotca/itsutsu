import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchProfile, renameMember, updateProfile, type ProfileUpdate } from "@/lib/auth/members";
import { AWAY_DAYS_A_YEAR, setAway } from "@/lib/social/vacation";
import { PLAYER_SESSION_DAYS, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { PLAYER_NAME_MAX } from "@/lib/history/gameHistory.constants";
import { isKeepFinishedDays } from "@/lib/history/retention";
import { cleanDaysOff } from "@/lib/social/daysOff";
import { cleanAppearance } from "@/components/board/appearance";
import { cleanGameDefaults } from "@/components/game/gameDefaults";
import { overLimit } from "@/lib/api/rateLimit";
import { writePreferences } from "@/lib/preferences/memberPreferences";
import { acceptPreferences } from "@/lib/preferences/preferences";

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
  /** How long a finished game stays in their own list; only the offered windows. */
  keepFinishedDays: z
    .number()
    .int()
    .refine(isKeepFinishedDays, { message: "Not a length this site offers." })
    .optional(),
  /**
   * The days of the week they do not play. Cleaned rather than refused: an
   * unknown number is dropped, and all seven reads as none, because taking
   * every day off is a game that could never end rather than a preference.
   */
  daysOff: z.array(z.number().int()).max(7).optional(),
  /**
   * How they like a board dressed. Taken as anything and cleaned rather than
   * described twice: cleanAppearance already knows exactly which themes,
   * stone sets and grids exist, and a second list here would drift from it.
   */
  appearance: z.unknown().optional(),
  /** Where a new game starts for them. Cleaned here rather than described twice. */
  gameDefaults: z.unknown().optional(),
  /**
   * Standing choices kept in the registry (lib/preferences): how the players
   * page was last narrowed, and whatever comes next. Taken as anything and
   * checked there rather than described twice — but unlike the two columns
   * above, what the registry does not know is REFUSED, not dropped. A write
   * is somebody asking, and no is an answer they should hear.
   */
  preferences: z.unknown().optional(),
  /** ISO dates; both blank clears the range. */
  awayFrom: z.string().max(40).nullable().optional(),
  awayUntil: z.string().max(40).nullable().optional(),
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
    const tooMany = overLimit(request, "profile");
    if (tooMany !== null) return tooMany;

    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = nameSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "That name will not do.");

    const member = await fetchProfile(me.email);
    if (member === null) {
      return NextResponse.json({ error: "No profile yet: sign in with Google first." }, { status: 404, headers: NO_STORE });
    }
    const { name, awayFrom, awayUntil, preferences, ...rest } = parsed.data;
    /*
     * Checked before anything is written, so a change the registry refuses
     * refuses the whole request, by name, with nothing else in the body
     * half-applied by the time it does.
     */
    const kept = preferences === undefined ? null : acceptPreferences(preferences);
    if (kept !== null && !kept.ok) return badRequest(kept.problem);
    // Cleaned once, here, so nothing unusable ever reaches the column.
    const { appearance, gameDefaults, daysOff, ...plain } = rest;
    const profile: ProfileUpdate = {
      ...plain,
      ...(daysOff === undefined ? {} : { daysOff: cleanDaysOff(daysOff) }),
      ...(appearance === undefined ? {} : { appearance: cleanAppearance(appearance) }),
      ...(gameDefaults === undefined ? {} : { gameDefaults: cleanGameDefaults(gameDefaults) }),
    };
    if (awayFrom !== undefined || awayUntil !== undefined) {
      const from = awayFrom ? new Date(awayFrom) : null;
      const until = awayUntil ? new Date(awayUntil) : null;
      if ((from !== null && Number.isNaN(from.getTime())) || (until !== null && Number.isNaN(until.getTime()))) return badRequest("Those are not dates.");
      const away = await setAway(me.email, from, until);
      if (!away.ok) {
        return NextResponse.json(
          { error: away.reason === "allowance" ? `Only ${AWAY_DAYS_A_YEAR} away days a year; ${away.used} used.` : "The range must end after it starts." },
          { status: 409, headers: NO_STORE },
        );
      }
    }
    if (profile.timeZone !== undefined && !knownTimeZone(profile.timeZone)) return badRequest("Unknown time zone.");
    if (Object.keys(profile).length > 0) await updateProfile(me.email, profile);
    // Laid over what the row already holds — read once above, not again here.
    if (kept !== null) await writePreferences(me.email, member.preferences, kept.patch);

    let shown = me.name ?? "";
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    if (name !== undefined) {
      const member = await renameMember(me.email, name);
      if (member === null) {
        return NextResponse.json(
          { error: "That name is not free: somebody here goes by it, it is kept for a remembered player, or a record already stands under it." },
          { status: 409, headers: NO_STORE },
        );
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
