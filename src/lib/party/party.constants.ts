// Relative, not `@/`: `gameKeys.ts` imports this, `families.ts` imports that, and the browser specs import that.
import type { VariantCopy } from "../gomoku/variants.constants";

import type { PartyKind, PartySpec } from "./party.types";

/**
 * THE PARTY GAMES: a table of people round one phone or tablet, each a game
 * of its own at home on the Party games shelf (`GAME_FAMILIES`), never rated
 * and never written to the database — see `party.types.ts` for why this is a
 * kind of its own, and docs/plans/party-games/README.md for how to add one.
 *
 * The copy is in the shape a game's and a puzzle's are (`VariantCopy`), so
 * the rules page, the catalogue's cards and the family's shelf draw a party
 * game with the template they already have.
 */
export const PARTY_KINDS = {
  dotsAndBoxes: "dotsAndBoxes",
} as const satisfies Record<PartyKind, PartyKind>;

/** Every party game, in the order its family shows them. Read by the gate, the catalogue and the shelf. */
export const PARTY_KIND_LIST: readonly PartyKind[] = [PARTY_KINDS.dotsAndBoxes];

export const PARTY_DISPLAY: Record<PartyKind, VariantCopy> = {
  dotsAndBoxes: {
    label: "Dots and Boxes",
    kanji: "陣取り",
    tagline: "Draw a line; close a box and it is yours, and you draw again.",
    origin:
      "A pencil-and-paper game first published in France by the mathematician Édouard Lucas in 1889, as La Pipopipette, and played on the back of school exercise books ever since. Nobody owns it.",
    alsoKnownAs: ["Boxes", "Squares", "Paddocks", "La Pipopipette"],
    country: "FR",
    wikipedia: "Dots and boxes",
    rules: [
      "The board starts as a grid of dots and nothing else. Players take turns drawing one line between two dots next to each other, across or down.",
      "Draw the fourth side of a box and the box is yours: it fills with your colour and your letter. Then you must draw another line.",
      "One line can close two boxes at once; both are yours, and you still draw just one more line.",
      "A line that closes no box ends your turn, and the next player round the table draws.",
      "When every line has been drawn the game is over. Whoever holds the most boxes wins; players level on the most boxes share the win.",
    ],
    board:
      "Choose 3×3 boxes for a quick game for two, 4×4 or 5×5 for three or four, and 6×6 when five or six are playing, so everybody gets a turn at the long chains.",
  },
};

/**
 * The tables the set-up offers.
 *
 * Dots and Boxes for two to six, on 3×3 to 6×6 boxes: four boards, as every
 * set-up offers at most four. 3×3 is twenty-four lines, over in a few
 * minutes; 6×6 is eighty-four, enough for six players to each close a few
 * boxes. Nothing larger, because the board must fit a 390-pixel phone with
 * every line easy to tap: at 6×6 the seven dots sit about forty-five pixels
 * apart there, and each line's target is the whole diamond between its two
 * dots and the middles of the boxes either side of it, so nothing smaller
 * than that is ever asked of a finger.
 */
export const PARTY_SPECS: Record<PartyKind, PartySpec> = {
  dotsAndBoxes: { fewestPlayers: 2, mostPlayers: 6, defaultPlayers: 2, sizes: [3, 4, 5, 6], defaultSize: 4 },
};
