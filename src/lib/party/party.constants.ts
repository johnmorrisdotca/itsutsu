// Relative, not `@/`: `gameKeys.ts` imports this, `families.ts` imports that, and the browser specs import that.
import type { VariantCopy } from "../gomoku/variants.constants";

import { MANCALA_BOARDS } from "./mancala/mancala.constants";
import { TRAIN_SETS } from "./mexicanTrain/mexicanTrain.constants";
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
  mancala: "mancala",
  mexicanTrain: "mexicanTrain",
} as const satisfies Record<PartyKind, PartyKind>;

/** Every party game, in the order its family shows them. Read by the gate, the catalogue and the shelf. */
export const PARTY_KIND_LIST: readonly PartyKind[] = [PARTY_KINDS.dotsAndBoxes, PARTY_KINDS.superghost, PARTY_KINDS.mancala, PARTY_KINDS.mexicanTrain];

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
      /* Thurber's essay on Ghost checked 2026-09-28; that it made Superghost itself famous could not be confirmed, so the copy does not say so. */
      "Ghost is an old spoken word game of the English-speaking world, where letters are only ever added at the end. Superghost lets a letter go on at either end. James Thurber's New Yorker essay \"Do You Want to Make Something Out of It?\" is the best-known account of the game and the people who play it. Nobody owns either.",
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
  mancala: {
    label: "Mancala",
    kanji: "種まき",
    tagline: "Sow seeds round the board, one to a pit, and gather more into your store than your opponent.",
    origin:
      "Sowing games are among the oldest board games still played, known right across Africa, the Middle East and South and Southeast Asia; the name comes from the Arabic naqala, to move. Oware is the Akan game of Ghana, played across West Africa and the Caribbean. Kalah was published in the United States by William Julius Champion Jr. in the 1940s, and is the version most sets sold as Mancala in North America follow. Nobody owns either.",
    alsoKnownAs: ["Kalah", "Kalaha", "Oware", "Awari", "Ayo"],
    wikipedia: "Mancala",
    rules: [
      "The board is two rows of six pits with four seeds in each, and a store at each end. The near row is the first player's, the far row the second's, and each player's store is at their right-hand end.",
      "On your turn, lift every seed from one of your pits and sow them one to a pit, counter-clockwise, into the pits that follow.",
      "Kalah, the default: sow into your own store as you pass it, never your opponent's. If the last seed lands in your store, you sow again. If it lands in an empty pit of yours and the pit opposite holds seeds, you take that seed and all of those into your store.",
      "Oware: the stores are never sown into; they keep only what you take. A sowing of twelve or more goes round past the pit it came from and leaves it empty. If the last seed makes two or three in your opponent's pit, you take them, and the pit before it too, and so on back along their row, for as long as each holds two or three.",
      "Oware's two courtesies: a sowing that would take every seed your opponent has takes none (the grand slam), and when your opponent's row is empty you must sow seeds into it if you can. If you cannot, you take the seeds on your side and the game is over.",
      "Kalah ends when either row is empty, and each player adds what is left on their side to their store. Oware ends when somebody has 25, when both have 24, or when the same position comes round a third time, and then each takes the seeds on their side. The most seeds wins; level is a draw.",
    ],
    board:
      "Kalah is the one most sets sold as Mancala in North America follow, and the quicker to learn. Oware is the older and deeper game, played in tournaments across West Africa and the Caribbean: choose it once both players know Kalah.",
  },
  mexicanTrain: {
    label: "Mexican Train",
    kanji: "列車",
    tagline: "Build your own train of dominoes out from the hub, add to the Mexican Train or anybody's left open, and go out first with the fewest pips.",
    origin:
      /* Checked 2026-09-29: where the game began is not recorded; the double-twelve set and the rules below are the ones most North American sets print. */
      "A domino game of the train family: a hub in the middle, a train out of it for every player, and one more, the Mexican Train, that anybody may add to. Where it began is not certain. It spread across North America in the late twentieth century, and is now most often played with a double-twelve set of ninety-one tiles, thirteen rounds to a game. Nobody owns it.",
    alsoKnownAs: ["Mexican Train Dominoes", "Train dominoes"],
    wikipedia: "Mexican Train",
    rules: [
      "Each round begins with one double in the hub: the set's highest in the first round, then one fewer each round, down to double blank. Everybody is dealt a hand, face down to everybody else, and the rest of the tiles are the boneyard.",
      "On your turn, lay one tile whose end matches the open end of your own train, of the Mexican Train, or of any player's train that has its marker out. The first tile of every train matches the double in the hub.",
      "If you cannot lay a tile, draw one from the boneyard. Lay it if it goes; if not, or if there is nothing left to draw, put your marker on your train: anybody may now lay on it, until you lay on it yourself.",
      "Lay a double and you must lay again to cover it, with a tile matching it. A double left uncovered must be covered before anybody lays anything anywhere else, by whoever can, whoever's train it is on.",
      "A round ends when somebody lays their last tile, or when nobody can lay and the boneyard is empty. Everybody scores the pips left in their hand.",
      "After the last round, the lowest total wins; players level on the lowest share the win.",
    ],
    board:
      "Double-twelve is the set the game is sold with, and the one to start with. Double-nine makes a quicker game of larger pips, and double-fifteen a long one for a big table. A short game plays half the rounds, from the highest double down.",
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
  /*
   * Mancala for two, by Kalah's rules or Oware's, the choice made as a board
   * is (`MANCALA_BOARDS`): Kalah first and the default, since it is the game
   * most North American sets call Mancala and the quicker to pick up.
   */
  mancala: { fewestPlayers: 2, mostPlayers: 2, defaultPlayers: 2, sizes: [MANCALA_BOARDS.kalah, MANCALA_BOARDS.oware], defaultSize: MANCALA_BOARDS.kalah },
  /*
   * Mexican Train for two to eight, on a double-nine, double-twelve or
   * double-fifteen set, the set chosen as a board is: double-twelve, the set
   * the game is sold with, is the default, and four the table it opens on.
   */
  mexicanTrain: {
    fewestPlayers: 2,
    mostPlayers: 8,
    defaultPlayers: 4,
    sizes: [TRAIN_SETS.nine, TRAIN_SETS.twelve, TRAIN_SETS.fifteen],
    defaultSize: TRAIN_SETS.twelve,
  },
};
