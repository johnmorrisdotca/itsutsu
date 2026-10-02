// Relative, not `@/`: the browser specs import this file (through `families.ts`), and Playwright resolves no alias in what it imports.
import type { GameFamily } from "./families.types";

/*
 * THE FAMILIES THEMSELVES, AS DATA: each row's identity, its words, the
 * reasons written beside it, and the games whose home it is. Its own module
 * since 2026-09-29, when Cards, Mahjong and Dominoes joined and `families.ts` held
 * both this table and everything that reads it: the table grows a row with
 * every new kind of game, and the reading of it (`families.ts`: which
 * families keep records, where a family's page is, what a shelf shows) does
 * not. Add a family here; ask about one there.
 */

/**
 * The games grouped the way a newcomer should meet them: one first, then
 * families.
 *
 * **`key` IS AN IDENTITY AND `title` IS DISPLAY**, and the two are kept apart
 * because something now stores one of them. The XP ledger pays `firstOfFamily`
 * once per family and remembers which by writing the family down — so if that
 * were the title, renaming "Small boards" to "Quick games" would make every
 * member's first game of the renamed family a family they had never met, and
 * pay 50 XP again to everybody. Nothing would report it: a re-award is a
 * perfectly ordinary row.
 *
 * So a key is chosen once and never changed, and the title is free to be
 * reworded. `XP_DESIGN.md` flagged this as the honest trade of using a display
 * string as an identity and left the decision to whoever wired the tour; this
 * is that decision, taken the other way. Kebab-case, matching the addresses
 * this site builds elsewhere.
 *
 * **`games` IS A GAME'S HOME**, exactly one family each. A game may also be
 * shown on another family's shelf — see `ALSO_LISTED_IN` — but it lives here.
 */
