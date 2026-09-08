import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchIgnored, ignore, unignore } from "@/lib/social/ignores";

const bodySchema = z.object({ email: z.string().email() });

/** The signed-in member's ignore list: read it, add to it, take from it. */
export async function GET() {
  try {
    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    return NextResponse.json({ items: await fetchIgnored(me.email) }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read the ignore list.");
  }
}

async function change(request: Request, apply: (owner: string, target: string) => Promise<unknown>) {
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
    return await change(request, ignore);
  } catch (error) {
    console.error(error);
    return serverError("Could not ignore that member.");
  }
}

export async function DELETE(request: Request) {
  try {
    return await change(request, unignore);
  } catch (error) {
    console.error(error);
    return serverError("Could not change that.");
  }
}
