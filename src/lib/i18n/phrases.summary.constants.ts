/**
 * summary.*: a game's rules, seating and settings said in a line or a paragraph: the line under the set-up, the doorstep and the rules beside a board (`src/components/live/rulesSummary.ts`, `doorstepSays.ts`, `setUpWords.ts`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_SUMMARY = {
  // The settings, one chip each
  "summary.opening": "{opening} opening",
  "summary.resignAllowed": "Resigning allowed",
  "summary.noResign": "No resigning",
  // A handicap, said as a fact about a colour
  "summary.handicap": "{colour} handicap",
  "summary.handicapWith": "{colour} handicap: {parts}",
  "summary.secondStone": "second stone {where}",
  // Who plays whom, in a sentence
  "summary.screen": "Both seats are yours: two people at one screen, taking turns on this device.",
  "summary.openingDecidesPosted": "The {opening} opening decides who plays which colour, once the first stones are down. The other seat is posted for whoever answers it.",
  "summary.openingDecidesAgainst": "Against {against}. The {opening} opening decides who plays which colour, once the first stones are down.",
  "summary.lotPosted": "Who plays black is drawn by lot as the game is made.",
  "summary.lotAgainst": "Against {against}. Who plays black is drawn by lot as you press Start.",
  "summary.settledPosted": "The seat is posted for whoever answers it; the colours are settled when the game is made.",
  "summary.settledAgainst": "Against {against}. The colours are settled when the game is made.",
  "summary.seatedPosted": "You are {mine} and {order}. The {theirs} seat is posted on the games page for whoever answers it.",
  "summary.seatedAgainst": "Against {against}, who plays {theirs}; you are {mine} and {order}.",
  "summary.moveFirst": "move first",
  "summary.moveSecond": "move second",
  "summary.offerNote": "This is an offer: {them} can accept or decline it, and declining costs nobody anything.",
  "summary.gameOn": "{name} on {board}.",
  "summary.gameOnBlocked": "{name} on {board}, with the star points blocked.",
  // What the set-up recaps beside the choices
  "summary.againstPlayer": "Against {player}",
  "summary.againstHandOver": "Against whoever you hand the seat to",
  "summary.computerNamed": "{name} (a computer)",
  "summary.postForAnyone": "Post the seat for anyone",
} as const;
