import { gameArtPath } from "@/lib/gomoku/artwork";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { PARTY_DISPLAY, PARTY_SPECS } from "./party.constants";
import type { PartyKind } from "./party.types";

/** "2–6 players", from the game's own spec rather than a second sentence that could drift. */
export function partyPlayersWords(kind: PartyKind): string {
  const spec = PARTY_SPECS[kind];
  return spec.fewestPlayers === spec.mostPlayers ? `${spec.mostPlayers} players` : `${spec.fewestPlayers}–${spec.mostPlayers} players`;
}

/** The boards a party game's set-up offers, in words: "3×3, 4×4, 5×5 and 6×6 boxes". */
export function partyBoardsWords(kind: PartyKind): string {
  const sizes = PARTY_SPECS[kind].sizes.map((size) => `${size}×${size}`);
  const listed = sizes.length === 1 ? sizes[0] : `${sizes.slice(0, -1).join(", ")} and ${sizes.at(-1)}`;
  return `${listed} boxes`;
}

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
  const board = [`Boards: ${partyBoardsWords(kind)}. ${copy.board}`, `For ${partyPlayersWords(kind)}, passing one phone or tablet round the table.`];
  const play = [
    ...copy.rules.slice(0, -1),
    "The line at the top says whose turn it is, by name, colour and letter. Tap between two dots to draw; when you close a box it says so, and it is still your turn.",
  ];
  const house = [
    "Every claimed box carries its owner's letter as well as their colour, so nobody has to tell two colours apart to count.",
    "The game is kept in the browser it is played in, after every line: close the tab, answer a call, and it is there when you come back, waiting on My games under Pass and play.",
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
