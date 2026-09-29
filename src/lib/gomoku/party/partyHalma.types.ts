import type { PartyRaceState } from "./partyRace.types";

/** The four corners of Halma's square board, named from the top of the board as it is drawn. */
export type HalmaCorner = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

/** How many play Halma round one device: the two counts it was made for. */
export type PartyHalmaCount = 2 | 4;

/** One player at the table: the corner their pieces start in, and a name if they gave one. */
export type PartyHalmaPlayer = { corner: HalmaCorner; name: string };

/**
 * A game of Halma for two or four players on one device: a table
 * (`PartyRaceState`) whose players sit in the corners of the sixteen-square
 * board, one entry of `board` per square.
 */
export type PartyHalmaState = PartyRaceState<PartyHalmaPlayer>;
