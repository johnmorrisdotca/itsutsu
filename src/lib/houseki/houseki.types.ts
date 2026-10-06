/**
 * THE HOUSEKI GAMES (宝石, the gem and stone puzzles): five games for one
 * person, from `@johnmorrisdotca/houseki`. They are a fifth kind of game
 * beside the rule variants, the puzzles, the party games and the casual games:
 * a level at a time (fifty to a hundred of them, graded), a Daily for four of
 * the five, and a free game to play as long as one likes; played in the browser
 * by the package's engines, kept there until finished, and a won level is
 * worth Itsutsu Points once the server has replayed it
 * (`docs/plans/houseki/README.md`).
 */
export type HousekiKind = "fallingTriplets" | "colourChains" | "stoneCollapse" | "gemSwap" | "magneticBlocks";

/** The campaigns a game's levels are in: Colour Chains has three, every other game one. */
export type HousekiCampaign = "classic" | "shizen" | "arashi";

/** How a game moves: pieces that fall in real time, or a board that waits for a move. */
export type HousekiMotion = "falling" | "turns";

/** A board size a free game offers: a name, and what it comes to. */
export type HousekiSize = { id: string; width: number; height: number };

/** What a game is, apart from its words. */
export type HousekiSpec = {
  /** The package's entry point (`@johnmorrisdotca/houseki/<id>`), which is also the game's address. */
  id: string;
  motion: HousekiMotion;
  /** The levels of each campaign it has, and how many. */
  campaigns: Partial<Record<HousekiCampaign, number>>;
  /** Guided lessons it has, in the package. */
  lessons: number;
  /** Whether it has a Daily: the same game for everybody on a date. */
  daily: boolean;
  /** The sizes a free game is offered in, the first being the one it starts on. */
  sizes: readonly HousekiSize[];
  /** Colour counts a free game offers, the first being its start. */
  colours: readonly (4 | 5 | 6)[];
  /** Whether a free game can be Arcade (a clock drops the pieces) as well as Relaxed. */
  arcade: boolean;
};

/** What a visitor asked a play page for: one level, a lesson, today's Daily, or a free game. */
export type HousekiRequest =
  | { kind: "level"; campaign: HousekiCampaign; number: number }
  | { kind: "lesson"; number: number }
  | { kind: "daily" }
  | { kind: "free"; size: string; colours: 4 | 5 | 6; arcade: boolean };
