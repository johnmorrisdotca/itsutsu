// Relative, not `@/`: `gameKeys.ts` imports this, `families.ts` imports that, and the browser specs import that.
import type { VariantCopy } from "../gomoku/variants.constants";

import { MANCALA_BOARDS } from "./mancala/mancala.constants";
import { TRAIN_SETS } from "@johnmorrisdotca/domino";
import type { PartyKind, PartySpec } from "./party.types";
import { PACHISI_TRACK } from "./pachisi/pachisi.constants";
import { YACHT_SHEET } from "./yacht/yacht.constants";
import { HITOTSU_DEFAULT_SIZE, HITOTSU_SIZES } from "@johnmorrisdotca/hitotsu";
import { TENKA_MEDIUM_ROUNDS, TENKA_SHORT_ROUNDS, TENKA_WORLD_ROUNDS } from "./tenka/tenka.constants";
import { CARD_GAME_KINDS, CARD_GAME_LIST, CARD_GAME_SPECS } from "../cardGames/cardGames.constants";
import { CARD_GAME_DISPLAY } from "../cardGames/cardGames.copy";
import { HITOTSU_DISPLAY } from "./hitotsu/hitotsu.copy";

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
  tenka: "tenka",
  mexicanTrain: "mexicanTrain",
  yacht: "yacht",
  pachisi: "pachisi",
  hitotsu: "hitotsu",
  ...CARD_GAME_KINDS,
} as const satisfies Record<PartyKind, PartyKind>;

