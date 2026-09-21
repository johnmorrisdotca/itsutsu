import { CONTACT_ADDRESS, SITE_ORIGIN } from "./mail.constants";
import type { NoticeEvent, OutgoingMail } from "./mail.types";

/**
 * The words of a game notice. Plain text, like every other email the site
 * sends: nothing a person typed is ever put into markup.
 *
 * IT LINKS TO YOUR GAMES, NOT TO THE GAME. A notice knows the game's id and
 * the seat, and not which game it is — and a game's own address is built from
 * its variant's slug (`gamePath` in `slugs.ts`), which is not in the event. A
 * link assembled out of what is to hand would be a guess at an address, and a
 * wrong one 404s from inside an email nobody can correct. Your games is where
 * a turn is found anyway: John's rule for this site is that nobody should ever
 * have to hunt for whose move it is.
 *
 * When a notice carries the variant, this is where the game's own address goes.
 */
export function noticeMail(event: NoticeEvent, to: string): OutgoingMail {
  const yourGames = `${SITE_ORIGIN}/play`;
  const footer = ["", `You are getting this because you play on Itsutsu. Questions? Write to ${CONTACT_ADDRESS}.`];

  if (event.kind === "your-turn") {
    return {
      to,
      subject: "It is your turn on Itsutsu",
      text: ["Somebody has moved, and the board is waiting for you.", "", yourGames, ...footer].join("\n"),
    };
  }

  const how =
    event.winner === null
      ? "Your game has ended in a draw."
      : event.winner === event.stone
        ? "Your game has finished, and you won."
        : "Your game has finished, and you lost.";
  return {
    to,
    subject: "Your game on Itsutsu has finished",
    text: [how, "", "The record is with your games:", yourGames, ...footer].join("\n"),
  };
}
