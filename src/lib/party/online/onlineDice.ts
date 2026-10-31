// By package name for Korokoro, which resolves from node_modules for Playwright too; the rest stays relative, as the browser specs resolve no alias.
import { decodeDiceWar, diceWarComputerFaces, diceWarOver, diceWarPeopleToRoll, diceWarWinners, encodeDiceWar, playDiceWar, startDiceWar, type DiceWarGame } from "@johnmorrisdotca/korokoro";

import { DICE_TABLE_RULES } from "../diceTable/diceTableRules";
import type { DiceTableKind } from "../diceTable/diceTable.constants";
import type { DiceTableBase, DiceTableRules } from "../diceTable/diceTable.types";
import { DICE_WAR_DICE, DICE_WAR_POINT_GOALS, DICE_WAR_ROUND_GOALS, DICE_WAR_SIDES } from "../diceWar/diceWar.constants";
import type { LiarsGame, LiarsMove } from "../liarsDice/liarsDice.types";
import { PARTY_SPECS } from "../party.constants";
import { playPachisi, startPachisi } from "../pachisi/pachisi";
import { decodePachisi, encodePachisi } from "../pachisi/pachisiCodec";
import type { PachisiGame, PachisiMove } from "../pachisi/pachisi.types";
import type { TenThousandMove } from "../tenThousand/tenThousand.types";
import { YACHT_PHASES, playYacht, startYacht } from "../yacht/yacht";
import { decodeYacht, encodeYacht } from "../yacht/yachtCodec";
import type { YachtGame, YachtMove } from "../yacht/yacht.types";

import { COMPUTER_SEAT_NAME } from "./online.constants";
import type { OnlineComputers, OnlineRules } from "./online.types";
import { NO_SEED, freshTableSeed, readSeen, writeSeen } from "./onlineSeen";

/**
 * THE DICE GAMES AT A TABLE ON SEVERAL DEVICES: Yacht, Pachisi, Dice War, Pig, Ten
 * Thousand, Liar's Dice and Sayu, the same pure rules each plays on one device.
 *
 * A DIE CANNOT BE TAMPERED WITH FROM A BROWSER, because a browser never says what one
 * shows. A move is "throw", with no faces in it: `readMove` keeps nothing else, and the
 * server throws, from a seed it drew itself (`freshTableSeed`), never one the host chose.
 *
 * NOR CAN ONE BE READ AHEAD, unlike the backgammon games, whose seed is in the text a
 * page decodes. The seed and the moves stay on the server, and a seat is sent the game
 * as it stands (`writeSeen`), so looking in a page's data shows the dice already thrown
 * and no others. At Liar's Dice a seat is also sent only its own cup.
 */

/** The table's own computer player, one level of it, sitting as "Computer"; its move is the worker's. */
const COMPUTER: OnlineComputers<unknown, unknown> = {
  levels: ["computer"],
  seat: () => ({ memberId: null, name: COMPUTER_SEAT_NAME }),
  levelOf: (seat) => (seat.memberId === null ? "computer" : null),
};

const countsOf = (spec: { fewestPlayers: number; mostPlayers: number }) => Array.from({ length: spec.mostPlayers - spec.fewestPlayers + 1 }, (_, at) => spec.fewestPlayers + at);

/** One flag a seat, from the seats the set-up gave to a computer. */
const flagsOf = (count: number, computers: readonly number[] | undefined) => Array.from({ length: count }, (_, seat) => computers?.includes(seat) === true);

const named = <G extends { players: readonly string[] }>(game: G, names: readonly string[]): G => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) });

const kindOf = (sent: unknown): unknown => (typeof sent === "object" && sent !== null ? (sent as { kind?: unknown }).kind : undefined);
const whole = (value: unknown, least: number, most: number): value is number => Number.isInteger(value) && (value as number) >= least && (value as number) <= most;

/* ---- Yacht ---- */

export const YACHT_ONLINE: OnlineRules<YachtGame, YachtMove> = {
  sizes: PARTY_SPECS.yacht.sizes,
  counts: countsOf(PARTY_SPECS.yacht),
  // A table of one is for one device: a table on several has somebody else at it.
  start: (size, count, extra) => (count < PARTY_SPECS.yacht.fewestPlayers ? null : startYacht(new Array<string>(count).fill(""), freshTableSeed(), flagsOf(count, extra?.computers), size)),
  encode: encodeYacht,
  decode: (text) => decodeYacht(text) ?? readSeen<YachtGame>("yacht", text),
  toPlay: (game) => (game.phase === YACHT_PHASES.finished ? null : game.toPlay),
  winners: (game) => (game.phase === YACHT_PHASES.finished ? game.winners : []),
  moveCount: (game) => game.moves.length,
  readMove: (sent) => {
    const { hold, box } = (sent ?? {}) as { hold?: unknown; box?: unknown };
    if (kindOf(sent) === "roll") return whole(hold, 0, 31) ? { kind: "roll", hold } : null;
    return kindOf(sent) === "score" && whole(box, 0, 12) ? { kind: "score", box } : null;
  },
  play: playYacht,
  named,
  seatState: (state) => {
    const game = decodeYacht(state);
    return game === null ? "" : writeSeen("yacht", { ...game, seed: NO_SEED, moves: [] });
  },
  computers: COMPUTER as OnlineComputers<YachtGame, YachtMove>,
};

