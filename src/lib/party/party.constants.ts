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
  superghost: "superghost",
} as const satisfies Record<PartyKind, PartyKind>;

/** Every party game, in the order its family shows them. Read by the gate, the catalogue and the shelf. */
export const PARTY_KIND_LIST: readonly PartyKind[] = [PARTY_KINDS.dotsAndBoxes, PARTY_KINDS.superghost];

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
  superghost: {
    label: "Superghost",
    kanji: "幽霊",
    tagline: "Add a letter at either end; finish a word, or bluff and be caught, and you are one step nearer a ghost.",
    origin:
      "Ghost is an old spoken word game of the English-speaking world, where letters are only ever added at the end. Superghost lets a letter go on at either end, and was made famous by James Thurber's essay about it in The New Yorker, \"Do You Want to Make Something Out of It?\". Nobody owns either.",
    wikipedia: "Ghost (game)",
    rules: [
      "Players take turns adding one letter to either end of a growing string of letters, the fragment. The first player of a round sets down any letter.",
      "Finish a word of four letters or more and you lose the round. Shorter words do not count, so CAT is safe and CATS is not.",
      "Instead of adding a letter, you may challenge the player who added the last one. They must name a real word with the fragment inside it, its letters together and in order.",
      "If they name one, the challenger loses the round; if they cannot, they lose it. A word named must be four letters or more, and in the site's word list.",
      "Whoever loses a round takes the next letter of GHOST (in Japanese, おばけだぞ) and begins the next round. Take all five and you are out. The last player left wins.",
    ],
    board:
      "Two to eight players, in English or in Japanese. In Japanese the letters are the kana of the Japanese Kumimoji: が is played as か, ゃ as や and を as お, so a player never has to choose between them.",
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
  /*
   * Superghost for two to eight, in English or Japanese, where a word of four
   * letters or more loses: the length the game is traditionally played to,
   * and the one "size" offered, so the set-up asks only who is playing and in
   * which language. Four holds in Japanese too, kana being syllables: of the
   * four-kana strings that some word still contains, about one in six is a
   * word itself (one in eleven for four letters in English), which leaves the
   * player at three kana a handful of safe letters to choose among, as in
   * English. At three, one in four would be a word
   * (the Japanese list holds twelve thousand three-kana words); five
   * would let a round run long past what a table remembers.
   */
  superghost: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 3, sizes: [4], defaultSize: 4, languages: ["english", "japanese"] },
};