export const GAME_FAMILIES: GameFamily[] = [
  {
    key: "five-in-a-row",
    title: "Five in a row",
    kanji: "五目",
    blurb: "The classic and its tournament forms. Start with Gomoku; the rest tighten the rules.",
    games: ["freestyle", "standard", "renju", "omok", "caro", "connect6", "misereFive", "hexFive"],
  },
  {
    key: "drops",
    title: "Drops",
    kanji: "落とし",
    blurb: "Stones fall to the bottom of their column. Quick, and good on a phone.",
    games: ["dropFour", "ringDrop", "holeDrop", "hotDrop", "clearDrop", "giveawayDrop", "edgeDrop", "wormDrop"],
  },
  {
    key: "flips",
    /*
     * FLIPS AND CAPTURES, WHICH WERE TWO SHELVES. John, 2026-09-22: "Flips and
     * Captures are kind of the same concept - so same family might be best."
     * They are: in both, a stone you have already played stops being yours
     * because of what the other side does next — bracketed and turned in
     * Reversi, bracketed and lifted in Ninuki. A reader who liked one wants
     * the other, and two shelves of two and six was the catalogue filing
     * rather than helping.
     *
     * THE KEY STAYS `flips`, and that is the whole of the care this merge
     * needed. The key is what the XP ledger writes for `firstOfFamily`, so a
     * merge under a NEW key would pay everybody again for a family they had
     * already met. `flips` is kept because it is the busier of the two on the
     * live ledger — seven members against three — and every one of those three
     * already holds `flips` as well, so this re-pays nobody at all. See
     * `FAMILY_ABSORBED` below for what happens to the rows under the old key.
     */
    title: "Turn and take",
    kanji: "反転と取り",
    blurb: "Nothing is yours until the end. Bracket a run of the other colour and it turns, or take a pair off the board.",
    games: [
      "reversi",
      "classicReversi",
      "antiReversi",
      "miniReversi",
      "grandReversi",
      "honeycomb",
      "ninuki",
      "sannuki",
    ],
  },
  {
    key: "strange-boards",
    title: "Strange boards",
    kanji: "変盤",
    /*
     * The blurb says "a board that does not behave" rather than "five in a
     * row on a board that does not behave", because the shelf stopped being
     * about five in a row. John, 2026-09-22: "shouldn't Strange boards also
     * include all Hex boards, Rhombus? even possibly chinese checkers." A
     * reader opening this shelf wants the boards that do not look like a
     * board, and the three on the hexagon lattice are the strangest here —
     * they were reachable only through the family each one is scored by,
     * which is not how anybody looks for them.
     *
     * AND THE QUEUE AND TWIST GAMES CAME HERE TOO. John, 2026-09-22: "We can
     * probably merge Pieces/Twists with Strange Boards as one family." They
     * belong: a board you may only fill two squares of at a time, and a board
     * that rotates a quarter of itself after every stone, are boards that do
     * not behave in exactly the sense this shelf means. `strange-boards` keeps
     * the key — `pieces-and-twists` has no rows at all on the live XP ledger,
     * so nothing is paid twice either way and the busier key is the safer one.
     *
     * AND THE ROCK GAMES, 2026-09-26: Scattered Rocks and Rockfall, the two
     * the obstacle playtest named, sit beside Obstacle Five. The shelf was
     * full, so the two hexagon boards stopped being listed here as guests —
     * see `ALSO_LISTED_IN` for why and how to put them back — and the blurb
     * says rocks where it used to say hexagons.
     */
    blurb: "Boards that do not behave: edges that join, rocks in the way from the start or falling part way through, pieces laid from a queue, and quarters that turn.",
    games: ["toroidalFive", "obstacleFive", "scatteredRocks", "rockfall", "dominoFive", "blockFive", "twistFive", "twistFour"],
  },
  {
    key: "checkers",
    title: "Checkers",
    kanji: "チェッカー",
    blurb: "No lines, no queue, no board full of stones. Jump the other side's pieces off, or be left with no move at all.",
    games: ["checkers", "internationalDraughts", "brazilianDraughts", "canadianCheckers", "russianDraughts", "poolCheckers"],
  },
  {
    key: "territory",
    /*
     * GO AND HEX, WHICH WERE A SHELF EACH HOLDING ONE GAME. John, 2026-09-22:
     * "Territory/Connections (for Go and Hex) could be same family as well."
     * Both ask the same question and neither asks for a line: put stones down
     * and never move them, and win by what you have CLAIMED when nobody can
     * usefully add another — more of the board in Go, a path across it in Hex.
     * A family of one game is also a shelf nobody browses, and two of them
     * sitting next to each other was the clearest case on the page.
     *
     * `territory` keeps the key. Neither old key has a single row on the live
     * ledger, so this one was free either way.
     *
     * AND THE RACES CAME HERE TOO. John, 2026-09-24, making room for an eighth
     * family of number puzzles under the cap of eight: "merge Races +
     * Territory to mix Go, Halma, etc.. find a good merged name, if possible.
     * Could still be territory or Races & territory, you can decide." What
     * the four share is that none of them is about making a line or taking a
     * piece: each is won by WHERE YOU STAND ON THE BOARD at the end — the
     * ground you have surrounded, the two edges you have joined, the far camp
     * you have filled. "Territory and races" says both halves plainly, in
     * the shape "Turn and take" already has; a cleverer single word would
     * have to be explained on every shelf that shows it.
     *
     * `territory` keeps the key again, and `races` goes into
     * `FAMILY_ABSORBED`. Races is the busier of the two on the live ledger —
     * it was one of the eight keys the member counted in
     * `familiesMerged.test.ts` held — and a member holding `races` today
     * simply holds `territory` under the fold, paid once either way.
     */
    title: "Territory and races",
    kanji: "陣地と競走",
    blurb: "No lines to make. Win by where you stand when it ends: surround more of the board than the other side, join your own two edges, or get every piece into the far camp before they do.",
    games: ["go", "hex", "halma", "chineseCheckers"],
  },
  {
    key: "small-boards",
    title: "Small boards",
    kanji: "小盤",
    blurb: "Games you can read to the end, and games where the trick is what you must not do.",
    games: ["tictactoe", "wildTicTacToe", "notakto", "trapThree", "squareFour", "makerBreaker"],
  },
  {
    key: "numbers",
    /*
     * THE PUZZLES. John, 2026-09-24: "adding a new category to the site.
     * Numbers... for introducing Sudoku." One person, one grid, one answer:
     * nothing here is a game between two colours, and the engine plays
     * none of it. Each is a `PuzzleKind` (`src/lib/puzzles/`), catalogued
     * beside the games through `GameKey`, and the family is the eighth
     * shelf — the room the races made by joining Territory the same day.
     * See docs/plans/numbers/README.md for why a puzzle is its own kind.
     */
    title: "Numbers",
    kanji: "数",
    blurb: "Puzzles for one: a grid, a few givens, and exactly one answer. Solve it on your own, against the clock.",
    games: ["numberPlace", "jigsaw", "diagonal", "sumCages", "moreOrLess", "towers"],
  },
  {
    key: "logic",
    /*
     * LOGIC PUZZLES. John, 2026-09-28: "I think more games is nice." Numbers
     * held its eight, the most a shelf shows, so the grid puzzles that are not
     * a Number Place — islands and bridges first, then a picture to uncover
     * from its row and column counts, walls of sea around numbered islands,
     * one loop round numbered squares — have a shelf of their own. What they
     * share is the pencil puzzle's promise: a grid, a handful of clues, one
     * answer, and nothing to do but reason it out.
     *
     * 理詰め (rizume): working a thing out by reason, one step forced by the
     * last. Chosen over 論理 (ronri, "logic"), which is the word on a
     * university course; 理詰め is the word for how a person actually solves
     * one of these, and it sits beside 落とし and 変盤 as an everyday word.
     *
     * NOTHING MOVED IN, until John moved one. Hidden Stones and Black and
     * White would sit here as well as they sit in Numbers — neither has a
     * digit in it — and Tsunagi, our Numberlink, is a logic puzzle living in
     * Other. Each stayed where it was: a first solve of each had already paid
     * `firstOfFamily` under its family's key, and moving one makes that
     * family's award a thing a newcomer earns from a different set of games
     * than everybody before. That was said, and left to John.
     *
     * Both moved here on 2026-10-01. John: "Hidden Stones isn't really a
     * numbers game. doesn't make sense there", then "black and white is a
     * logic puzzle i guess". One is a stone in every row, column and region,
     * the other half of each colour in every line; neither has a number in
     * it. The `firstOfFamily` rows already paid under Numbers stay paid;
     * nothing is clawed back.
     *
     * Picture logic 絵解き (2026-09-29) is the second: the picture to uncover
     * from its row and column counts the first note promised.
     *
     * Suido 水道 (2026-10-01) is the third: pipes that can only be turned, one
     * answer, and the water drawn flowing as they join. It is a logic puzzle of
     * the same promise, and a grid of pieces rather than of numbers, so it is
     * here and not in Numbers (which was full at eight). Its 3,328 fixed
     * levels (2026-10-01) are numbered boards the same for everybody, as
     * Tsunagi's are, beside the boards it makes.
     */
    title: "Logic puzzles",
    kanji: "理詰め",
    blurb: "Puzzles for one that are not a grid of numbers to fill: islands to join with bridges, a picture to uncover from its counts, pipes to turn until the water runs through, stones to place one to a row, column and region, lines to fill half black and half white, and more to come. A few clues, one answer, and nothing to do but reason it out.",
    games: ["bridges", "pictureLogic", "suido", "hiddenStones", "blackAndWhite"],
  },
  {
    key: "cards",
    /*
     * CARDS. John, 2026-09-29: "Let's create 3 new types of game (card,
     * mahjong, dominos)", and first of the cards "Solitair classic game". The
     * shelf for games played with the one deck the site draws
     * (`src/lib/cards/`, `src/components/cards/`): Solitaire first, a patience
     * for one kept and timed as a puzzle is, and the family games for a table
     * of several to follow — Hearts, Big Two, President, Go Fish, Crazy Eights.
     *
     * 札 (fuda): a card — the word in karuta and hanafuda, Japan's own card
     * games. Chosen over トランプ, the everyday word for a Western deck, which
     * is a loanword with nothing of the table in it; 札 is a card of any kind,
     * as this shelf will be.
     */
    title: "Cards",
    kanji: "札",
    blurb: "Games with a deck of cards, drawn by us: Solitaire, FreeCell and Spider for one, and the family card games round one device, with a computer in any empty seat.",
    /*
     * And the family card games (2026-09-29), party games at home here rather
     * than on Party games: a card game is the kind of game it is, and who is
     * round the table is how it is played. Nothing of them is recorded, so
     * this family's first and its award are still the patience games' alone.
     * FreeCell and Spider (2026-09-30) sit beside Solitaire, the three
     * patience games first, kept and timed as it is.
     *
     * Hearts moved to Table cards (below, Tricks until 2026-10-01) with Spades on 2026-09-30, so this shelf
     * keeps room for Gin Rummy under the eight a shelf holds.
     */
    games: ["solitaire", "freecell", "spider", "crazyEights", "goFish", "bigTwo", "president", "ginRummy"],
  },
  {
    key: "table-cards",
    /*
     * TABLE CARDS 場札. John, 2026-10-01, of two shelves on /games, Tricks and
     * Colour cards: "Uno type and Tricks games should be combined. I don't
     * like the Colour Cards category." One shelf for the card games a table
     * plays a card at a time, round one device with a computer in any empty
     * seat, that Cards (full at eight) does not hold: the trick-taking games,
     * Hearts, Spades, Euchre and Oh Hell, Cribbage, War, and Hitotsu, the
     * match-the-colour game with a deck of its own.
     *
     * It replaces Tricks (split off Cards on 2026-09-30, when Spades arrived
     * and Cards was full) and Colour cards (2026-09-30, Hitotsu's own shelf).
     * Both are `FAMILY_ABSORBED` into it. Neither held a recorded game, so no
     * ledger row can name either key.
     *
     * THE NAME is not "Tricks" because Hitotsu, Cribbage and War take no tricks
     * and a shelf named for one way of playing would be wrong about a third of
     * itself. "Table cards" says what they share, cards played round a table,
     * and sits beside Cards without borrowing its name. 場札 (bafuda) is the
     * cards laid out on the table in karuta and hanafuda, 札 being Cards' own
     * word. It is not the whole difference from Cards: Cards is the patience
     * games for one and the family games that fit its eight, and this shelf is
     * where the rest of the table's card games go.
     *
     * Crazy Eights, the game Hitotsu grew out of, stays at home in Cards and is
     * no longer listed here (`ALSO_LISTED_IN`): a guest on this shelf would
     * leave it no room for its next game, and Hitotsu's own page tells the
     * lineage.
     *
     * Its games are party games, never recorded, so, like Party games, it counts
     * towards no award, has a page of its own at /games/table-cards, and stays
     * off the set-up screen.
     */
    title: "Table cards",
    kanji: "場札",
    blurb: "Card games for a table, played a card at a time with a computer in any empty seat: take none of the hearts, bid the tricks you will take, peg your way to 121 at cribbage, turn your cards over at War, or match the colour or the number to be first out of cards at Hitotsu.",
    games: ["hearts", "spades", "euchre", "ohHell", "cribbage", "war", "hitotsu"],
    notOnSetUp:
      "A table card game is played by a table of people and computers on one device, or on several for Hitotsu, set up from the game's own page; the set-up screen makes a game between two seats.",
  },
  {
    key: "tiles",
    /*
     * TILES 牌. John, 2026-10-01, of two shelves of one game each on /games,
     * Mahjong and Dominoes: "Adjust: mahjong and Dominoes stuff... as Tiles
     * games", and then of the cube: "Cubes work should go there too really,
     * like Rubik." So the games played with pieces you match, line up or turn
     * are one shelf: Mahjong Solitaire (matching pairs of free tiles off a
     * stacked layout, alone or by turns round one device), Mexican Train
     * (dominoes, two to eight round one device) and the cube.
     *
     * It replaces Mahjong (2026-09-29), Dominoes (2026-09-29) and Cubes
     * (2026-09-30), which are `FAMILY_ABSORBED` into it: a member paid a
     * `firstOfFamily` under any of those keys keeps the payment, and it counts
     * as this family met. The four-player game of hands, Riichi
     * (docs/plans/mahjong/README.md), would be at home here later.
     *
     * 牌 (hai): a tile — the word for a mahjong tile, and the one in 骨牌 and
     * ドミノ牌, a domino. The cube's stickers are tiles too, which is why this
     * reads true of the three and 立方, which was the cube's alone, did not.
     *
     * Its page is Mahjong Solitaire's (`familyPagePath`), the first game
     * of the three that is kept and recorded; Mexican Train, a party game,
     * is set up at its own table from its own page.
     */
    title: "Tiles",
    kanji: "牌",
    blurb: "Games played with tiles: take matching pairs of free tiles off a stacked mahjong layout, match the ends of dominoes and build your train out of the hub, or turn a cube of coloured tiles until every face is one colour.",
    games: ["mahjong", "mexicanTrain", "cube"],
  },
  {
    key: "dice",
    /*
     * DICE 賽子. John, 2026-09-30: "Did we create a dice rolling game [where]
     * you just roll a dice and have fun that way?" A family for the games
     * played with dice alone, opened with Yacht: five dice, three rolls, a
     * sheet of thirteen boxes, alone or round one device. Its own shelf rather than Party games, which already
     * shows its eight. 賽子 (saikoro) is the everyday word for a die. Pachisi,
     * the race game of the cross and circle, joined it the same day (John:
     * "I think Parcheesi was another one from the past"). Dice War (2026-10-01,
     * John: "Dice game: war? Or higher number? Something super simple with just
     * rolling dice and keeping score") joined it the same way: everybody rolls,
     * the highest scores, a tie is war.
     *
     * Its games are party games, played round one device and never recorded,
     * so, like Party games, it counts towards no award (`RECORDED_FAMILIES`),
     * has a page of its own at /games/dice, and stays off the set-up screen,
     * which makes games between two.
     */
    title: "Dice",
    kanji: "賽子",
    blurb: "Games the dice decide: roll, hold the ones you want and score what they make, race your pawns home by what they show, or roll against the table for the highest total.",
    games: ["yacht", "pachisi", "diceWar"],
    notOnSetUp:
      "A dice game is played alone or by a table of people on one device, set up from the game's own page; the set-up screen makes a game between two seats.",
  },
  {
    key: "party",
    /*
     * PARTY GAMES. John, 2026-09-28, of Kumimoji's pass and play for up to
     * eight: "That's probably a new category, party games, and then the
     * Chinese checkers is a game for six people I believe and we should also
     * allow people to play that in a pass and play sort of way."
     *
     * A SHELF WITH NO GAME AT HOME IN IT, and the first. Every game here
     * already has a family that says what KIND of game it is, and a party is
     * not a kind of game: it is who is sitting round the table. So each game is
     * shown here from its own home, through `ALSO_LISTED_IN`, with the reason
     * it belongs — the same game, never a copy — and this family counts,
     * plays and pays nothing of its own: no crowns, no ladder, no XP for a
     * first game of it (see `HOME_FAMILIES`). Its page is its own address,
     * `/games/party`, since a family page is otherwise found under a game
     * that lives in it (`familyPagePath`).
     *
     * 団欒 (danran): a group gathered in a circle for company, the word for a
     * family round its table of an evening — which is exactly a phone passed
     * round, and says nothing of the drink that 宴 (a banquet) would.
     */
    /*
     * AND THE GAMES THAT ARE NOTHING BUT A PARTY GAME, 2026-09-28: Dots and
     * Boxes for two to six, the first `PartyKind` (`lib/party/`). It is not a
     * game between two colours with a table mode, as Chinese Checkers is — the
     * table IS the game — so it lives here, at home, and the guests are shown
     * after it. Nothing of it is ever recorded, so this family still counts
     * towards no award (`RECORDED_FAMILIES`) and keeps its own page.
     *
     * Mancala joined it the same day: Kalah or Oware for two, passed across
     * one device, a party game rather than a rule variant because a sowing is
     * nothing the engine's stones-on-points can play.
     *
     * And Tenka 天下, world conquest for two to six, the same day.
     */
    title: "Party games",
    kanji: "団欒",
    blurb: "Games for a group round one phone or tablet. Take your turn, then pass it on.",
    /*
     * And Superghost (2026-09-28), the word game for two to eight, in English
     * or Japanese: the second at home here. And Mancala the same day, Kalah or
     * Oware for two; and Tenka, world conquest for two to six.
     */
    games: ["dotsAndBoxes", "superghost", "mancala", "tenka"],
    notOnSetUp:
      "A party game is played by a table of people on one device, set up from the game's own page; the set-up screen makes a game between two seats.",
  },
  {
    key: "other",
    /*
     * OTHER. John, 2026-09-25, asking for a word puzzle of our own: "a special
     * OTHER category" on the games list, the cards and the families, and kept
     * off the set-up screen for now so it ships sooner. The home of whatever is
     * neither stones nor numbers, starting with Gomoji.
     */
    title: "Other",
    kanji: "その他",
    blurb: "Neither stones nor digits: a hidden word to find in six guesses, in English, French, German or kana, pairs of marbles to join with lines, tiles to build into your own crossword, and six words to swap into a lattice.",
    /* Tsunagi and Kumimoji joined 2026-09-26, and Koushi the same day: puzzles for one with no digits in them, and Numbers already holds its eight. */
    /* One Gomoji: its languages and word lists are settings of it, chosen on its set-up (`gameSettings.ts`, John, 2026-09-28). */
    /* On the set-up screen since 2026-09-30: its four puzzles each draw their own preview there (`PuzzleBoardPreview`), which was what kept it off. */
    games: ["gomoji", "tsunagi", "kumimoji", "koushi"],
  },
];