/** Every party game, in the order its family shows them, the card games after the rest. Read by the gate, the catalogue and the shelf. */
export const PARTY_KIND_LIST: readonly PartyKind[] = [PARTY_KINDS.dotsAndBoxes, PARTY_KINDS.superghost, PARTY_KINDS.mancala, PARTY_KINDS.tenka, PARTY_KINDS.mexicanTrain, PARTY_KINDS.hitotsu, PARTY_KINDS.yacht, PARTY_KINDS.pachisi, ...CARD_GAME_LIST];

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
  /*
   * TENKA, 2026-09-28: the classic game of world conquest, which John asked
   * for by the name of the best-known boxed version of it. That name, its
   * art and its wording are its owner's and appear nowhere here; the rules
   * of a game are nobody's. So it has a name of its own, from 天下取り
   * (tenka-tori, "taking the realm") — what Japan's warlords of the sixteenth
   * century set out to do — and a map of the modern world.
   */
  tenka: {
    label: "Tenka",
    kanji: "天下",
    tagline: "Take the whole world, one territory at a time: roll for it, hold it, and trade your cards for more armies.",
    origin:
      "A game of world conquest in the family that has been played on maps of the world since the 1950s: dice for battles, armies for holding a continent whole, cards traded in for more. The rules of a game belong to nobody; the name is our own, from the Japanese 天下取り, tenka-tori, \"taking the realm\", what the warlords of sixteenth-century Japan set out to do, on a map of the world as it is today.",
    rules: [
      "The world's forty-two territories are dealt out round the table, one army on each, and everybody's starting armies go onto their own territories. At a table of two a neutral army holds a third of the world; it never moves, only defends.",
      "Your turn starts with new armies: one for every three territories you hold (never fewer than three), more for each continent you hold whole, and more again for a set of three cards traded in. Place them on your own territories, one at a time or all the rest at once, spread as you like.",
      "Then attack as often as you like: from a territory with at least two armies, into a neighbour somebody else holds — across a land border or a dashed sea link. The world wraps round: Alaska and the Russian Far East are neighbours across the Bering Strait, one at each edge of the map. You throw up to three dice, one fewer than your armies there; the defender throws up to two.",
      "The highest dice are compared in pairs; the higher wins and a tie goes to the defender. Each pair lost is one army lost. Empty the territory and it is yours: move in at least as many armies as dice you threw.",
      "End your turn with one move of armies between two of your own territories joined through your own land, if you like. Took a territory this turn? Take a card. Three alike, or one of each kind, or two with a wild card, trade for 4, 6, 8, 10, 12, 15 armies, and five more for each set after that; with five cards you must trade.",
      "Knock a player out and their cards are yours. Take the whole world — every other player out — and you win. A game of so many rounds ends at its last: whoever holds the most territories wins.",
    ],
    board:
      "Two maps of today's world. The world: forty-two territories in six continents. Europe: thirty-seven territories in eleven regions, from Iceland to the Urals and from the North Cape to the Maghreb, its seas crossed by dashed links. For a quick game choose ten rounds; twenty for an evening; or play until one player holds the whole map (counted at round sixty if it ever gets that far).",
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
  /*
   * YACHT, 2026-09-30. John: "Did we create a dice rolling game [where] you
   * just roll a dice and have fun that way?" The dice game everybody knows,
   * by the name it was printed under before any company boxed it: five dice,
   * three rolls, a sheet of thirteen boxes. The boxed version's name is its
   * owner's and appears nowhere here; the rules of a game are nobody's. Its
   * kanji, 五つ賽 (itsutsu-sai), is "five dice", and says the site's name.
   */
  yacht: {
    label: "Yacht",
    kanji: "五つ賽",
    tagline: "Five dice, three rolls, thirteen boxes: hold what you like, roll the rest, and fill your sheet for the highest score.",
    origin:
      /* Checked 2026-09-30: Yacht is in books of game rules from the 1930s; the thirteen-box sheet with the upper bonus is the one most tables now play. */
      "A dice game of the poker-dice family, in books of game rules since the 1930s under the name Yacht, and played round kitchen tables ever since; Yams in France and Generala in Latin America are its close cousins. The sheet played here is the thirteen-box one most tables use today, with the bonus for the upper half. Nobody owns it.",
    alsoKnownAs: ["Yams", "Generala"],
    wikipedia: "Yacht (dice game)",
    rules: [
      "On your turn, roll all five dice. Then roll again any of them you like, holding the rest where they lie: up to three rolls in all. Tap a die to hold it, and tap it again to let it go.",
      "After your last roll, or sooner if you like what you see, write the dice into one empty box on your sheet. Every box is filled once, and dice that do not make a box's combination score nothing there, which is sometimes the best a turn can do.",
      "The upper half is Ones to Sixes: each scores the total of that number among the five. Reach 63 there (three of every number) and earn 35 more.",
      "The lower half: three of a kind and four of a kind score all five dice; a full house (three of one number and two of another) 25; a small straight (four in a row) 30; a large straight (five in a row) 40; a Yacht (all five the same) 50; and Chance, anything at all, scores all five dice.",
      "Thirteen turns fill every sheet. The highest total wins; players level on the highest share the win.",
    ],
    board:
      "One sheet of thirteen boxes. Play alone to beat your best, pass one phone round a table of up to eight, or put the computer in any seat.",
  },
  /*
   * PACHISI, the cross-and-circle race game of India, by its own old name:
   * the boxed Western version's name is its owner's and appears nowhere here.
   * Its kanji, 二十五, is "twenty-five", which is what pachisi means: the
   * highest throw of the cowries it was first played with.
   */
  pachisi: {
    label: "Pachisi",
    kanji: "二十五",
    tagline: "Two dice, four pawns each and a cross-shaped track: race them all home, and send anyone you land on back to the start.",
    origin:
      /* Checked 2026-09-30: pachisi is played in India from at least the sixteenth century; the two-dice Western form with bonuses of 20 and 10 is the one played here. */
      "The national game of India, played on a cloth cross for centuries: Akbar is said to have played it in his palace courtyard with people for pawns. It came west in the nineteenth century as a boxed game with two dice, and Spain plays it as Parchís. The form here is that Western one, with its blockades, safe squares and bonuses. Nobody owns it.",
    alsoKnownAs: ["Parchís", "Chaupar"],
    wikipedia: "Pachisi",
    rules: [
      "Each player has four pawns in their nest. On your turn throw two dice; each die moves one pawn on its own, the same pawn or two, in the order you like. A pawn comes out of the nest onto your entry square on a 5, or on two dice that add up to five.",
      "Pawns go round the shared track, then up your own home path to the middle; a pawn must reach home by the exact count. A value no pawn can use is lost.",
      "Land on a lone opponent's pawn on an ordinary square and it goes back to its nest, and you move 20 more with any pawn. The ringed squares are safe: nobody is taken there. Bring a pawn home and move 10 more.",
      "Two of your pawns on one square are a blockade: no pawn may pass it or land there, yours included.",
      "Doubles throw again. A third double in one turn sends your leading pawn on the track back to its nest. The first with all four pawns home wins.",
    ],
    board:
      "A cross of sixty-eight squares round a middle, with a home path of seven for each colour. Two sit opposite each other; three or four take an arm each. Pass one phone round, or put the computer in any seat.",
  },
  hitotsu: HITOTSU_DISPLAY,
  // The family card games' copy, kept beside their rules (`cardGames.copy.ts`).
  ...CARD_GAME_DISPLAY,
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
   * Tenka for two to six on the one map of the world; a size is how many
   * rounds before the count (`tenka.constants.ts`): ten, twenty, or the whole
   * world. Three is the table the set-up opens on, the classic game's
   * smallest without a neutral army.
   */
  tenka: {
    fewestPlayers: 2,
    mostPlayers: 6,
    defaultPlayers: 3,
    sizes: [TENKA_SHORT_ROUNDS, TENKA_MEDIUM_ROUNDS, TENKA_WORLD_ROUNDS],
    defaultSize: TENKA_WORLD_ROUNDS,
  },
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
  /*
   * Yacht on its one sheet of thirteen boxes, for two to eight at the gate's
   * table; the table itself seats one alone too (`startYacht`). Two is where
   * the set-up opens: a person and the computer.
   */
  yacht: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 2, sizes: [YACHT_SHEET], defaultSize: YACHT_SHEET },
  pachisi: { fewestPlayers: 2, mostPlayers: 4, defaultPlayers: 2, sizes: [PACHISI_TRACK], defaultSize: PACHISI_TRACK },
  /*
   * Hitotsu for two to eight — eight, the most any table here seats, one
   * colour a player — to 200 or 500 points (500 the published total, and the
   * default), or a single hand, which party mode opens on.
   */
  hitotsu: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 4, sizes: HITOTSU_SIZES, defaultSize: HITOTSU_DEFAULT_SIZE },
  // The family card games: how many at a table, and how long a game lasts in each one's own terms (`cardGames.constants.ts`).
  ...CARD_GAME_SPECS,
};
