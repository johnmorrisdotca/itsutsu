import type { PhraseKey } from "../i18n/i18n.constants";

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
  /**
   * Invite requests from one visitor address in one UTC day. Two, not one: a
   * household shares an address, and a second person asking is not spam.
   */
  requestFromDay: 2,
  /**
   * Invite requests the whole site will send in one UTC day, from everybody.
   * The ceiling on what a flood can cost: five of the site's fifty a day, and a
   * hundred and fifty of its thousand a month at the very worst. A real
   * visitor past it is told to write to `CONTACT_ADDRESS` themselves.
   */
  requestSiteDay: 5,
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

/*
 * Game notices are switched on and off by the operator, on Admin's site panel
 * (`gameEmails` in `site.constants.ts`, read by `gameEmailsOn`), where the
 * reasoning that used to live here is written beside the switch.
 */

/**
 * What a person is told when an email they asked for was not sent, as the phrase that says it (`mail.refusal.*`).
 * Each says plainly that it did not go, and none pretends it did. `mailRefusalText` (`mailWords.ts`) says it in
 * the reader's language; the word `{limit}` is `MAIL_CAPS.memberDay` and `{address}` is `CONTACT_ADDRESS`.
 */
export const MAIL_REFUSAL_PHRASE: Record<MailRefusal, PhraseKey> = {
  "not-production": "mail.refusal.notProduction",
  "no-key": "mail.refusal.noKey",
  "member-day-cap": "mail.refusal.memberDayCap",
  "site-day-cap": "mail.refusal.siteDayCap",
  "request-repeat-cap": "mail.refusal.requestRepeatCap",
  "request-day-cap": "mail.refusal.requestDayCap",
  "site-month-cap": "mail.refusal.siteMonthCap",
  "count-unavailable": "mail.refusal.countUnavailable",
  "transport-error": "mail.refusal.transportError",
  "notices-off": "mail.refusal.noticesOff",
  "no-address": "mail.refusal.noAddress",
  "no-stop-link": "mail.refusal.noStopLink",
  "to-a-child": "mail.refusal.toAChild",
};
