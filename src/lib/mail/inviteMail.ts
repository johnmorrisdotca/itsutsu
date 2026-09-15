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
 */
export function inviteMail(input: { to: string; inviterName: string; joinUrl: string; days: number }): OutgoingMail {
  const who = oneLine(input.inviterName).slice(0, NAME_LIMIT) || "A friend";
  return {
    to: input.to,
    subject: `${who} has invited you to play on Itsutsu`,
    text: [
      `${who} has invited you to Itsutsu, a site for turn-based board games — five in a row, Othello, Pente and more — played at your own pace.`,
      "",
      `Your invitation lets one person in and is good for ${input.days} days:`,
      input.joinUrl,
      "",
      `You are getting this because ${who} typed your address into Itsutsu to send it. Itsutsu has not saved your address, and will not write to you again unless somebody sends you another invitation.`,
      "",
      `Questions? Write to ${CONTACT_ADDRESS}.`,
    ].join("\n"),
  };
}
