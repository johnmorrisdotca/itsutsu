import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n.types";
import { SITE_NAME } from "@/lib/i18n/siteName";

import { CONTACT_ADDRESS } from "./mail.constants";
import type { OutgoingMail } from "./mail.types";

/** Longest inviter's name put into a subject line. */
const NAME_LIMIT = 60;

/**
 * A name somebody chose, made safe for one line: every control character
 * (a line break included) becomes a space, runs of space become one. Compared
 * by code, so no control byte is ever written into this file.
 */
function oneLine(value: string): string {
  return [...value]
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? " " : char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The email a member sends a friend when they ask for an invitation to be
 * mailed. Plain text: the inviter's name is text somebody typed, and it goes
 * nowhere it could be read as markup.
 *
 * It says why it arrived and that nothing was kept, because it is going to
 * somebody who never asked the site for anything.
 *
 * WHAT LANGUAGE (ENJA-12). The friend has no account here, so there is no saved language to read, and the one thing
 * known about them is who wrote to them. So it is English, which every reader of this site can be asked to read,
 * unless the INVITER reads another language (`locale`, the language they are using the site in): then the email is
 * both, English first and theirs under it, so the friend gets the words their friend would have written and the
 * ones the site can be sure of. The subject is both too, joined with a slash. This is John's to change: it is a
 * decision for review, recorded in `docs/plans/en-ja-everywhere/ENJA-12-emails.md`.
 */
export function inviteMail(input: { to: string; inviterName: string; joinUrl: string; days: number; locale?: Locale }): OutgoingMail {
  const name = oneLine(input.inviterName).slice(0, NAME_LIMIT);
  const languages: Locale[] = input.locale === undefined || input.locale === DEFAULT_LOCALE ? [DEFAULT_LOCALE] : [DEFAULT_LOCALE, input.locale];
  const parts = languages.map((locale) => inviteIn(speaker(locale), name, input));
  return {
    to: input.to,
    subject: parts.map((part) => part.subject).join(" / "),
    text: parts.map((part) => part.text).join(`\n\n${DIVIDER}\n\n`),
  };
}

/** Between the two languages of one email: a line that is the same in both. */
const DIVIDER = "- - -";

function inviteIn(say: Speaker, name: string, input: { joinUrl: string; days: number }): { subject: string; text: string } {
  const who = name === "" ? say.say("mail.invite.aFriend") : say.say("mail.invite.named", { name });
  const vars = { who, site: SITE_NAME };
  return {
    subject: say.say("mail.invite.subject", vars),
    text: [
      say.say("mail.invite.lead", vars),
      "",
      say.say("mail.invite.valid", { days: String(input.days) }),
      input.joinUrl,
      "",
      say.say("mail.invite.why", vars),
      "",
      say.say("mail.questions", { address: CONTACT_ADDRESS }),
    ].join("\n"),
  };
}
