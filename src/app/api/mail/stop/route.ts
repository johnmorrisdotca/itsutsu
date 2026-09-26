import { NextResponse } from "next/server";

import { NO_STORE, badRequest, notFound, serverError } from "@/lib/api/apiResponse";
import { isStopKind, stopPagePath, verifyStopToken } from "@/lib/mail/mailStop";
import { setMailWanted } from "@/lib/mail/mailStopWrite";

/**
 * WHERE A STOP IS RECORDED, with no sign-in: the token in the address is the
 * whole credential (`mailStop.ts`), checked again here as well as at the gate.
 *
 * Two callers, told apart by what they post:
 *
 * - A mail program's own "unsubscribe" (RFC 8058), which posts
 *   `List-Unsubscribe=One-Click` and nothing else. That stops the kind of
 *   email the token came with, and answers 200 with no page: the reader
 *   pressed a button in their mail, not on this site.
 * - The buttons on `/stop/<token>`: `what` (that kind, or `all`) and `on`
 *   (`1` to turn it back on). Plain HTML forms, so they work before — or
 *   without — any script, and the answer is the same page again, saying
 *   what was done.
 *
 * Only a POST writes. A GET of a link can be a mail scanner fetching it
 * ahead of the reader, and a way out that fired on a fetch would stop
 * somebody's email because their inbox looked at it.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const stop = await verifyStopToken(token);
    if (stop === null || token === null) return notFound("That link does not stop anything.");

    const form = await request.formData().catch(() => null);
    if (form === null) return badRequest("Expected a form.");

    if (form.get("List-Unsubscribe") === "One-Click") {
      if (!(await setMailWanted(stop.member, stop.mail, false))) return notFound("That link does not stop anything.");
      return new NextResponse("Stopped.", { status: 200, headers: NO_STORE });
    }

    // The token names one member and the kind it came with; it can say that kind, or all of it.
    const what = form.get("what");
    if (what !== "all" && !(isStopKind(what) && what === stop.mail)) return badRequest("Stop this kind of email, or all of it.");
    const on = form.get("on") === "1";
    if (!(await setMailWanted(stop.member, what, on))) return notFound("That link does not stop anything.");

    const back = new URL(stopPagePath(token), url);
    back.searchParams.set("done", `${what}-${on ? "on" : "off"}`);
    return NextResponse.redirect(back, { status: 303, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not record that. Please write to hello@itsutsu.com and it will be done by hand.");
  }
}