/* ---- Pachisi ---- */

export const PACHISI_ONLINE: OnlineRules<PachisiGame, PachisiMove> = {
  sizes: PARTY_SPECS.pachisi.sizes,
  counts: countsOf(PARTY_SPECS.pachisi),
  start: (_size, count, extra) => startPachisi(new Array<string>(count).fill(""), freshTableSeed(), flagsOf(count, extra?.computers)),
  encode: encodePachisi,
  decode: (text) => decodePachisi(text) ?? readSeen<PachisiGame>("pachisi", text),
  toPlay: (game) => (game.phase === "finished" ? null : game.toPlay),
  winners: (game) => (game.phase === "finished" ? game.winners : []),
  moveCount: (game) => game.moves.length,
  readMove: (sent) => {
    const { pawn, use } = (sent ?? {}) as { pawn?: unknown; use?: unknown };
    if (kindOf(sent) === "roll") return { kind: "roll" };
    if (kindOf(sent) === "enter") return whole(pawn, 0, 3) ? { kind: "enter", pawn } : null;
    return kindOf(sent) === "move" && whole(pawn, 0, 3) && whole(use, 0, 16) ? { kind: "move", pawn, use } : null;
  },
  play: playPachisi,
  named,
  seatState: (state) => {
    const game = decodePachisi(state);
    return game === null ? "" : writeSeen("pachisi", { ...game, seed: NO_SEED, moves: [] });
  },
  computers: COMPUTER as OnlineComputers<PachisiGame, PachisiMove>,
};

/* ---- Dice War ---- */

/**
 * DICE WAR, AS A TABLE: the game, and who has pressed Roll for this throw. On one device
 * one press throws for every person, since they are all at it. On several each person
 * presses their own, and the dice fall when the last of them has, so nobody watches a
 * neighbour's throw before making their own and nobody's press is made for them.
 */
export type DiceWarTable = { game: DiceWarGame; pressed: readonly number[]; presses: number };

/** A press: nothing in it but that the seat pressed. The dice are the server's. */
export type DiceWarPress = { kind: "roll" };

const diceWarToPlay = ({ game, pressed }: DiceWarTable): number | null => {
  if (diceWarOver(game)) return null;
  // A war among computers only waits on a computer's seat: a browser at the table sends its press.
  return diceWarPeopleToRoll(game).find((seat) => !pressed.includes(seat)) ?? game.rollers[0] ?? null;
};

const oneOf = (list: readonly number[], value: unknown): value is number => list.includes(value as number);

/** What Dice War's set-up sends beyond a score: how many dice, how many sides, and what the game is played to. */
export type DiceWarTableSetUp = { dice: number; sides: number; goal: "points" | "rounds"; to: number };

function readDiceWarSetUp(sent: unknown, size: number): DiceWarTableSetUp | null {
  const { dice = 1, sides = 6, goal = "points", to = size } = (sent ?? {}) as Partial<Record<keyof DiceWarTableSetUp, unknown>>;
  if (!oneOf(DICE_WAR_DICE, dice) || !oneOf(DICE_WAR_SIDES, sides)) return null;
  if (goal === "points") return oneOf(DICE_WAR_POINT_GOALS, to) ? { dice, sides, goal, to } : null;
  return goal === "rounds" && oneOf(DICE_WAR_ROUND_GOALS, to) ? { dice, sides, goal, to } : null;
}

function encodeDiceWarTable({ game, pressed, presses }: DiceWarTable): string {
  return JSON.stringify({ t: encodeDiceWar(game), pressed, presses });
}

function decodeDiceWarTable(text: string): DiceWarTable | null {
  const seen = readSeen<DiceWarTable>("diceWar", text);
  if (seen !== null) return seen;
  try {
    const { t, pressed, presses } = JSON.parse(text) as { t?: unknown; pressed?: unknown; presses?: unknown };
    const game = typeof t === "string" ? decodeDiceWar(t) : null;
    return game === null || !Array.isArray(pressed) || !Number.isInteger(presses) ? null : { game, pressed: pressed as number[], presses: presses as number };
  } catch {
    return null;
  }
}

