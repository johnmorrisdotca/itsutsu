import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { logOperatorAction, operatorActor } from "@/lib/auth/operatorLog";
import { removalConfirmed } from "@/lib/auth/removeAccountRules";
import { removalDetail, removeMember } from "@/lib/auth/removeMember";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  /** The member's name typed back, or the word for an account with none — the same rule the member meets. */
  confirm: z.string().max(200),
  blankSeats: z.boolean(),
  /** Why, in a line: "asked by email", "asked by a parent". Kept in the log, flattened and capped there. */
  reason: z.string().max(160).optional(),
});

/**
 * The operator removing somebody's account on request (PRIV-04): the same
 * `removeMember` the member's own Remove this account runs, with the act and
 * its log row in one transaction. `currentAdmin()`, and 404 for anybody else,
 * for the reason the sibling routes give: this acts on an account named in the
 * path, and knowing an id is not proof of anything.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/members/[id]/remove">) {
  try {
    const tooMany = overLimit(request, "member-remove");
    if (tooMany !== null) return tooMany;

    const me = await currentAdmin();
    if (me === null) return notFound();

    const { id } = await ctx.params;
    const body = bodySchema.safeParse(await readJson(request));
    if (!body.success) return badRequest("Say whether the name stays on their old games, and type the confirmation.");

    const member = await prisma.member.findUnique({ where: { id }, select: { name: true } });
    if (member === null) return notFound("No such member.");
    if (!removalConfirmed(body.data.confirm, member.name)) {
      return NextResponse.json(
        { error: "That is not what the box asks for, so nothing was removed.", reason: "not-confirmed" },
        { status: 422, headers: NO_STORE },
      );
    }

    const removal = await removeMember(id, { blankSeats: body.data.blankSeats, by: operatorActor(me), reason: body.data.reason });
    if (removal === null) return notFound("No such member.");
    logOperatorAction(me.email, `removed member ${id}: ${removalDetail(removal)}`);
    return NextResponse.json({ removal }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not remove that account; it may be only part way. Try again, and it finishes.");
  }
}
