import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { currentMemberId } from "@/lib/auth/currentSession";
import { addBuddy, fetchBuddies, removeBuddy } from "@/lib/social/buddies";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

/**
 * Which member, BY ID. It was an address, which put buddies' addresses in the
 * markup of every row that offered one, and could not name a member who came in
 * with an invite code at all.
 */
const bodySchema = z.object({ memberId: z.string().trim().min(1).max(64) });

const SIGN_IN = NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });

/** The signed-in member's buddy list: read it, add to it, take from it. */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "buddies", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const mine = await currentMemberId();
    if (mine === null) return SIGN_IN.clone();
    return NextResponse.json({ items: await fetchBuddies(mine) }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read the buddy list.");
  }
}

async function change(request: Request, apply: (ownerId: string, buddyId: string) => Promise<unknown>) {
  const mine = await currentMemberId();
  if (mine === null) return SIGN_IN.clone();
  const body = await readJson(request);
  if (body === undefined) return badRequest("Expected a JSON body.");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return badRequest("Which member?");
  await apply(mine, parsed.data.memberId);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "buddies-keep");
    if (tooMany !== null) return tooMany;

    return await change(request, addBuddy);
  } catch (error) {
    console.error(error);
    return serverError("Could not add that buddy.");
  }
}

export async function DELETE(request: Request) {
  try {
    const tooMany = overLimit(request, "buddies-drop");
    if (tooMany !== null) return tooMany;

    return await change(request, removeBuddy);
  } catch (error) {
    console.error(error);
    return serverError("Could not remove that buddy.");
  }
}
