import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { currentMemberId } from "@/lib/auth/currentSession";
import { fetchIgnored, ignore, unignore } from "@/lib/social/ignores";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

/** Which member, BY ID — see `/api/buddies`, which says why it is no longer an address. */
const bodySchema = z.object({ memberId: z.string().trim().min(1).max(64) });

const SIGN_IN = NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });

/** The signed-in member's ignore list: read it, add to it, take from it. */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "ignores", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const mine = await currentMemberId();
    if (mine === null) return SIGN_IN.clone();
    return NextResponse.json({ items: await fetchIgnored(mine) }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read the ignore list.");
  }
}

async function change(request: Request, apply: (ownerId: string, targetId: string) => Promise<unknown>) {
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
    const tooMany = overLimit(request, "ignore-add");
    if (tooMany !== null) return tooMany;

    return await change(request, ignore);
  } catch (error) {
    console.error(error);
    return serverError("Could not ignore that member.");
  }
}

export async function DELETE(request: Request) {
  try {
    const tooMany = overLimit(request, "ignore-drop");
    if (tooMany !== null) return tooMany;

    return await change(request, unignore);
  } catch (error) {
    console.error(error);
    return serverError("Could not change that.");
  }
}
