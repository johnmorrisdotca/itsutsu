import { CONTACT_ADDRESS } from "./mail.constants";
import type { InviteRequest } from "./inviteRequest";
import type { OutgoingMail } from "./mail.types";

/**
 * THE EMAIL THE OPERATOR RECEIVES when a visitor asks for an invitation, by decision in English.
 *
 * It goes to `CONTACT_ADDRESS`, which forwards to one person, so it is read by one person, like Admin: the
 * operator's own pages and routes are English (`EXCLUDED_PATHS` in `scripts/check-i18n-strings.mjs`), and so is
 * this. Everything the VISITOR reads (the problem a form reports, the refusals, the confirmation) is a phrase.
 * A file of its own so that the one allowance covers this email and nothing else in the mail folder. Plain text, and
 * everything the visitor typed is only ever text in it.
 */
export function inviteRequestMail(request: InviteRequest): OutgoingMail {
  const who = request.name === "" ? request.email : `${request.name} (${request.email})`;
  return {
    to: CONTACT_ADDRESS,
    replyTo: request.email,
    subject: `Invite request from ${request.name === "" ? request.email : request.name}`,
    text: [
      `${who} asked for an invitation to Itsutsu, from the join page.`,
      "",
      request.about === "" ? "They said nothing more." : `What they said:\n\n${request.about}`,
      "",
      "Reply to this email to answer them — it goes to the address they gave. To let them in, send an invitation from your own page on the site, or mint a code from Admin.",
      "",
      "Nothing about this request was saved by the site.",
    ].join("\n"),
  };
}

