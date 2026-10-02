// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartySpec } from "../party.types";

import { SUGOROKU_KIND_LIST, SUGOROKU_STRENGTH_NAMES, SUGOROKU_STRENGTHS, type SugorokuKind } from "./sugoroku.constants";

/** A list in words: "a", "a or b", "a, b or c". */
function orList(items: readonly string[]): string {
  return items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}

/** What a game's lengths are in words: "as a single game, or a match to 3, 5, 7 or 9 points". */
function lengthWords(spec: PartySpec): string {
  const matches = spec.sizes.filter((size) => size > 1);
  return matches.length === 0 ? "as a single game" : `as a single game, or a match to ${orList(matches.map(String))} points with the doubling cube`;
}

/** What a rules page says each of the seven is offered as, from its spec: never a second sentence that could drift. */
export const SUGOROKU_OFFERED: Record<SugorokuKind, (spec: PartySpec) => string> = Object.fromEntries(
  SUGOROKU_KIND_LIST.map((kind) => [kind, (spec: PartySpec) => lengthWords(spec)]),
) as Record<SugorokuKind, (spec: PartySpec) => string>;

const STRENGTHS = orList(SUGOROKU_STRENGTHS.map((strength) => SUGOROKU_STRENGTH_NAMES[strength].toLowerCase()));

const TURN =
  "The line over the board says whose turn it is and what to do. Press Roll the dice: they are thrown for you and shown on the board, a die dimmed as it is used. Tap one of your checkers, and the points it may go to light up; tap one to move it there, or drag the checker. A checker on the bar goes first. You may take the turn back, move by move, until you press Done. Before you roll, with the cube yours or in the middle, a Double button offers it; the other side then presses Take or Drop.";

const HOUSE =
  `Two play, round one device or on two, each on their own phone or computer; or put the computer in the second seat at one of four strengths: ${STRENGTHS}. The board stands up on a phone and lies across on a desk, and there is a Just the board mode as there is for every game here.`;

const MORE: readonly string[] = [
  "The dice are the game's own: each game is given a seed when it starts, every throw is the next of the dice that seed makes, and a game kept in the browser throws what it threw when it is read back. On two devices the site checks every move against the rules and every throw against the seed. The seed is stored with the game, so a person who goes looking in the stored text could look ahead; the table keeps no secret from them.",
  "A turn is one move on the record: the dice as thrown and the checkers played, in the standard notation (24/18 13/11, bar/22*, 6/off). Nothing here is rated, and no ladder counts a game.",
  "Giving up ends the game at the most the position could cost: a single game once you have borne a checker off, otherwise a gammon, or a backgammon where the other side could still hit a checker of yours.",
];

/** What each of the seven says of its table on its rules page: how a turn is made, the house rules, and what the table has settled. */
export const SUGOROKU_TABLE_WORDS: Record<SugorokuKind, { turn: string; house: string; more?: readonly string[] }> = Object.fromEntries(
  SUGOROKU_KIND_LIST.map((kind) => [kind, { turn: TURN, house: HOUSE, more: MORE }]),
) as Record<SugorokuKind, { turn: string; house: string; more?: readonly string[] }>;
