/**
 * terms.*: the terms of play, sentence by sentence (ENJA-11, PRIV-05).
 *
 * The register of the Privacy page: each sentence is either something the code keeps or says plainly that it is a
 * request. `terms.coverage.test.ts` holds the facts to the code. The section order, ids and the kanji beside each
 * heading are `terms.constants.ts`; the words are here. `{contact}` is the site's one address.
 *
 * Legal text: the Japanese is read by the reviewer agent and is also listed on the review sheet for a native reader.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 */
export const PHRASES_TERMS = {
  "terms.title": "Terms of play",
  "terms.subtitle": "What we ask of everybody here, and what the site does in return.",
  "terms.lastChanged": "Last changed {date}",
  "terms.governing": "This page is also offered in your language for reference. The English version is the one that governs, and where the two differ the English prevails.",

  "terms.oneAccount.h": "One account each",
  "terms.oneAccount.paraA": "We ask each person to keep one account. A friend who wants to play gets an invite of their own; sharing a login makes one record out of two people and a rating that describes nobody.",
  "terms.oneAccount.paraB": "Two people on one screen is fine and is what a game on one screen is for. It is kept as a game at one screen, not on either person's ladder.",
  "terms.ownMoves.h": "Play your own moves",
  "terms.ownMoves.paraA": "The bots are the site's own, named as programs and rated among programs. We ask that a game against a person is played by the person: choosing moves with an engine of your own is not playing, and it takes something from the person across the board.",
  "terms.beKind.h": "Be kind at the board",
  "terms.beKind.paraA": "Reactions, notes on a move and messages are for the game and the people in it. Say what you would say across a real board.",
  "terms.beKind.paraB": "If somebody is not, you do not have to put up with it. Ignore them from their page, and they can no longer send you a message or offer you a game. Report a problem, at the foot of every page, reaches the operator with the page you were on.",
  "terms.shut.h": "When an account is shut",
  "terms.shut.paraA": "The operator can shut an account. It stops working on its next visit, and the invite it came in with stops working too. Its finished games and its rating stay, because the other players played those games as well.",
  "terms.shut.paraB": "Where the account has an address, the operator writes to it to say why. To ask about it, write to {contact}.",
  "terms.ending.h": "Ending an account",
  "terms.ending.paraA": "Either side can end an account at any time. You can remove yours from your own page, under Profile, with Remove this account; the operator can remove it when you ask, or shut it as above. The privacy page says what goes and what stays.",
  "terms.ending.paraB": "A finished game is kept for both players: neither of them can delete it, and removing an account leaves the game with the other player, with the account taken off it.",
  "terms.abandoned.h": "A game somebody stops playing",
  "terms.abandoned.paraA": "A game is settled by the rules it was set up with, which are shown beside the board. With a clock, the clock decides: running out of time costs what that game says it costs. With no clock, the game waits for its players; either of them can resign it, unless it was set up so that nobody may.",
  "terms.beta.h": "Free, and still being built",
  "terms.beta.paraA": "{site} is free and in beta. It changes most weeks, it is sometimes down, and we promise no particular hours. When something is wrong, Report a problem is how we hear about it.",
  "terms.changes.h": "When these change",
  "terms.changes.paraA": "These terms change with the site, in plain words like these, and the date at the top moves when they do.",
} as const;
