import { MAIL_CAPS } from "./mail.constants";
import type { MailLimit } from "./mail.types";

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
