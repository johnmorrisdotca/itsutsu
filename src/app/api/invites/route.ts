import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { listInviteCodes, mintInviteCode } from "@/lib/invite/inviteStore";

/**
 * Invite codes, for the operator only.
 *
 * A non-operator gets 404 rather than 403, so the route gives away nothing
 * about its own existence — the same choice the delete route makes.
 */
const mintSchema = z.object({
  note: z.string().max(120).optional(),
  maxUses: z.coerce.number().int().min(0).max(1000).default(0),
  expiresInDays: z.coerce.number().int().min(0).max(365).default(0),
});

export async function GET() {
  try {
    if ((await currentAdmin()) === null) return notFound();
    return NextResponse.json(
      { items: await listInviteCodes() },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not load invite codes.");
  }
}

export async function POST(request: Request) {
  try {
    const admin = await currentAdmin();
    if (admin === null) return notFound();

    const body = (await readJson(request)) ?? {};
    const parsed = mintSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid invite options.");

    const invite = await mintInviteCode(admin.email ?? "operator", parsed.data);
    return NextResponse.json(invite, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not create an invite code.");
  }
}
