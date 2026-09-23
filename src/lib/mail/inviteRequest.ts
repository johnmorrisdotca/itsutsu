import "server-only";

import { createHmac } from "node:crypto";

import { CONTACT_ADDRESS } from "./mail.constants";
import type { OutgoingMail, SendDeps, SendOutcome } from "./mail.types";
import { sendMail } from "./sendMail";

/**
 * A VISITOR WITH NO INVITE, ASKING FOR ONE.
 *
 * Reading is open and playing needs an invitation, and until now the only
 * person who could not start was somebody who arrived knowing nobody: /join
 * offered "I have an invite" and no way to ask. John, 2026-09-22: "Request an
 * invite sends me an email using the email service." So it does — to
 * `CONTACT_ADDRESS`, which forwards to him, with Reply-To set to the visitor
 * so answering is pressing Reply.
 *
 * AND IT MUST NOT BE A WAY TO SPEND HIS LIMITS. "Also prevent spam bots making
 * requests and breaking my limits." A form anybody can reach is one a script
 * can fill without end. The defences, cheapest first, none of them a service:
 *
 *   1. a field no person sees (`INVITE_REQUEST.trap`) — filled, it was a bot;
 *   2. a signed stamp of when the form was drawn — too quick, it was a bot;
 *      too old, or not ours, it was a replay (`inviteRequestStamp.ts`);
 *   3. no links in the message, which is where spam's value is;
 *   4. a strict per-address rate limit in front of the action;
 *   5. caps of their own in the mail counter — one a day per email typed, two
 *      a day from one visitor address, five a day for the whole site — so the
 *      worst a flood can do is five of the site's fifty emails a day
 *      (`inviteRequestLimits`).
 *
 * A bot caught by 1 or 2 is told it succeeded. Telling it why is teaching it.
 * A person caught by 3, 4 or 5 is told plainly what to do instead.
 */

export const INVITE_REQUEST = {
  /** The field nobody sees. Named like something a form-filler would fill. */
  trap: "website",
  /** The longest email address taken, which is the standard's own limit. */
  emailLength: 254,
  nameLength: 80,
  /** What they say about themselves: enough for a sentence or two, and no essay. */
  aboutLength: 500,
} as const;

/** A request a person wrote, read and checked. */
export type InviteRequest = { email: string; name: string; about: string };

/** What reading a submitted form came to. */
export type InviteRequestReading =
  | { kind: "request"; request: InviteRequest }
  /** Said to the person, who can fix it. */
  | { kind: "problem"; problem: string }
  /** A bot: answered as though it had worked, and nothing is sent. */
  | { kind: "bot" };

/** Deliberately loose: one @, something either side, a dot in the domain, no spaces. The provider is the real judge. */
const LOOKS_LIKE_AN_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A link: a scheme, or www. Deliberately NOT a bare domain — the people most
 * likely to ask are ones who played on ItsYourTurn.com or GoldToken, and "I
 * played on itsyourturn.com for years" is exactly the sentence this form wants.
 */
const HAS_A_LINK = /(https?:\/\/|www\.)/i;

/** A value from the form, as text, trimmed. A missing field and a file both read as nothing. */
function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Text somebody typed, made safe for an email: control characters other than
 * line breaks become spaces. Compared by code, so no control byte is written
 * into this file.
 */
function plain(value: string, keepLines: boolean): string {
  return [...value]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (keepLines && char === "\n") return char;
      return code < 32 || code === 127 ? " " : char;
    })
    .join("")
    .replace(keepLines ? /[ \t]+/g : /\s+/g, " ")
    .trim();
}

/** The form, read: a request, a problem the person can fix, or a bot. */
export function readInviteRequest(form: FormData): InviteRequestReading {
  if (field(form, INVITE_REQUEST.trap) !== "") return { kind: "bot" };

  const email = field(form, "email").toLowerCase();
  const name = plain(field(form, "name"), false);
  const about = plain(field(form, "about"), true);

  if (email === "" || email.length > INVITE_REQUEST.emailLength || !LOOKS_LIKE_AN_ADDRESS.test(email)) {
    return { kind: "problem", problem: "Please give an email address we can answer you at." };
  }
  if (name.length > INVITE_REQUEST.nameLength) {
    return { kind: "problem", problem: `Please keep your name under ${INVITE_REQUEST.nameLength} characters.` };
  }
  if (about.length > INVITE_REQUEST.aboutLength) {
    return { kind: "problem", problem: `Please keep it under ${INVITE_REQUEST.aboutLength} characters.` };
  }
  if (HAS_A_LINK.test(about) || HAS_A_LINK.test(name)) {
    return { kind: "problem", problem: "Please leave links out — a sentence about who you are is plenty." };
  }
  return { kind: "request", request: { email, name, about } };
}

/** The email John receives. Plain text, and everything the visitor typed is only ever text in it. */
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

/**
 * A keyed hash, for a counter's key: stable for one value, unreadable, and not
 * something a list of addresses can be run against without the secret. The
 * counter needs to know that the same visitor asked twice, never who they are.
 */
function counted(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url").slice(0, 22);
}

/**
 * Sends one request, under the caps in `inviteRequestLimits`. `from` is the
 * visitor's network address, only ever hashed.
 */
export async function sendInviteRequest(
  request: InviteRequest,
  from: string,
  deps: SendDeps & { secret?: string } = {},
): Promise<SendOutcome> {
  const secret = deps.secret ?? process.env.AUTH_SECRET ?? "";
  return sendMail(
    inviteRequestMail(request),
    { inviteRequest: { from: counted(from, secret), address: counted(request.email, secret) } },
    deps,
  );
}
