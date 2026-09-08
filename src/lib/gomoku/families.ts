import type { RuleVariant } from "./gomoku.types";

/** The games grouped the way a newcomer should meet them: one first, then families. */
export const GAME_FAMILIES: { title: string; kanji: string; blurb: string; games: RuleVariant[] }[] = [
  {
    title: "Five in a row",
    kanji: "五目",
    blurb: "The classic and its tournament forms. Start with Freestyle; the rest tighten the rules.",
    games: ["freestyle", "standard", "renju", "omok", "caro", "connect6", "misereFive"],
  },
  {
    title: "Captures",
    kanji: "取り",
    blurb: "Five in a row, or take enough of the other side's stones.",
    games: ["ninuki", "sannuki"],
  },
  {
    title: "Drops",
    kanji: "落とし",
    blurb: "Stones fall to the bottom of their column. Quick, and good on a phone.",
    games: ["dropFour", "ringDrop", "holeDrop", "hotDrop", "clearDrop", "giveawayDrop", "edgeDrop", "wormDrop"],
  },
  {
    title: "Pieces and twists",
    kanji: "駒と回し",
    blurb: "Our own games: lay dominoes or blocks from a shared queue, or turn the board after every stone.",
    games: ["dominoFive", "blockFive", "twistFive", "twistFour"],
  },
  {
    title: "Flips",
    kanji: "反転",
    blurb: "Nothing is yours until the end. Bracket a run of the other colour and it turns.",
    games: ["reversi", "classicReversi", "antiReversi", "miniReversi", "grandReversi"],
  },
  {
    title: "Strange boards",
    kanji: "変盤",
    blurb: "Five in a row, on a board that does not behave: edges that join, and squares you cannot use.",
    games: ["toroidalFive", "obstacleFive"],
  },
  {
    title: "Races",
    kanji: "競走",
    blurb: "No lines and nothing captured. Get every piece across the board before the other side does.",
    games: ["halma"],
  },
  {
    title: "Small boards",
    kanji: "小盤",
    blurb: "Games you can read to the end, and games where the trick is what you must not do.",
    games: ["tictactoe", "wildTicTacToe", "notakto", "trapThree", "squareFour", "makerBreaker"],
  },
];

/** The other games in the family a variant belongs to, for "also try" links. */
export function siblingsOf(variant: RuleVariant): { family: (typeof GAME_FAMILIES)[number]; games: RuleVariant[] } | null {
  const family = GAME_FAMILIES.find((entry) => entry.games.includes(variant));
  if (family === undefined) return null;
  return { family, games: family.games.filter((game) => game !== variant) };
}
