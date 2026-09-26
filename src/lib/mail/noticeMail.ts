import { reasonOf, scoreWords } from "@/components/history/resultWords";
import { STONE_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { matchPath, setUpLink } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { shownName } from "@/lib/rating/shownName";

import { CONTACT_ADDRESS, SITE_ORIGIN } from "./mail.constants";
import type { GameOverSummary, NoticeEvent, OutgoingMail } from "./mail.types";
import { MAIL_KINDS } from "./mailStop";

/**
 * The words of a game notice. Plain text, like every other email the site
 * sends: nothing a person typed is ever put into markup.
 *
 * A YOUR-TURN NOTICE LINKS TO YOUR GAMES, NOT TO THE GAME. It knows the game's
 * id and the seat, and not which game it is — and a game's own address is
 * built from its variant's slug (`gamePath` in `slugs.ts`), which is not in the
 * event. A link assembled out of what is to hand would be a guess at an
 * address, and a wrong one 404s from inside an email nobody can correct. Your
 * games is where a turn is found anyway: John's rule for this site is that
 * nobody should ever have to hunt for whose move it is.
 *
 * A GAME-OVER NOTICE SAYS THE GAME, when it could be read (`GameOverSummary`):
 * who won and why in the result card's own words, the score where the game
 * keeps one, how long it took, what it did to the reader's rating, and links
 * to the final position and to playing again. Where the game could not be
 * read it says only how it went for them, which the event alone knows —
 * never a sentence made up to fill the gap.
 */
export function noticeMail(event: NoticeEvent, to: string, summary: GameOverSummary | null, stopUrl: string): OutgoingMail {
  const yourGames = `${SITE_ORIGIN}/play`;
  const footer = [
    "",
    `You are getting this because you play on Itsutsu. Questions? Write to ${CONTACT_ADDRESS}.`,
    // Every email says how to stop getting it (`mailStop.ts`): this kind, or all of them, with no sign-in.
    `To stop ${MAIL_KINDS[event.kind].words}, or any email from Itsutsu:`,
    stopUrl,
  ];

  if (event.kind === "your-turn") {
    return {
      to,
      subject: "It is your turn on Itsutsu",
      text: ["Somebody has moved, and the board is waiting for you.", "", yourGames, ...footer].join("\n"),
    };
  }

  if (summary !== null && summary.gameId === event.gameId) {
    const words = gameOverWords(summary, event.stone);
    return { to, subject: words.subject, text: [words.text, "", "Your games:", yourGames, ...footer].join("\n") };
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

/** A finished game told to the person who sat at `stone`: the subject, and the body above the footer. */
export function gameOverWords(summary: GameOverSummary, stone: Stone): { subject: string; text: string } {
  const other: Stone = stone === STONES.black ? STONES.white : STONES.black;
  const opponent = shownName(summary.names[other]).trim() || STONE_DISPLAY[other].label;
  const game = variantLabel(summary.variant);
  const winner = summary.facts.winner;
  const outcome = winner === null ? "draw" : winner === stone ? "won" : "lost";

  const subject =
    outcome === "won" ? `You won at ${game} against ${opponent}` : outcome === "lost" ? `${opponent} won your game of ${game}` : `Your game of ${game} with ${opponent} was a draw`;
  const headline =
    outcome === "won"
      ? `You won your game of ${game} against ${opponent}.`
      : outcome === "lost"
        ? `You lost your game of ${game} to ${opponent}.`
        : `Your game of ${game} with ${opponent} was a draw.`;

  const change = summary.ratingChange?.[stone] ?? 0;
  const lines = [
    headline,
    reasonOf({ ...summary.facts, outcome }, summary.names),
    scoreWords(summary.facts.score),
    lengthWords(summary.moveCount, summary.startedAt, summary.endedAt),
    change === 0 ? null : `Your rating went ${change > 0 ? "up" : "down"} ${Math.abs(change)}.`,
    "",
    "The final position:",
    `${SITE_ORIGIN}${matchPath(summary.variant, summary.gameId)}`,
    "",
    // The result card's own way back: the set-up screen, filled in with this game and the colours swapped.
    "Play again:",
    `${SITE_ORIGIN}${setUpLink({ rematch: summary.gameId })}`,
  ];
  return { subject, text: lines.filter((line): line is string => line !== null).join("\n") };
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "It took 43 moves over 2 days." — the moves always, the time only where the game kept when it ended. */
export function lengthWords(moveCount: number, startedAt: Date, endedAt: Date | null): string {
  const moves = moveCount === 1 ? "1 move" : `${moveCount} moves`;
  if (endedAt === null || endedAt.getTime() < startedAt.getTime()) return `It took ${moves}.`;
  const took = endedAt.getTime() - startedAt.getTime();
  const count = (amount: number, one: string) => `${amount} ${amount === 1 ? one : `${one}s`}`;
  const over =
    took < MINUTE_MS
      ? "under a minute"
      : took < HOUR_MS
        ? count(Math.round(took / MINUTE_MS), "minute")
        : took < 2 * DAY_MS
          ? count(Math.round(took / HOUR_MS), "hour")
          : count(Math.round(took / DAY_MS), "day");
  return took < HOUR_MS ? `It took ${moves} in ${over}.` : `It took ${moves} over ${over}.`;
}
