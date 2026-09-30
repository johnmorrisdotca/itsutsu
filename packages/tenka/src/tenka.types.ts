/**
 * Tenka 天下, as its rules (`tenka.ts`) speak of it: the world-conquest game
 * for two to six players.
 *
 * A TERRITORY IS A NUMBER, its place in `TENKA_TERRITORY_DATA` (0 to 41,
 * continent by continent), and a CARD is a number too: 0 to 41 the card of
 * that territory, 42 and 43 the two wild cards. A SEAT is a player's place
 * round the table, 0 first; the neutral army of a game for two is
 * `TENKA_NEUTRAL`, which is nobody's seat.
 */

export type TenkaContinentKey = "northAmerica" | "southAmerica" | "europe" | "africa" | "asia" | "oceania";

/** One territory as the map script writes it: neighbours by land and by sea are indices into the same list. */
export type TenkaTerritoryData = {
  key: string;
  name: string;
  continent: TenkaContinentKey;
  land: readonly number[];
  sea: readonly number[];
};

/** A continent: its name, the armies holding all of it is worth each turn, and its territories. */
export type TenkaContinent = {
  key: TenkaContinentKey;
  name: string;
  kanji: string;
  bonus: number;
  territories: readonly number[];
};

/** How the world is drawn, in map units (`tenkaShapes.data.ts`, written by scripts/map.mjs). */
export type TenkaShapes = {
  width: number;
  height: number;
  /** Where each territory's army counter stands. */
  labels: readonly (readonly number[])[];
  /** Each territory's extent, left, top, right, bottom: what a view frames to show it. */
  boxes: readonly (readonly number[])[];
  /** Each sea link's dashed line, x1 y1 x2 y2; the crossing of the Bering Strait is two, one off each edge. */
  seaLines: readonly (readonly number[])[];
  /** The borders between continents, one SVG path, drawn heavier. */
  continentBorders: string;
  /** Each territory's outline, one SVG path, in territory order. */
  outlines: readonly string[];
};

export type TenkaSeat = number;

/** Who holds a territory: a seat, or `TENKA_NEUTRAL`. */
export type TenkaOwner = number;

/** A territory's card (0–41) or a wild card (42, 43). */
export type TenkaCard = number;

export type TenkaCardKind = "land" | "sea" | "air" | "wild";

/**
 * Where a turn is. `setUp` is the placing of the starting armies by hand,
 * one each round the table; `reinforce` the placing of a turn's new armies
 * (and trading cards for more); `attack` rolling against a neighbour;
 * `occupy` choosing how many move into a territory just taken; `fortify`
 * choosing one move between two of your own connected territories, and
 * `shift` how many armies it moves; `over` the end.
 */
export type TenkaPhase = "setUp" | "reinforce" | "attack" | "occupy" | "fortify" | "shift" | "over";

/** Starting armies placed at random, or by hand in turn. */
export type TenkaPlacing = "auto" | "hand";

export type TenkaMove =
  | { kind: "place"; territory: number; armies: number }
  | { kind: "trade"; cards: readonly TenkaCard[] }
  | { kind: "attack"; from: number; to: number; dice: number }
  /** Attack again and again with every die allowed, until the territory falls or only one army is left to attack with. */
  | { kind: "blitz"; from: number; to: number }
  | { kind: "occupy"; armies: number }
  | { kind: "endAttack" }
  | { kind: "fortify"; from: number; to: number }
  | { kind: "shift"; armies: number }
  | { kind: "endTurn" };

export type TenkaMoveKind = TenkaMove["kind"];

/** One roll of the dice — or the last of a run of them (`blitz`) — what each side threw, highest first, and what each lost in all. */
export type TenkaRoll = {
  from: number;
  to: number;
  attacker: TenkaSeat;
  defender: TenkaOwner;
  attackDice: readonly number[];
  defendDice: readonly number[];
  /** Armies lost, over every throw of the run. */
  attackerLost: number;
  defenderLost: number;
  /** How many times the dice were thrown: one for a single attack. */
  throws: number;
  /** Whether this roll took the territory. */
  took: boolean;
};

/** The last set of cards traded in, for the table to see: by whom, for how many, and the territory that got two more. */
export type TenkaTrade = { seat: TenkaSeat; cards: readonly TenkaCard[]; armies: number; bonusTerritory: number | null };

/**
 * A game, as its moves make it. Only the table — `seed`, `players`,
 * `rounds`, `placing` — and `moves` are ever kept (`encodeTenka`); everything
 * else is read again from them, dice and all, since every die is drawn from
 * the game's own seeded random (`rng`). A kept game can never hold a world
 * its moves do not make.
 */
export type TenkaGame = {
  /** The seed every shuffle, deal and die of this game is drawn from. */
  seed: number;
  /** The names given at the table, in seat order: "" for one left blank. */
  players: readonly string[];
  /** How many rounds before the count: `TENKA_WORLD_ROUNDS` for the whole world. */
  rounds: number;
  placing: TenkaPlacing;
  /** Every move made, in order: the game's whole record. */
  moves: readonly TenkaMove[];

  /** The random's state after everything drawn so far. */
  rng: number;
  /** The seat that plays first each round. */
  first: TenkaSeat;
  /** The round being played, from 1. */
  round: number;
  toPlay: TenkaSeat;
  phase: TenkaPhase;
  /** Per territory, who holds it. */
  owners: readonly TenkaOwner[];
  /** Per territory, how many armies stand there. */
  armies: readonly number[];
  /** Per seat, the cards in hand. */
  hands: readonly (readonly TenkaCard[])[];
  /** The cards still to draw, top first. */
  deck: readonly TenkaCard[];
  /** The cards traded in, shuffled back when the deck runs out. */
  discards: readonly TenkaCard[];
  /** How many sets have been traded in this game, by anybody: what the next set is worth. */
  trades: number;
  /** Armies waiting to be placed this turn. */
  reserve: number;
  /** Per seat, starting armies still to place by hand. */
  setUpLeft: readonly number[];
  /** Whether the player to move has taken a territory this turn: a card at its end. */
  conquered: boolean;
  /** The territory just taken, and the least that must move in. */
  occupying: { from: number; to: number; least: number } | null;
  /** The two territories of the fortifying move chosen, waiting for how many. */
  shifting: { from: number; to: number } | null;
  /** The last roll of this turn, for the table to see. */
  lastRoll: TenkaRoll | null;
  lastTrade: TenkaTrade | null;
  /** The card drawn at the end of the last turn, and by whom. */
  lastDraw: { seat: TenkaSeat; card: TenkaCard } | null;
  /** Per seat, whether they are out: no territory left. */
  out: readonly boolean[];
  /** The last player knocked out, and by whom. */
  lastOut: { seat: TenkaSeat; by: TenkaSeat } | null;
  /** On a finished game, every seat that won. Empty while playing. */
  winners: readonly TenkaSeat[];
};

/** A choice made on the map and not yet a move: where from, where to, and how many armies (`tapTerritory`). */
export type TenkaChoice = {
  from: number | null;
  to: number | null;
  /** How many armies move, when there is a number to choose. */
  armies: number;
  /** The last territory a reinforcing army was placed on, for "all the rest here". */
  placedOn: number | null;
};

/** What the map lights up for a choice (`marksFor`): the territory chosen, what it can reach, and the target. */
export type TenkaMapMarks = {
  chosen: number | null;
  reach: readonly number[];
  target: number | null;
};