export const DICE_WAR_ONLINE: OnlineRules<DiceWarTable, DiceWarPress> = {
  sizes: PARTY_SPECS.diceWar.sizes,
  counts: countsOf(PARTY_SPECS.diceWar),
  start: (size, count, extra) => {
    const setUp = readDiceWarSetUp(extra?.setup, size);
    if (setUp === null) return null;
    const game = startDiceWar({ players: new Array<string>(count).fill(""), computers: flagsOf(count, extra?.computers), ...setUp, seed: String(freshTableSeed()) });
    return game === null ? null : { game, pressed: [], presses: 0 };
  },
  encode: encodeDiceWarTable,
  decode: decodeDiceWarTable,
  toPlay: diceWarToPlay,
  winners: ({ game }) => (diceWarOver(game) ? diceWarWinners(game) : []),
  moveCount: ({ presses }) => presses,
  readMove: (sent) => (kindOf(sent) === "roll" ? { kind: "roll" } : null),
  play: (table) => {
    const seat = diceWarToPlay(table);
    if (seat === null) return null;
    const { game } = table;
    const people = diceWarPeopleToRoll(game);
    const pressed = people.includes(seat) ? [...table.pressed, seat] : table.pressed;
    // Somebody still to press: the throw waits for them.
    if (people.some((one) => !pressed.includes(one))) return { game, pressed, presses: table.presses + 1 };
    // Everybody has. The people's dice come from the seed the server holds, as the computers' do; the browser's word is never asked.
    const faces = Object.fromEntries(people.map((one) => [String(one), diceWarComputerFaces(game, game.round, game.wars, one)]));
    const thrown = playDiceWar(game, people.length === 0 ? {} : { faces });
    return thrown === null ? null : { game: thrown, pressed: [], presses: table.presses + 1 };
  },
  named: (table, names) => ({ ...table, game: { ...table.game, players: table.game.players.map((was, seat) => names[seat] ?? was) } }),
  seatState: (state) => {
    const table = decodeDiceWarTable(state);
    return table === null ? "" : writeSeen("diceWar", { ...table, game: { ...table.game, seed: "", moves: [] } });
  },
  computers: COMPUTER as OnlineComputers<DiceWarTable, DiceWarPress>,
};

/* ---- Pig, Ten Thousand, Liar's Dice, Sayu ---- */

/** Each game's moves, read for their shape: never a die. */
const READS: Record<DiceTableKind, (sent: unknown) => unknown> = {
  pig: (sent) => (kindOf(sent) === "roll" || kindOf(sent) === "bank" ? { kind: kindOf(sent) } : null),
  tenThousand: (sent): TenThousandMove | null => {
    const mask = (sent as { mask?: unknown } | null)?.mask;
    if (kindOf(sent) === "roll") return { kind: "roll" };
    if (kindOf(sent) === "bank") return { kind: "bank" };
    return kindOf(sent) === "keep" && whole(mask, 1, 63) ? { kind: "keep", mask } : null;
  },
  liarsDice: (sent): LiarsMove | null => {
    const { count, face } = (sent ?? {}) as { count?: unknown; face?: unknown };
    if (kindOf(sent) === "call") return { kind: "call" };
    return kindOf(sent) === "bid" && whole(count, 1, 40) && whole(face, 2, 6) ? { kind: "bid", count, face } : null;
  },
  sayu: (sent) => (kindOf(sent) === "roll" ? { kind: "roll" } : null),
};

/**
 * LIAR'S DICE AS ONE SEAT MAY SEE IT: its own cup, and everybody else's as empty dice
 * of the same number, since how many each holds is public. A lifted cup is in `called`,
 * which everybody saw lifted. The rest of the table is public.
 */
export function seenByLiar(game: LiarsGame, seat: number): LiarsGame {
  return { ...game, cups: game.cups.map((cup, at) => (at === seat ? cup : cup.map(() => 0))) };
}

function diceTableOnline(kind: DiceTableKind): OnlineRules<DiceTableBase<unknown>, unknown> {
  const rules = DICE_TABLE_RULES[kind] as unknown as DiceTableRules<DiceTableBase<unknown>, unknown>;
  return {
    sizes: PARTY_SPECS[kind].sizes,
    counts: countsOf(PARTY_SPECS[kind]),
    start: (size, count, extra) => rules.start(size, new Array<string>(count).fill(""), undefined, freshTableSeed(), flagsOf(count, extra?.computers)),
    encode: rules.encode,
    decode: (text) => rules.decode(text) ?? readSeen<DiceTableBase<unknown>>(kind, text),
    toPlay: rules.toPlay,
    winners: (game) => (rules.over(game) ? rules.winners(game) : []),
    moveCount: (game) => game.moves.length,
    readMove: READS[kind],
    play: rules.play,
    named,
    seatState: (state, seat) => {
      const game = rules.decode(state);
      if (game === null) return "";
      const open = kind === "liarsDice" ? seenByLiar(game as unknown as LiarsGame, seat) : game;
      return writeSeen(kind, { ...open, seed: NO_SEED, moves: [] });
    },
    computers: COMPUTER as OnlineComputers<DiceTableBase<unknown>, unknown>,
  };
}

/** Each plain dice game's rules for a table on several devices. */
export const DICE_TABLES_ONLINE: Record<DiceTableKind, OnlineRules<DiceTableBase<unknown>, unknown>> = {
  pig: diceTableOnline("pig"),
  tenThousand: diceTableOnline("tenThousand"),
  liarsDice: diceTableOnline("liarsDice"),
  sayu: diceTableOnline("sayu"),
};
