import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { claimRecord, previewClaim } from "@/lib/auth/claimRecord";
import { CLAIM_REFUSAL_COPY, claimDetail } from "@/lib/auth/claimRecord.constants";
import type { ClaimOutcome } from "@/lib/auth/claimRecord.types";
import { logOperatorAction, operatorActor } from "@/lib/auth/operatorLog";
import { currentAdmin } from "@/lib/auth/requireAdmin";

/**
 * The operator attaching a record kept under a name nobody had an account for
 * to the member named in the path. See `claimRecord.ts` for what a record is,
 * what moves, and the rule that decides.
 *
 * `currentAdmin()`, NOT `currentMemberId()`, for the reason the phrase route
 * gives: this acts on somebody ELSE's account, named in the path, so the only
 * question about the caller is whether they are the operator. Anybody else gets
 * 404, which gives away nothing about the route existing. A member can never
 * claim a record for themselves here — knowing a name, or an id, is not proof.
 *
 * ONE ADDRESS, TWO ANSWERS, told apart by `confirm`. Without it the route says
 * what a claim WOULD move and writes nothing, so the operator looks before
 * attaching; with it the claim is made. The name travels in the body both times
 * and never in the address, which is logged: an address is the one place on this
 * site a person's name is deliberately kept out of.
 */

/** The longest name the members list lets the operator set, and so the longest worth looking up. */
const NAME_MAX = 60;

const claimSchema = z.object({
  /** The name the games were played under, as the operator typed it. Folded before it is matched. */
  name: z.string().trim().min(1).max(NAME_MAX),
  /**
   * That the operator has seen what would move and says to attach it. Absent
   * means "show me first", and nothing is written.
   */
  confirm: z.literal(true).optional(),
});

/** The outcome as the modal reads it: what moved or would, or the refusal in a sentence and a word. */
function answer(outcome: ClaimOutcome): NextResponse {
  if (outcome.ok) return NextResponse.json({ member: outcome.member, plan: outcome.plan }, { headers: NO_STORE });
  if (outcome.reason === "no-member") return notFound(CLAIM_REFUSAL_COPY["no-member"]);
  return NextResponse.json(
    { error: CLAIM_REFUSAL_COPY[outcome.reason], reason: outcome.reason },
    { status: 422, headers: NO_STORE },
  );
}

export async function POST(request: Request, ctx: RouteContext<"/api/admin/members/[id]/claim">) {
  try {
    // The operator's ordinary write limit, in a bucket of its own.
    const tooMany = overLimit(request, "member-claim");
    if (tooMany !== null) return tooMany;

    const me = await currentAdmin();
    if (me === null) return notFound();

    const { id } = await ctx.params;
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) return badRequest(CLAIM_REFUSAL_COPY["no-name"]);

    if (parsed.data.confirm !== true) return answer(await previewClaim(parsed.data.name, id));

    // The claim and its row in the operator log are one transaction: see `claimRecord`.
    const outcome = await claimRecord({ name: parsed.data.name, memberId: id, by: operatorActor(me) });
    if (outcome.ok) logOperatorAction(me.email, `${claimDetail(outcome.plan)}, for member ${outcome.member.id}`);
    return answer(outcome);
  } catch (error) {
    console.error(error);
    return serverError("Could not attach that record.");
  }
}
