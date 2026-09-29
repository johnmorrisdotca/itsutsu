// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import type { StarTip } from "../rules/chineseCheckers";

import type { PartyRaceState } from "./partyRace.types";

/** How many can sit round the star: the four counts the game is played with. */
export type PartyPlayerCount = 2 | 3 | 4 | 6;

/**
 * One player at the table: the point of the star their pieces start in, and a
 * name if they gave one. Their colour is their place in the turn order, so it
 * is not stored twice.
 */
export type PartyPlayer = { tip: StarTip; name: string };

/**
 * A game of Chinese Checkers for two to six players on one device: a table
 * (`PartyRaceState`) whose players sit at the points of the star, and whose
 * board is one entry per hole of the star's 17×17 array — off the star always
 * null. What it shares with the rated game is the board and how a piece
 * moves, and that is shared — see `partyCheckers.ts`.
 */
export type PartyCheckersState = PartyRaceState<PartyPlayer>;
