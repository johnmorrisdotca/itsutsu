// Relative, not `@/`: the browser specs import this file, and Playwright resolves no alias in what it imports.
import { type GameKey, isPartyKind, isRuleVariant } from "../catalogue/gameKeys";

import { ALSO_LISTED_IN } from "./familyShelves";
import type { GameFamily, ShelvedGame } from "./families.types";
import type { RuleVariant } from "./gomoku.types";
import { familyPath } from "./slugs";

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
    games: ["numberPlace", "jigsaw", "diagonal", "sumCages", "moreOrLess", "towers", "hiddenStones", "blackAndWhite"],
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
     * NOTHING MOVED IN. Hidden Stones and Black and White would sit here as
     * well as they sit in Numbers — neither has a digit in it — and Tsunagi,
     * our Numberlink, is a logic puzzle living in Other. Each stays where it
     * is: a first solve of each has already paid `firstOfFamily` under its
     * family's key, and moving one would make that family's award a thing a
     * newcomer earns from a different set of games than everybody before.
     * Say so, and leave the decision to John.
     */
    title: "Logic puzzles",
    kanji: "理詰め",
    blurb: "Puzzles for one that are not a grid of numbers to fill: islands to join with bridges, and more to come. A few clues, one answer, and nothing to do but reason it out.",
    games: ["bridges"],
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
     */
    title: "Party games",
    kanji: "団欒",
    blurb: "Games for a group round one phone or tablet. Take your turn, then pass it on.",
    /*
     * And Superghost (2026-09-28), the word game for two to eight, in English
     * or Japanese: the second at home here. And Mancala the same day, Kalah or
     * Oware for two.
     */
    games: ["dotsAndBoxes", "superghost", "mancala"],
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
    games: ["gomoji", "gomojiKana", "gomojiMot", "gomojiWort", "gomojiPop", "tsunagi", "kumimoji", "koushi"],
    notOnSetUp: "John, 2026-09-25: shown on the games list, cards and families, and kept off the set-up screen so it ships sooner.",
  },
];

/**
 * Whether any of a family's own games is one this site keeps a record of — a
 * rule variant or a puzzle — rather than only party games, which are played
 * and kept in one browser (`isPartyKind`). A shelf of guests keeps none.
 */
export function familyKeepsRecords(family: GameFamily): boolean {
  return family.games.some((game) => !isPartyKind(game));
}

/**
 * THE FAMILIES THAT ARE SOME GAME'S HOME: every family but a shelf of guests
 * alone. What a list of every game, each once under its home, is drawn from
 * (`GameList`), so a party game has its section like any other.
 */
export const HOME_FAMILIES: GameFamily[] = GAME_FAMILIES.filter((family) => family.games.length > 0);

/**
 * THE FAMILIES A RECORDED GAME IS PLAYED FROM: the families some rule variant
 * or puzzle calls home.
 *
 * What "every family" means wherever one is counted towards an award or a
 * tour — `everyFamilyPlayed` is paid for a first game in each of these — so a
 * family nobody can be seen to play a game from (Party games, whose own games
 * never reach the server) would make it a prize no member could ever finish.
 * Two lists rather than one name covering both: "where a game lives" and
 * "where a game is counted" stopped being the same families the day Dots and
 * Boxes moved in.
 */
export const RECORDED_FAMILIES: GameFamily[] = GAME_FAMILIES.filter(familyKeepsRecords);

/**
 * WHERE A FAMILY'S PAGE IS. For a family some recorded game calls home, under
 * the first of its games — `/games/<slug>/family`, the address it has always
 * had, since "the family Renju is in" is a question about Renju. A family with
 * no recorded game — Party games, a shelf of guests and the party games at
 * home in it — has an address of its own at `/games/<key>`: an address the
 * gate already reads as the catalogue's, open to anybody, and a folder of its
 * own under `src/app/games` (`families.coverage.test.ts` holds every such
 * family to one). A party game's own `/family` is not answered: its family
 * already has this one.
 */
export function familyPagePath(family: GameFamily): string {
  const first = family.games.find((game) => !isPartyKind(game));
  return first === undefined ? `/games/${family.key}` : familyPath(first);
}

/**
 * The games in a family the engine plays: its rule variants, its puzzles and
 * party games left out. The two-player set-up, a ladder, a record and the
 * played-figures read this; anything that names or counts a family's games
 * reads `family.games`.
 */
export function boardGamesOf(family: GameFamily): RuleVariant[] {
  return family.games.filter(isRuleVariant);
}

/**
 * THE MOST GAMES ONE SHELF SHOWS, its own and its guests together.
 *
 * John, 2026-09-22: "I want to have MAX 8 items per family". A shelf longer
 * than that is a third line of games on the set-up screen, and a list rather
 * than a choice. A game added to a full family, or a guest listed on one, fails
 * `variants.coverage.test.ts` — so the question "what could be merged or taken
 * out?" is asked the day the ninth arrives, not found on a screen later.
 */
export const FAMILY_MOST_GAMES = 8;

