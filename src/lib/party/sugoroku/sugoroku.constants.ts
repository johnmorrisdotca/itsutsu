// Free of the package, like the rest of the party constants: the rules page, the catalogue and the set-up's own words import this, and a page's server function must not carry the rules for it (`sugoroku.test.ts` holds these to the package's own limits).
import { playerNumberName } from "../../gomoku/seatWords";
import type { Speaker } from "../../i18n/i18n";
import { partyTable } from "../../i18n/partyTables";

/**
 * THE SEVEN GAMES PLAYED ON THE BACKGAMMON BOARD, each a party game of its own
 * (`PartyKind`) in the Tables family, and each the package's variant of the
 * same key (`@johnmorrisdotca/sugoroku`, `VARIANT_KEYS`): the kind is how the
 * site names it, the variant is how the rules read it.
 */
export const SUGOROKU_KINDS = {
  backgammon: "backgammon",
  backgammonRace: "backgammonRace",
  antiBackgammon: "antiBackgammon",
  nackgammon: "nackgammon",
  longGammon: "longGammon",
  hypergammon: "hypergammon",
  tabula: "tabula",
} as const;

export type SugorokuKind = keyof typeof SUGOROKU_KINDS;

/** Every one, in the order its family shows them: the classic first. */
export const SUGOROKU_KIND_LIST: readonly SugorokuKind[] = [
  SUGOROKU_KINDS.backgammon,
  SUGOROKU_KINDS.nackgammon,
  SUGOROKU_KINDS.longGammon,
  SUGOROKU_KINDS.hypergammon,
  SUGOROKU_KINDS.backgammonRace,
  SUGOROKU_KINDS.antiBackgammon,
  SUGOROKU_KINDS.tabula,
];

/** The package's variant key for each kind. */
export const SUGOROKU_VARIANT_KEY = {
  backgammon: "backgammon",
  backgammonRace: "backgammon-race",
  antiBackgammon: "anti-backgammon",
  nackgammon: "nackgammon",
  longGammon: "long-gammon",
  hypergammon: "hypergammon",
  tabula: "tabula",
} as const satisfies Record<SugorokuKind, string>;

export type SugorokuVariantKey = (typeof SUGOROKU_VARIANT_KEY)[SugorokuKind];

/** Whether a catalogue key is one of the seven. */
export function isSugorokuKind(key: string): key is SugorokuKind {
  return Object.hasOwn(SUGOROKU_KINDS, key);
}

/**
 * THE MATCH LENGTHS EACH GAME IS PLAYED TO, in points: one is a single game, and
 * the rest are the matches the two sites printed in their names — Backgammon
 * (3 Point) to (9 Point), Pro Backgammon (5), Hypergammon (3 Point) and (5
 * Point), Pro Backgammon Race (5). A game the sites only offered single stays
 * single here: Anti-Backgammon and Tabula. These are the party contract's
 * "sizes", so the gate plays every one to its end, and what the table keeps as
 * its board size.
 *
 * Three games offer five, which is one more than the four tiles every other
 * set-up keeps: a length is not a board, and the set-up draws them as one row
 * of chips of one height whichever is chosen.
 */
export const SUGOROKU_LENGTHS: Record<SugorokuKind, readonly number[]> = {
  backgammon: [1, 3, 5, 7, 9],
  backgammonRace: [1, 5],
  antiBackgammon: [1],
  nackgammon: [1, 3, 5, 7, 9],
  longGammon: [1, 3, 5, 7, 9],
  hypergammon: [1, 3, 5],
  tabula: [1],
};

/** The length the set-up opens on: a single game, which is what the plain name was on both sites. */
export const SUGOROKU_DEFAULT_LENGTH = 1;

/** The most the party contract asks a game to offer in a set-up: four boards, and five lengths here. */
export const SUGOROKU_MOST_LENGTHS = 5;

/** The computer's four strengths, weakest first, as the package names them. */
export const SUGOROKU_STRENGTHS = ["random", "greedy", "careful", "strong"] as const;
export type SugorokuStrength = (typeof SUGOROKU_STRENGTHS)[number];

/** What each strength is called where it is chosen and where a seat is named, in plain words. */
export const SUGOROKU_STRENGTH_NAMES: Record<SugorokuStrength, string> = {
  random: "Beginner",
  greedy: "Casual",
  careful: "Careful",
  strong: "Strong",
};

/** The strengths' names in the speaker's language: Beginner, Casual, Careful, Strong, or their Japanese (`party.ja.tables.constants.ts`). */
export function sugorokuStrengthWords(say: Speaker): Record<SugorokuStrength, string> {
  return partyTable(SUGOROKU_STRENGTH_NAMES, "sugorokuStrengthNames", say.locale);
}

/** One line under the chosen strength: what it does, as the package describes it. */
export const SUGOROKU_STRENGTH_LINES: Record<SugorokuStrength, string> = {
  random: "Plays any legal move, never doubles, and takes every double.",
  greedy: "Plays the move that leaves the best position, with no look ahead.",
  careful: "Looks one turn ahead at its best four plays, and doubles and takes sensibly.",
  strong: "Looks one turn ahead at its best ten plays, and doubles and takes sensibly.",
};

/** The strength a computer seat opens on. */
export const SUGOROKU_DEFAULT_STRENGTH: SugorokuStrength = "careful";

/**
 * What a computer's seat is called at a table on several devices, and how its strength is read back: "Computer-Careful", one word, because the site
 * shows a name with a space in it as a first name and an initial (`shownName`), which would cut the strength off. It is said to the players as
 * "Computer (Careful)" (`sugorokuComputerShown`).
 */
export function sugorokuComputerName(strength: SugorokuStrength): string {
  return `Computer-${SUGOROKU_STRENGTH_NAMES[strength]}`;
}

/** A seat's name as a table says it: a computer's as "Computer (Careful)" (コンピュータ（慎重）), any other name as it is. */
export function sugorokuComputerShown(name: string, say: Speaker): string {
  const strength = SUGOROKU_STRENGTHS.find((one) => name === sugorokuComputerName(one));
  return strength === undefined ? name : say.say("party.sugoroku.computerShown", { strength: sugorokuStrengthWords(say)[strength] });
}

/** The strength a seat's name says, or null for a name that is no computer's of this game. */
export function sugorokuStrengthOfName(name: string): SugorokuStrength | null {
  return SUGOROKU_STRENGTHS.find((strength) => name === sugorokuComputerName(strength)) ?? null;
}

/** Where this browser keeps its game of one of the seven: one at a time per game, apart from every other table's. */
export function sugorokuStorageKey(kind: SugorokuKind): string {
  return `itsutsu.${kind}`;
}

/** The two seats: white is the first, black the second, as the package's sides are. */
export const SUGOROKU_SEATS = ["white", "black"] as const;

/** A seat's name as the table says it: the one typed, or "Computer" or "Player 2". */
export function sugorokuSeatName(players: readonly string[], computers: readonly boolean[], seat: number, say: Speaker): string {
  const given = players[seat]?.trim() ?? "";
  if (given !== "") return sugorokuComputerShown(given, say);
  return computers[seat] === true ? say.say("party.sugoroku.computerPlain") : playerNumberName(say, seat + 1);
}
