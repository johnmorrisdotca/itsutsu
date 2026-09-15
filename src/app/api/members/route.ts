import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { currentMemberId } from "@/lib/auth/currentSession";
import { operatorActor } from "@/lib/auth/operatorLog";
import { renameMember } from "@/lib/auth/members";
import { countMembers, listMembers, memberSummaryFor, setBanned } from "@/lib/auth/memberRoster";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";
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
      /*
       * Their own member id, so their own row can be told from everybody
       * else's. It was their address, compared against each row's — a question
       * about who somebody is, which the site answers by id. Whether they MAY
       * see this list is still the address, through `currentAdmin` above: the
       * operator is named by address in the deployment, and that is not an
       * identity check but an allowlist.
       */
      listMembers(MEMBERS_SHOWN, await currentMemberId()),
      countMembers(),
    ]);
    /*
     * The programs counted apart from the people, because the operator's page
     * shows them on two tabs now and a heading that says "207 members" over a
     * list of two hundred people is the same fault the total was added to fix,
     * one category along.
     *
     * FREE, AND THAT IS WHY IT IS DONE HERE. `listMembers` already fetches
     * every computer player unconditionally — they are the rows that must
     * survive the cap — so this is a filter over a list in hand rather than a
     * query. `total` counts every row in the table, and every bot row is in
     * `items` by that guarantee, so `total - robots` is exactly the people.
     */
    const robots = items.filter((one) => one.kind === MEMBER_KINDS.robot).length;
    return NextResponse.json(
      { items, total, people: total - robots, robots, shown: MEMBERS_SHOWN },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not read the members.");
  }
}

/**
 * Which member, BY ID. It was their address, which a member who came in with an
 * invite code does not have — so the operator could neither shut such an account
 * nor take an abusive name off it. Whether the CALLER may do this at all is still
 * the address, through `currentAdmin`: the operator is named in the deployment.
 */
const changeSchema = z.union([
  z.object({ id: z.string().min(1).max(64), banned: z.boolean(), note: z.string().max(280).optional() }),
  z.object({ id: z.string().min(1).max(64), name: z.string().max(60) }),
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
       *
       * Their own row by id where the operator has one, and by address as well,
       * since an operator signed in by token may have no member row to compare.
       */
      const target = await memberSummaryFor(parsed.data.id);
      if (target === null) return notFound("No such member.");
      const operatorAddress = (me.email ?? "").trim().toLowerCase();
      const theirOwn =
        parsed.data.id === (await currentMemberId()) ||
        (target.email !== null && operatorAddress !== "" && target.email.trim().toLowerCase() === operatorAddress);
      if (parsed.data.banned && theirOwn) {
        return badRequest("You cannot shut your own account. An operator is named in the deployment, not in this list.");
      }
      // Kept in the operator log, in the same transaction as the ban itself: see `setBanned`.
      const member = await setBanned(parsed.data.id, parsed.data.banned, parsed.data.note ?? "", operatorActor(me));
      if (member === null) return notFound("No such member.");
      return NextResponse.json(member, { headers: NO_STORE });
    }

    // Kept in the operator log, in the same transaction as the rename: see `renameMember`.
    const renamed = await renameMember(parsed.data.id, parsed.data.name, operatorActor(me));
    if (renamed === null) return badRequest("That name is not free.");
    return NextResponse.json(renamed, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that member.");
  }
}
