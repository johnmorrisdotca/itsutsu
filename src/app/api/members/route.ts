import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { listMembers, renameMember, setBanned } from "@/lib/auth/members";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

/**
 * The members, for the operator alone.
 *
 * A non-operator gets 404 rather than 403, as the invites route does: the
 * page gives away nothing about existing.
 */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "members", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    if ((await currentAdmin()) === null) return notFound();
    return NextResponse.json({ items: await listMembers() }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read the members.");
  }
}

const changeSchema = z.union([
  z.object({ email: z.string().min(3).max(200), banned: z.boolean(), note: z.string().max(280).optional() }),
  z.object({ email: z.string().min(3).max(200), name: z.string().max(60) }),
]);

/**
 * Shuts an account, opens it again, or takes a name off one.
 *
 * A name is taken off rather than replaced: an abusive name should stop being
 * shown at once, and choosing a new one is the member's own business if they
 * come back.
 */
export async function PATCH(request: Request) {
  try {
    const tooMany = overLimit(request, "member-edit");
    if (tooMany !== null) return tooMany;

    if ((await currentAdmin()) === null) return notFound();

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) return badRequest("Say whether to shut the account, or what to call them.");

    if ("banned" in parsed.data) {
      const member = await setBanned(parsed.data.email, parsed.data.banned, parsed.data.note ?? "");
      if (member === null) return notFound("No such member.");
      return NextResponse.json(member, { headers: NO_STORE });
    }

    const renamed = await renameMember(parsed.data.email, parsed.data.name);
    if (renamed === null) return badRequest("That name is not free.");
    return NextResponse.json(renamed, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that member.");
  }
}
