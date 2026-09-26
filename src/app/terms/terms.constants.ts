/**
 * The terms of play, sentence by sentence (PRIV-05).
 *
 * The register of /privacy, and the same discipline: each sentence is either
 * something the code keeps, checked on 2026-09-24, or says plainly that it is
 * a request — one account each and your own moves are asked of people, not
 * enforced by anything. No legalese: if a line would not be said to a friend
 * across a board, it is rewritten. `terms.coverage.test.ts` holds the facts to
 * the code they describe.
 */

// Relative, not "@/": the browser spec imports this file, and Playwright does not resolve the alias.
import { CONTACT } from "../privacy/privacy.constants";
import type { DocumentSection } from "@/components/layout/SectionedDocument";

export const TERMS_TITLE = { en: "Terms of play", kanji: "利用規約" } as const;

export const TERMS_SUBTITLE = "What we ask of everybody here, and what the site does in return.";

/** When the terms last changed. Moves with every change to a sentence below. */
export const TERMS_CHANGED = "2026-09-24";

/** The one address both documents name, from the privacy page, so there is one to change. */
export { CONTACT };

export const TERMS_SECTIONS: readonly DocumentSection[] = [
  {
    id: "one-account",
    heading: "One account each",
    kanji: "一人一口",
    paragraphs: [
      "We ask each person to keep one account. A friend who wants to play gets an invite of their own; sharing a login makes one record out of two people and a rating that describes nobody.",
      "Two people on one screen is fine and is what a game on one screen is for. It is kept as a game at one screen, not on either person's ladder.",
    ],
  },
  {
    id: "own-moves",
    heading: "Play your own moves",
    kanji: "自力",
    paragraphs: [
      "The bots are the site's own, named as programs and rated among programs. We ask that a game against a person is played by the person: choosing moves with an engine of your own is not playing, and it takes something from the person across the board.",
    ],
  },
  {
    id: "be-kind",
    heading: "Be kind at the board",
    kanji: "礼儀",
    paragraphs: [
      "Reactions, notes on a move and messages are for the game and the people in it. Say what you would say across a real board.",
      "If somebody is not, you do not have to put up with it. Ignore them from their page, and they can no longer send you a message or offer you a game. Report a problem, at the foot of every page, reaches the operator with the page you were on.",
    ],
  },
  {
    id: "shut",
    heading: "When an account is shut",
    kanji: "停止",
    paragraphs: [
      "The operator can shut an account. It stops working on its next visit, and the invite it came in with stops working too. Its finished games and its rating stay, because the other players played those games as well.",
      `Where the account has an address, the operator writes to it to say why. To ask about it, write to ${CONTACT}.`,
    ],
  },
  {
    id: "ending",
    heading: "Ending an account",
    kanji: "退会",
    paragraphs: [
      "Either side can end an account at any time. You can remove yours from your own page, under Profile, with Remove this account; the operator can remove it when you ask, or shut it as above. The privacy page says what goes and what stays.",
      "A finished game is kept for both players: neither of them can delete it, and removing an account leaves the game with the other player, with the account taken off it.",
    ],
  },
  {
    id: "abandoned",
    heading: "A game somebody stops playing",
    kanji: "放置",
    paragraphs: [
      "A game is settled by the rules it was set up with, which are shown beside the board. With a clock, the clock decides: running out of time costs what that game says it costs. With no clock, the game waits for its players; either of them can resign it, unless it was set up so that nobody may.",
    ],
  },
  {
    id: "beta",
    heading: "Free, and still being built",
    kanji: "試験版",
    paragraphs: [
      "Itsutsu is free and in beta. It changes most weeks, it is sometimes down, and we promise no particular hours. When something is wrong, Report a problem is how we hear about it.",
    ],
  },
  {
    id: "changes",
    heading: "When these change",
    kanji: "改訂",
    paragraphs: [
      "These terms change with the site, in plain words like these, and the date at the top moves when they do.",
    ],
  },
];
