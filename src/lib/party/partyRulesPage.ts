import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { PARTY_DISPLAY, PARTY_SPECS } from "./party.constants";
import type { PartyKind, PartyLanguage, PartySpec } from "./party.types";

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
 * word of 4 letters or more loses". Each game says what its sizes count.
 */
const OFFERED_WORDS: Record<PartyKind, (spec: PartySpec) => string> = {
  dotsAndBoxes: (spec) => `on ${listed(spec.sizes.map((size) => `${size}×${size}`))} boxes`,
  superghost: (spec) =>
    `in ${listed((spec.languages ?? []).map((language) => LANGUAGE_WORDS[language]), "or")}, where a word of ${listed(spec.sizes.map(String), "or")} letters or more loses`,
};

/** The boards, or the words, a party game's set-up offers: "on 3×3, 4×4, 5×5 and 6×6 boxes". */
export function partyBoardsWords(kind: PartyKind): string {
  return OFFERED_WORDS[kind](PARTY_SPECS[kind]);
}

/**
 * What each table says of itself on its rules page: how a turn is made on
 * it, and its house rules — the ways this site's table keeps the game.
 */
const TABLE_WORDS: Record<PartyKind, { turn: string; house: string }> = {
  dotsAndBoxes: {
    turn: "The line at the top says whose turn it is, by name, colour and letter. Tap between two dots to draw; when you close a box it says so, and it is still your turn.",
    house: "Every claimed box carries its owner's letter as well as their colour, so nobody has to tell two colours apart to count.",
  },
  superghost: {
    turn: "The line at the top says whose turn it is, by name, colour and letter. Tap a letter on the keyboard, then Add before or Add after; or press Challenge. When challenged, type the word you had in mind and press Enter: the game checks it against its word list.",
    house:
      "The site checks every word against its own list: SCOWL's English words, and the readings of JMdict for Japanese. A word named that is not in the list is handed back to try again, rather than losing the round to a typo; say you cannot name one to give the round up. Each player's letters are written out beside their name, and a player who is out is struck through as well as greyed.",
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
