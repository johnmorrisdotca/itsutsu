import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { sendMessage } from "@/lib/messages/messages";
import { MESSAGE_REFUSALS, MESSAGE_TEXT_MAX } from "@/lib/messages/messages.constants";

const NO_STORE = { "Cache-Control": "no-store" };

const bodySchema = z.object({
  to: z.string().min(3).max(64),
  text: z.string().min(1).max(MESSAGE_TEXT_MAX * 2),
});

/**
 * Sends a message to another member. Signed in, by member id; the rules —
 * who may write to whom, the ignore list in full — are `sendMessage`'s.
 */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "message", RATE_LIMITS.directMessage);
    if (tooMany !== null) return tooMany;
    const me = await currentMemberId();
    if (me === null) return NextResponse.json({ error: "Sign in to write to somebody." }, { status: 401, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("A message needs somebody to go to and something to say.");

    const sent = await sendMessage(me, parsed.data.to, parsed.data.text);
    if (!sent.ok) {
      const status = sent.reason === "no-such-member" ? 404 : sent.reason === "not-taking-messages" ? 403 : 422;
      return NextResponse.json({ error: MESSAGE_REFUSALS[sent.reason], reason: sent.reason }, { status, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not send that.");
  }
}
