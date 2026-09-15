import type { MailRefusal } from "./mail.types";

/**
 * EMAIL THE SITE SENDS, and the numbers that keep it free.
 *
 * John, 2026-09-15: "I do not want ANY things that will cost the site extra
 * money". Sending goes through Resend's Free plan, and every cap below sits
 * under that plan's limits, so neither a bug nor a flood of clicks can move the
 * site onto a paid one. See docs/email.md.
 */

/**
 * Resend's Free plan, as read from resend.com/pricing on 2026-09-15: 3,000
 * emails a month, 100 a day, 3 domains, no card. Anything beyond it needs a
 * paid plan. Stated here so the caps can be checked against it by a test
 * rather than by memory.
 */
export const RESEND_FREE_PLAN = {
  perDay: 100,
  perMonth: 3_000,
  readOn: "2026-09-15",
} as const;

export const MAIL_CAPS = {
  /**
   * Emails the whole site may send in one UTC day: HALF of Resend's 100.
   *
   * Half, not all, for two reasons read on 2026-09-15. Resend's plan is per
   * ACCOUNT, and the same account may send for another of John's domains (the
   * plan allows three). And nothing says Resend's day starts at midnight UTC:
   * if its day straddles two of ours, fifty on each side is still a hundred,
   * never more.
   */
  siteDay: 50,
  /**
   * Emails the whole site may send in one UTC month: a third of Resend's
   * 3,000, read on 2026-09-15. Two of our months overlapping one of theirs
   * still stay under it, with the account's other domains left room.
   */
  siteMonth: 1_000,
  /**
   * Emails one member may cause in one UTC day. Nobody inviting friends by
   * hand needs more than five a day, and without it one person could use up
   * the whole site's day for everybody else.
   */
  memberDay: 5,
} as const;

/** The address the site sends from. Nothing is received there; replies go to `CONTACT_ADDRESS`. */
export const MAIL_FROM = "Itsutsu <noreply@itsutsu.com>";

/** The one public address, forwarded by Namecheap to John's own mailbox. Receiving needs no code. */
export const CONTACT_ADDRESS = "hello@itsutsu.com";

/**
 * The address a link in an email is written against. Mail is only ever sent
 * from production (`mailRefusalFor`), so this is never a preview's host or a
 * header somebody sent.
 */
export const SITE_ORIGIN = "https://itsutsu.com";

/** Resend's send endpoint: one POST per email, and no other call. */
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

/** How long one send may hold a function open. A slow provider must not become billed CPU. */
export const MAIL_TIMEOUT_MS = 10_000;

/**
 * What a person is told when an email they asked for was not sent. Each says
 * plainly that it did not go, and none pretends it did.
 */
export const MAIL_REFUSAL_TEXT: Record<MailRefusal, string> = {
  "not-production": "Email is not switched on here, so nothing was sent.",
  "no-key": "Email is not switched on here yet, so nothing was sent.",
  "member-day-cap": `You have sent as many emails as one person may in a day (${MAIL_CAPS.memberDay}), so this one was not sent. Try again tomorrow.`,
  "site-day-cap": "The site has sent all the email it allows itself today, so this one was not sent. Try again tomorrow.",
  "site-month-cap": "The site has sent all the email it allows itself this month, so this one was not sent.",
  "count-unavailable": "The email could not be sent just now, so nothing was sent.",
  "transport-error": "The email could not be confirmed as sent. It may not arrive.",
};
