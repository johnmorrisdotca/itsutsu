import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { mancalaBoardName } from "./mancala/mancala.constants";
import { PARTY_DISPLAY, PARTY_SPECS } from "./party.constants";
import type { PartyKind, PartyLanguage, PartySpec } from "./party.types";
import { TENKA_WORLD_ROUNDS } from "./tenka/tenka.constants";

/** "2–6 players", from the game's own spec rather than a second sentence that could drift. */
export function partyPlayersWords(kind: PartyKind): string {
  const spec = PARTY_SPECS[kind];
  return spec.fewestPlayers === spec.mostPlayers ? `${spec.mostPlayers} players` : `${spec.fewestPlayers}–${spec.mostPlayers} players`;
}

/** The languages a word game is offered in, in words: "English or Japanese". */
const LANGUAGE_WORDS: Record<PartyLanguage, string> = { english: "English", japanese: "Japanese" };

/** A list in words: "a", "a and b", "a, b and c" — or "a or b" when `or` says so. */
function listed(items: readonly string[], join = "and"): string {
  return items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} ${join} ${items.at(-1)}`;
}

/**
 * WHAT A PARTY GAME'S SET-UP OFFERS BEYOND ITS PLAYERS, in words, from its
 * spec: "on 3×3, 4×4, 5×5 and 6×6 boxes"; "in English or Japanese, where a
 * word of 4 letters or more loses"; "by Kalah (the default) or Oware rules".
 * Each game says what its sizes count — for Mancala, which rules it is played
 * by (`MANCALA_BOARDS`).
 */
const OFFERED_WORDS: Record<PartyKind, (spec: PartySpec) => string> = {
  dotsAndBoxes: (spec) => `on ${listed(spec.sizes.map((size) => `${size}×${size}`))} boxes`,
  superghost: (spec) =>
    `in ${listed((spec.languages ?? []).map((language) => LANGUAGE_WORDS[language]), "or")}, where a word of ${listed(spec.sizes.map(String), "or")} letters or more loses`,
  mancala: (spec) =>
    `by ${listed(
      spec.sizes.map((size) => `${mancalaBoardName(size) ?? size}${size === spec.defaultSize ? " (the default)" : ""}`),
      "or",
    )} rules`,
  tenka: (spec) =>
    `on a map of the modern world, ${listed(
      spec.sizes.map((rounds) => (rounds === TENKA_WORLD_ROUNDS ? "to the last player standing" : `${rounds} rounds`)),
      "or",
    )}`,
};

/** The boards, or the words, a party game's set-up offers: "on 3×3, 4×4, 5×5 and 6×6 boxes". */
export function partyBoardsWords(kind: PartyKind): string {
  return OFFERED_WORDS[kind](PARTY_SPECS[kind]);
}

/**
 * What each table says of itself on its rules page: how a turn is made on
 * it, and its house rules — the ways this site's table keeps the game, and
 * (`more`) any rule of the game's own the table has had to settle.
 */
const TABLE_WORDS: Record<PartyKind, { turn: string; house: string; more?: readonly string[] }> = {
  dotsAndBoxes: {
    turn: "The line at the top says whose turn it is, by name, colour and letter. Tap between two dots to draw; when you close a box it says so, and it is still your turn.",
    house: "Every claimed box carries its owner's letter as well as their colour, so nobody has to tell two colours apart to count.",
  },
  superghost: {
    turn: "The line at the top says whose turn it is, by name, colour and letter. Tap a letter on the keyboard, then Add before or Add after; or press Challenge. When challenged, type the word you had in mind and press Enter: the game checks it against its word list.",
    house:
      "The site checks every word against its own list: SCOWL's English words, and the readings of JMdict for Japanese. A word named that is not in the list is handed back to try again, rather than losing the round to a typo; say you cannot name one to give the round up. Each player's letters are written out beside their name, and a player who is out is struck through as well as greyed.",
  },
  mancala: {
    turn: "The line at the top names whose turn it is and which rules are being played. Tap one of your own pits, ringed in your colour, to sow it: the seeds fall one at a time, and the line beneath says what the last one did, another turn or how many were captured.",
    house: "Every pit and store shows how many seeds it holds as a number beside the seeds themselves, so nobody has to count them.",
  },
  tenka: {
    turn: "The bar under the map says whose turn it is and what comes next: Place, Attack, Fortify, End turn. Tap a territory to choose it — the ones it can reach light up — then tap where to go. Pinch, scroll or double-tap to zoom, drag to look round, Fit to see the whole world again.",
    house: "Every territory shows its owner's letter as well as their colour, so nobody has to tell two colours apart to count. The neutral army is grey, with N.",
    more: [
      "Starting armies: forty each for two players (and forty for the neutral army), thirty-five each for three, thirty for four, twenty-five for five, twenty for six. They are placed at random to start quickly, or by hand, one at a time round the table, if you choose.",
      "The defender always throws as many dice as allowed — two with two armies or more, one with one — since more never hurts a defence. Dice are thrown by the game, not by a person, and a reloaded page throws nothing again: every die is kept with the game.",
      "A card shows a territory and one of three kinds: land, sea or air. A set that includes a territory you hold puts two more armies straight onto it. Cards traded in go back under the deck once it runs out.",
    ],
  },
};

/**
 * A party game's rules page, in the game template: Object, Board, Play, House.
 *
 * The same `RulesPage` shape a game builds from its spec and a puzzle from
 * its own (`puzzleRulesPage`), so the one rules page draws all three. The
 * facts come from the game's spec and its copy: the players and boards are
 * `PARTY_SPECS`'s, never a second description.
 */
export function partyRulesPage(kind: PartyKind): RulesPage {
  const copy = PARTY_DISPLAY[kind];
  const object = [copy.tagline, copy.rules.at(-1) ?? copy.tagline];
  const board = [`Played ${partyBoardsWords(kind)}. ${copy.board}`, `For ${partyPlayersWords(kind)}, passing one phone or tablet round the table.`];
  const play = [...copy.rules.slice(0, -1), TABLE_WORDS[kind].turn];
  const house = [
    TABLE_WORDS[kind].house,
    ...(TABLE_WORDS[kind].more ?? []),
    "The game is kept in the browser it is played in, after every move: close the tab, answer a call, and it is there when you come back, waiting on My games under Pass and play.",
    "Nothing is rated, nothing is sent to the site, and no ladder counts a game. A party game is for the people round the table.",
  ];

  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    inspiredBy: copy.inspiredBy,
    alsoKnownAs: [...(copy.alsoKnownAs ?? [])],
    from: originFor(copy.country),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(kind),
  };
}
