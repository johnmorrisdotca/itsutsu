// Relative, not `@/`: the browser specs import this file, and Playwright resolves no alias in what it imports.
import { type GameKey, isPuzzleKind } from "../catalogue/gameKeys";

import type { AlsoListing, GameFamily, ShelvedGame } from "./families.types";
import type { RuleVariant } from "./gomoku.types";

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
    games: ["freestyle", "standard", "renju", "omok", "caro", "connect6", "misereFive"],
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
     */
    blurb: "Boards that do not behave: edges that join, squares you cannot use, pieces laid from a queue, quarters that turn, and two boards drawn on hexagons rather than squares.",
    games: ["toroidalFive", "obstacleFive", "dominoFive", "blockFive", "twistFive", "twistFour"],
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
    games: ["numberPlace", "jigsaw", "diagonal", "sumCages", "hiddenStones", "moreOrLess"],
  },
];

/**
 * The games in a family the engine plays: its rule variants, its puzzles
 * left out. The two-player set-up, a ladder, a record and the played-figures
 * read this; anything that names or counts a family's games reads
 * `family.games`.
 */
export function boardGamesOf(family: GameFamily): RuleVariant[] {
  return family.games.filter((game): game is RuleVariant => !isPuzzleKind(game));
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

/**
 * THE OTHER SHELVES A GAME IS FOUND ON, declared by the game.
 *
 * John, 2026-09-15: Small boards held Tic-tac-toe, a three-in-a-row, and had no
 * small Reversi, though one would belong there just as much. A family is a way
 * of finding a game, not a filing cabinet — so a game may be listed on another
 * family's shelf, for discovery, under three rules:
 *
 *  - ONE GAME, ONE IDENTITY. A listing is the same variant shown twice — the
 *    same rules, ratings, record and address — never a copy, and picking it
 *    from either shelf starts the same game. Its HOME is the family whose
 *    `games` holds it, and everything that must count a game once reads the
 *    home and only the home: its family page (`familyPath`), "also in this
 *    family" (`siblingsOf`), a family's figures on /games, and the XP for a
 *    first game of a family or a family won (`familyKeyOf`, `familyToWin`).
 *    So a guest adds no game, no play and no crown to the shelf it visits.
 *  - SAY WHERE ELSE IT LIVES. Every shelf that shows a guest says "also under"
 *    its home, so the repetition reads as meant.
 *  - A SHELF, NOT A CATALOGUE. Only a game somebody looking at that family for
 *    that family's reason would want to find, with the reason beside it — not
 *    every small variant of every game. `variants.coverage.test.ts` refuses a
 *    listing with no reason, one on the game's own family or a family that does
 *    not exist, and a game shown twice on one shelf.
 */
export const ALSO_LISTED_IN: Partial<Record<RuleVariant, readonly AlsoListing[]>> = {
  miniReversi: [
    {
      family: "small-boards",
      why: "Reversi on a 4×4 or 6×6 board is over in minutes: the quick small game somebody opening this shelf is after.",
    },
  ],
  twistFour: [
    {
      family: "small-boards",
      why: "Four in a row on a 4×4 board whose quarters turn: as small and as quick as Tic-tac-toe, with a trick in it.",
    },
  ],
  /*
   * THE BOARDS DRAWN ON HEXAGONS, on the shelf somebody would look for a
   * strange board on. Each keeps its home, because a home is the family a game
   * is SCORED by: Hex claims ground, Hexversi turns stones. Neither of those
   * shelves is where a reader goes when what caught their eye was the shape of
   * the board. (Chinese Checkers was here too, until the eight-game cap — see
   * its own entry below.)
   */
  hex: [
    {
      family: "strange-boards",
      why: "A rhombus of hexagons, and the only board here you win by crossing rather than by lining up.",
    },
  ],
  honeycomb: [
    {
      family: "strange-boards",
      why: "Reversi on a hexagon of hexagons, where a stone has six neighbours instead of eight and the middle is sealed.",
    },
  ],
  chineseCheckers: [
    /*
     * NOT ON STRANGE BOARDS ANY MORE, though its star is the strangest board
     * here. John, 2026-09-22: "I want to have MAX 8 items per family... so
     * strange boards has 9 items. what could be merged or taken out? Chinese
     * checkers?" It was the one game on three shelves — its home in Races
     * (Territory and races since 2026-09-24), and shown under Checkers for
     * its name and here for its board — so it is the one that could leave a
     * shelf and still be found twice.
     */
    /*
     * BY THE NAME, not by the rules. Nothing is captured in Chinese Checkers
     * and no piece is crowned, so it is not a game of draughts and its home
     * is with the races. But it is called Chinese Checkers, and the shelf marked
     * Checkers is the first place anybody looking for it will open. John,
     * 2026-09-22: "Checkers board should have Chinese checkers as well, since
     * the name." A shelf is for finding a game, and the name is how people
     * find this one.
     */
    {
      family: "checkers",
      why: "Checkers by name only: nothing is taken and nothing is crowned — you are racing your ten pieces to the far point of the star.",
    },
  ],
};

/** Whether a family's shelf shows this game, at home or as a guest. */
export function familyShows(family: GameFamily, variant: GameKey): boolean {
  return (
    family.games.includes(variant) ||
    (isPuzzleKind(variant) ? false : (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key))
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
  const guests = (Object.keys(ALSO_LISTED_IN) as RuleVariant[]).flatMap((variant): ShelvedGame[] => {
    const home = familyOf(variant);
    const listedHere = (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key);
    return home === null || home.key === family.key || !listedHere ? [] : [{ variant, listed: "shelf", home }];
  });
  return [...own, ...guests];
}

/**
 * A family's shelf with its puzzles left off: what the two-player set-up
 * screen draws. A puzzle on that screen would be a tile the board cannot
 * show; a puzzle is set up from its own page.
 */
export function boardGamesShownIn(family: GameFamily): (ShelvedGame & { variant: RuleVariant })[] {
  return gamesShownIn(family).filter((shown): shown is ShelvedGame & { variant: RuleVariant } => !isPuzzleKind(shown.variant));
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
