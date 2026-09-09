import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { addBuddy, fetchBuddies, removeBuddy } from "@/lib/social/buddies";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

const bodySchema = z.object({ email: z.string().email() });

/** The signed-in member's buddy list: read it, add to it, take from it. */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "buddies", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    return NextResponse.json({ items: await fetchBuddies(me.email) }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read the buddy list.");
  }
}

async function change(request: Request, apply: (owner: string, buddy: string) => Promise<unknown>) {
  const me = await currentSession();
  if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
  const body = await readJson(request);
  if (body === undefined) return badRequest("Expected a JSON body.");
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return badRequest("Which member?");
  await apply(me.email, parsed.data.email);
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
