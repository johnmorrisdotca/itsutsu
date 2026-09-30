// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { VariantCopy } from "../../gomoku/variants.constants";

/**
 * HITOTSU 一つ, 2026-09-30. John: "we should build Uno and party Uno versions.
 * Build out some of the most popular variants of Uno to add to the base one."
 *
 * The boxed game he named is a trademark, and its deck's look is its owner's;
 * the play of a colour-card shedding game is nobody's. So the game here has a
 * name and a deck of its own. 一つ (hitotsu) is "one" in Japanese — the word
 * the table calls as a player goes down to their last card, as the boxed game
 * calls its own name, and a sibling of the site's own name, 五つ (itsutsu),
 * "five". The deck is four colours, each marked with one of the five elements
 * as well as its colour — 火 fire red, 土 earth yellow, 木 wood green, 水
 * water blue — so no card is told by colour alone; the wilds carry all four.
 */
export const HITOTSU_DISPLAY: VariantCopy = {
  label: "Hitotsu",
  kanji: "一つ",
  tagline: "Match the colour or the number, skip, reverse and make the next player draw — and call \"Hitotsu!\" when you are down to one card.",
  inspiredBy: "UNO",
  origin:
    "Our own game of the colour-card shedding family that grew out of Crazy Eights: a deck of four colours with numbers and action cards, first published in the United States in 1971 and sold ever since under a name that is its owner's trademark. The play belongs to nobody; the name is ours — 一つ, \"one\" in Japanese, the word called as a player goes down to their last card — and so is the deck, each colour marked with one of the five elements: fire, earth, wood and water.",
  country: "US",
  wikipedia: "Uno (card game)",
  rules: [
    "Two to eight players, seven cards each (five in party mode) from a deck of 108: in each of four colours a zero, two of every number from one to nine, and two each of Skip, Reverse and Draw Two; and four Wilds and four Wild Draw Fours. The first number card turned up starts the pile.",
    "On your turn, play a card of the colour on top, or with the same number or symbol, or a wild. Or draw one card: if it can be played you may play it at once; otherwise your turn is over.",
    "Skip: the next player misses their turn. Reverse: play turns the other way round the table (between two, it skips). Draw Two: the next player takes two cards and misses their turn.",
    "Wild: call any colour. Wild Draw Four: call a colour, and the next player takes four and misses their turn — but they may challenge it. If you held a card of the colour it went on, you take the four instead; if you did not, the challenger takes six.",
    "Going down to one card, call \"Hitotsu!\" as it goes down. Forget, and you are caught: take two.",
    "The first player out wins the hand and scores what everybody else holds: a number its value, an action card twenty, a wild fifty. A hand nobody can finish goes to whoever holds least. The first to the game's total wins — 200, or 500 for the full game — or, in a game of one hand, whoever goes out first.",
  ],
  board:
    "Four is the usual table, and it seats two to eight. Choose 500 points for the full game, 200 for a shorter one, or one hand. Party mode deals five cards each, plays one hand, and turns on the party rules — stacking, jumping in, sevens and zeros — each of which can also be chosen on its own.",
};
