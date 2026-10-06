import { reasonOf, scoreWords } from "@/components/history/resultWords";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { stoneName } from "@/lib/gomoku/seatWords";
import { matchPath, setUpLink } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY, variantLabel } from "@/lib/gomoku/variants.constants";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";
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
 *
 * IN THE READER'S LANGUAGE (ENJA-12). The subject, the body and the footer are phrases (`mail.*`), said by the
 * speaker of the language the recipient saved (`sendNotice` reads it), English where none was. Every function
 * here takes the speaker last and defaults to English, so a caller with no language to ask for says what it always
 * said. A game is named by its kanji for a reader of Japanese, as everywhere on the site, and the result card's own
 * sentences (`reasonOf`, `scoreWords`) are said in the same language, so the email and the page agree.
 */
export function noticeMail(
  event: NoticeEvent,
  to: string,
  summary: GameOverSummary | null,
  stopUrl: string,
  say: Speaker = speaker("en"),
): OutgoingMail {
  const yourGames = `${SITE_ORIGIN}/play`;
  const site = { site: SITE_NAME };
  const footer = [
    "",
    say.say("mail.because", { ...site, address: CONTACT_ADDRESS }),
    // Every email says how to stop getting it (`mailStop.ts`): this kind, or all of them, with no sign-in.
    say.say("mail.stopHow", { ...site, words: say.say(MAIL_KINDS[event.kind].words) }),
    stopUrl,
  ];

  if (event.kind === "your-turn") {
    return {
      to,
      subject: say.say("mail.turn.subject", site),
      text: [say.say("mail.turn.body"), "", yourGames, ...footer].join("\n"),
    };
  }

  if (summary !== null && summary.gameId === event.gameId) {
    const words = gameOverWords(summary, event.stone, say);
    return { to, subject: words.subject, text: [words.text, "", say.say("mail.yourGames"), yourGames, ...footer].join("\n") };
  }

  const how =
    event.winner === null ? say.say("mail.over.draw") : event.winner === event.stone ? say.say("mail.over.won") : say.say("mail.over.lost");
  return {
    to,
    subject: say.say("mail.over.subject", site),
    text: [how, "", say.say("mail.over.record"), yourGames, ...footer].join("\n"),
  };
}

/** A game's name in a sentence: its kanji for a reader of Japanese, its English name otherwise, whatever was stored for an old one. */
function gameNameFor(say: Speaker, variant: string): string {
  const display = (RULE_VARIANT_DISPLAY as Record<string, { label: string; kanji: string } | undefined>)[variant];
  return display === undefined ? variantLabel(variant) : say.pairName(display.label, display.kanji).text;
}

/** A finished game told to the person who sat at `stone`: the subject, and the body above the footer. */
export function gameOverWords(summary: GameOverSummary, stone: Stone, say: Speaker = speaker("en")): { subject: string; text: string } {
  const other: Stone = stone === STONES.black ? STONES.white : STONES.black;
  const named = shownName(summary.names[other]).trim();
  // A name takes the language's polite ending where it has one; a colour, which is nobody's name, never does.
  const opponent = named === "" ? stoneName(say, other) : say.say("mail.over.person", { name: named });
  const game = gameNameFor(say, summary.variant);
  const winner = summary.facts.winner;
  const outcome = winner === null ? "draw" : winner === stone ? "won" : "lost";
  const vars = { game, opponent };

  const subject =
    outcome === "won"
      ? say.say("mail.over.subjectWon", vars)
      : outcome === "lost"
        ? say.say("mail.over.subjectLost", vars)
        : say.say("mail.over.subjectDraw", vars);
  const headline =
    outcome === "won" ? say.say("mail.over.headWon", vars) : outcome === "lost" ? say.say("mail.over.headLost", vars) : say.say("mail.over.headDraw", vars);

  const change = summary.ratingChange?.[stone] ?? 0;
  const lines = [
    headline,
    reasonOf({ ...summary.facts, outcome }, summary.names, say),
    scoreWords(summary.facts.score, say),
    lengthWords(summary.moveCount, summary.startedAt, summary.endedAt, say),
    change === 0 ? null : say.say(change > 0 ? "mail.over.ratingUp" : "mail.over.ratingDown", { change: String(Math.abs(change)) }),
    "",
    say.say("mail.over.finalPosition"),
    `${SITE_ORIGIN}${matchPath(summary.variant, summary.gameId)}`,
    "",
    // The result card's own way back: the set-up screen, filled in with this game and the colours swapped.
    say.say("mail.over.playAgain"),
    `${SITE_ORIGIN}${setUpLink({ rematch: summary.gameId })}`,
  ];
  return { subject, text: lines.filter((line): line is string => line !== null).join("\n") };
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "It took 43 moves over 2 days." — the moves always, the time only where the game kept when it ended. */
export function lengthWords(moveCount: number, startedAt: Date, endedAt: Date | null, say: Speaker = speaker("en")): string {
  const moves = say.count("count.move", moveCount);
  if (endedAt === null || endedAt.getTime() < startedAt.getTime()) return say.say("mail.length.moves", { moves });
  const took = endedAt.getTime() - startedAt.getTime();
  const over =
    took < MINUTE_MS
      ? say.say("mail.length.underMinute")
      : took < HOUR_MS
        ? say.count("mail.minute", Math.round(took / MINUTE_MS))
        : took < 2 * DAY_MS
          ? say.count("mail.hour", Math.round(took / HOUR_MS))
          : say.count("mail.day", Math.round(took / DAY_MS));
  return say.say(took < HOUR_MS ? "mail.length.in" : "mail.length.over", { moves, over });
}