/**
 * THE FAMILIES THAT WERE FOLDED INTO OTHERS, and the one they went to.
 *
 * Three shelves became one each on 2026-09-22, on John's reading of the set-up
 * screen: "Less categories… merge Pieces/Twists with Strange Boards as one
 * family… Territory/Connections (for Go and Hex) could be same family as
 * well… Flips and Captures are kind of the same concept."
 *
 * THIS TABLE EXISTS BECAUSE A KEY IS A THING SOMEBODY HAS BEEN PAID UNDER.
 * `firstOfFamily` writes the family's key into the XP ledger and is paid once
 * per `(member, type, subject)`, so a retired key does not stop meaning
 * anything the moment it leaves `GAME_FAMILIES` — there are rows holding it.
 * Read forward through here, a row written under `captures` is a row for the
 * family that absorbed it, which is what stops a member being counted as
 * having met eight families when three of their rows are two.
 *
 * It is not a redirect table for addresses: a family has no address of its own
 * (a family page is `/games/<slug>/family`, keyed by the GAME), so nothing a
 * reader could have bookmarked breaks. Only the ledger remembers these.
 *
 * Nothing is removed from here once it is in it. A key retired today has rows
 * against it for as long as the ledger exists.
 */
export const FAMILY_ABSORBED: Record<string, string> = {
  captures: "flips",
  "pieces-and-twists": "strange-boards",
  connections: "territory",
  /* 2026-09-24: Halma and Chinese Checkers joined Go and Hex, making room
     under the cap of eight for a family of number puzzles. */
  races: "territory",
};

/**
 * The family a key means TODAY: itself, or the family that absorbed it.
 *
 * Anything counting families over stored rows reads this first. A key that is
 * neither current nor retired comes back unchanged rather than null: this
 * answers "what is this called now", and a key from a future nobody here knows
 * about is not a question this can refuse usefully.
 */
export function familyKeyNow(key: string): string {
  return FAMILY_ABSORBED[key] ?? key;
}

/** Whether a family's shelf shows this game, at home or as a guest. */
export function familyShows(family: GameFamily, variant: GameKey): boolean {
  return (
    family.games.includes(variant) ||
    (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key)
  );
}

/**
 * The games a family's shelf shows: its own, in their load-bearing order, then
 * the guests listed on it from other families, each carrying its home.
 *
 * A family's COUNTS read `family.games`, never this: a guest is counted once,
 * at home.
 */
export function gamesShownIn(family: GameFamily): ShelvedGame[] {
  const own: ShelvedGame[] = family.games.map((variant) => ({ variant, listed: "home" }));
  const guests = (Object.keys(ALSO_LISTED_IN) as GameKey[]).flatMap((variant): ShelvedGame[] => {
    const home = familyOf(variant);
    const listedHere = (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key);
    const listing = (ALSO_LISTED_IN[variant] ?? []).find((one) => one.family === family.key);
    return home === null || home.key === family.key || !listedHere || listing === undefined
      ? []
      : [{ variant, listed: "shelf", home, why: listing.why }];
  });
  return [...own, ...guests];
}

/**
 * A family's shelf with its puzzles and party games left off: what the
 * two-player set-up screen draws. Either on that screen would be a tile the
 * board cannot show; each is set up from its own page.
 */
export function boardGamesShownIn(family: GameFamily): (ShelvedGame & { variant: RuleVariant })[] {
  return gamesShownIn(family).filter((shown): shown is ShelvedGame & { variant: RuleVariant } => isRuleVariant(shown.variant));
}

/** The other games in the family a variant belongs to, for "also try" links. */
export function siblingsOf(variant: GameKey): { family: (typeof GAME_FAMILIES)[number]; games: GameKey[] } | null {
  const family = GAME_FAMILIES.find((entry) => entry.games.includes(variant));
  if (family === undefined) return null;
  return { family, games: family.games.filter((game) => game !== variant) };
}

/**
 * The family a variant belongs to, whole — the game itself included.
 *
 * Deliberately not `siblingsOf`, which leaves the game out because it exists
 * to say "also try". A family PAGE is about the family, and a list of a
 * family's games that omits the one you are standing in is a list that is
 * wrong about the family. Two questions, two functions.
 */
export function familyOf(variant: GameKey): (typeof GAME_FAMILIES)[number] | null {
  return GAME_FAMILIES.find((entry) => entry.games.includes(variant)) ?? null;
}

/**
 * The key of the family a variant belongs to, or null when it is in none.
 *
 * Null rather than the variant's own name or an empty string, and the caller
 * has to deal with it: the XP ledger keys an award on this, and a stand-in
 * value would be a family that does not exist earning a family's award. Every
 * variant is in a family today and `variants.coverage.test.ts` keeps it that
 * way, so null is the answer to a question about a game that has not been put
 * in one yet — which is a thing to stay silent about, not to guess at.
 */
export function familyKeyOf(variant: GameKey): string | null {
  return familyOf(variant)?.key ?? null;
}

/**
 * HOW MANY GAMES A FAMILY'S SHELF HOLDS, in words: its own, then any listed
 * from other families said apart, since a guest is counted once, at home. A
 * shelf of guests alone says so rather than "0 games".
 */
export function familyCountWords(family: GameFamily): string {
  return shelfCountWords(family.games.length, gamesShownIn(family).length - family.games.length);
}

/** The same words from the two counts, for a caller holding a family's copy rather than the family. */
export function shelfCountWords(home: number, guests: number): string {
  const games = (count: number) => `${count} ${count === 1 ? "game" : "games"}`;
  if (guests === 0) return games(home);
  if (home === 0) return `${games(guests)} from other families`;
  return `${games(home)}, and ${guests} from other families`;
}
