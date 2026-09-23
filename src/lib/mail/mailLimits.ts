import { MAIL_CAPS } from "./mail.constants";
import type { MailLimit, MailSender } from "./mail.types";

/**
 * The counters one send must fit under, and the only place their keys are
 * spelled. Days and months are UTC, so every server instance agrees on which
 * row "today" is.
 *
 * ALWAYS IN THIS ORDER — the member, then the site's day, then its month.
 * The counter locks rows in the order it is given them, and two sends that
 * lock the same rows in the same order can wait on each other but never
 * deadlock.
 */
export function mailLimits(memberId: string, now: Date): MailLimit[] {
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  return [
    { key: `member:${memberId}:day:${day}`, cap: MAIL_CAPS.memberDay, refusal: "member-day-cap" },
    { key: `site:day:${day}`, cap: MAIL_CAPS.siteDay, refusal: "site-day-cap" },
    { key: `site:month:${month}`, cap: MAIL_CAPS.siteMonth, refusal: "site-month-cap" },
  ];
}

/**
 * THE CAPS ON A STRANGER'S INVITE REQUEST, IN FRONT OF THE SITE'S OWN.
 *
 * John, asking for the request form: "Also prevent spam bots making requests
 * and breaking my limits." A form anybody can reach is one a script can fill a
 * thousand times, and every fill that got through would be an email counted
 * against the fifty a day the whole site has — so a flood would refuse the
 * invitations members sent by hand. These caps come first, and they are small:
 *
 *   - one request a day FOR any one email address, so a script cannot repeat
 *     the same one, and a person pressing twice does not write twice;
 *   - `requestFromDay` a day FROM any one visitor address;
 *   - `requestSiteDay` a day from everybody together — the most a flood can
 *     ever take of the site's day, and of its month thirty times that.
 *
 * Counted in the database like every other send, so they hold across every
 * server instance, where the in-memory rate limit in front of them does not.
 * Same order as `mailLimits`, the narrow first and the site's day and month
 * last, so a request and a member's send lock shared rows in one order.
 */
export function inviteRequestLimits(sender: { from: string; address: string }, now: Date): MailLimit[] {
  const day = now.toISOString().slice(0, 10);
  const [, siteDay, siteMonth] = mailLimits("-", now);
  return [
    { key: `request:address:${sender.address}:day:${day}`, cap: 1, refusal: "request-repeat-cap" },
    { key: `request:from:${sender.from}:day:${day}`, cap: MAIL_CAPS.requestFromDay, refusal: "request-repeat-cap" },
    { key: `request:site:day:${day}`, cap: MAIL_CAPS.requestSiteDay, refusal: "request-day-cap" },
    siteDay,
    siteMonth,
  ];
}

/** The limits one send must fit under, whoever it is from. */
export function limitsFor(sender: MailSender, now: Date): MailLimit[] {
  return "memberId" in sender ? mailLimits(sender.memberId, now) : inviteRequestLimits(sender.inviteRequest, now);
}
