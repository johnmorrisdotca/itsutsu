import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { renameMember } from "@/lib/auth/members";
import { countMembers, listMembers, setBanned } from "@/lib/auth/memberRoster";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

/** How many rows the operator's list carries at once. */
const MEMBERS_SHOWN = 200;

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

    const me = await currentAdmin();
    if (me === null) return notFound();
    /*
     * The total as well as the page. The list is cut at two hundred, and the
     * page was printing the length of what it had received as though it were
     * the number of members — so an operator with nine hundred members was
     * told, in the heading, that there were two hundred.
     */
    const [items, total] = await Promise.all([
      // Their own address, so their own row can be told from everybody else's.
      listMembers(MEMBERS_SHOWN, me.email ?? null),
      countMembers(),
    ]);
    return NextResponse.json({ items, total, shown: MEMBERS_SHOWN }, { headers: NO_STORE });
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

    const me = await currentAdmin();
    if (me === null) return notFound();

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) return badRequest("Say whether to shut the account, or what to call them.");

    if ("banned" in parsed.data) {
      /*
       * The operator does not shut their own account. Until now this answered
       * 200 and did nothing, because the operator check never read the ban;
       * now that it does, letting it through would be a single button that
       * locks the only operator out of the site with no way back in — the ban
       * is read on every request and the control that would undo it is behind
       * the door it just shut. An account authorised by ADMIN_EMAILS is shut
       * by changing that setting, which is a deliberate act elsewhere.
       */
      const target = parsed.data.email.trim().toLowerCase();
      if (parsed.data.banned && target === (me.email ?? "").trim().toLowerCase()) {
        return badRequest("You cannot shut your own account. An operator is named in the deployment, not in this list.");
      }
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
