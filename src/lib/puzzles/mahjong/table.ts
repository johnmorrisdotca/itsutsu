import type { PuzzleLevel } from "../puzzles.types";
import { canTake, freePairs, geometryOf, isCleared, takePair } from "./board";
import { shuffleTiles } from "./deal";
import { layoutFor } from "./layouts";
import { dealFits } from "./moves";
import type { MahjongBonusRule, MahjongGeometry } from "./mahjong.types";
import type { MahjongSeat, MahjongTable, MahjongTableState } from "./table.types";
import { bonusRuleOf, pairGoesAgain, pairPoints } from "./tiles";

/**
 * THE RULES AT THE TABLE. Two to four players share one layout and take turns,
 * each taking one pair of free tiles that match — the solitaire's own move.
 * Every pair scores for whoever took it: the plain suit tiles one, the ones and
 * nines two, a wind three, a dragon four (`pairPoints`), and a flower or season
 * pair two and another turn. When the player to move has no pair to take, the
 * tiles left are shuffled where they lie (as the solitaire's Shuffle does) and
 * the same player goes on. The game ends when the layout is cleared, or when
 * what is left cannot be freed by any shuffle; most points wins, and a tie
 * shares it.
 *
 * Why these rules: taking turns alone would be decided by counting — two
 * players taking a pair each get half the pairs whatever they do. Pairs that
 * are worth different amounts make every turn a choice between taking the
 * dragon now and leaving the next player nothing good, which is a game of
 * reading the whole layout. And everything is face up, so the device is
 * passed with no cover screen: nothing is secret at this table.
 *
 * Pure, like every rule here: each function returns a new table.
 */
export const MAHJONG_TABLE = { least: 2, most: 4, nameMost: 20 } as const;

/** The four seats' winds, east first, as a mahjong table seats its players. */
export const SEAT_WINDS: readonly { label: string; kanji: string }[] = [
  { label: "East", kanji: "東" },
  { label: "South", kanji: "南" },
  { label: "West", kanji: "西" },
  { label: "North", kanji: "北" },
];

/** A players count from an address, or 1 (the solitaire) for anything that is not two to four. */
export function tablePlayersAsked(value: unknown): number {
  const count = Number(value);
  return Number.isInteger(count) && count >= MAHJONG_TABLE.least && count <= MAHJONG_TABLE.most ? count : 1;
}

/** A name as kept: trimmed, one line, and no longer than a line holds. */
export function tidySeatName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAHJONG_TABLE.nameMost);
}

/** What a seat is called: its name, "Computer 2", or its wind. */
export function seatName(seats: readonly MahjongSeat[], at: number): string {
  const seat = seats[at];
  if (seat === undefined) return SEAT_WINDS[at]?.label ?? `Player ${at + 1}`;
  if (seat.name !== "") return seat.name;
  if (seat.computer === true) return `Computer ${seats.slice(0, at + 1).filter((each) => each.computer === true).length}`;
  return SEAT_WINDS[at]?.label ?? `Player ${at + 1}`;
}

/** A new game at the table: the deal made from the seed, these seats, and nothing taken. */
export function startTable(deal: { size: number; level: PuzzleLevel; seed: number; givens: string }, seats: readonly MahjongSeat[]): MahjongTable {
  const count = Math.min(Math.max(seats.length, MAHJONG_TABLE.least), MAHJONG_TABLE.most);
  const seated = Array.from({ length: count }, (_, at) => {
    const seat = seats[at] ?? { name: "" };
    return seat.computer === true ? { name: "", computer: true as const } : { name: tidySeatName(seat.name) };
  });
  return { size: deal.size, level: deal.level, seed: deal.seed, givens: deal.givens, seats: seated, takes: [] };
}

/** Nothing to take: shuffle what is left, and the same player goes on; a layout no shuffle can free is over. */
function settle(geometry: MahjongGeometry, rule: MahjongBonusRule, state: MahjongTableState): MahjongTableState {
  let { cells, shuffles, shuffledAfter } = state;
  for (;;) {
    if (isCleared(cells)) return over({ ...state, cells, shuffles, shuffledAfter });
    if (freePairs(geometry, cells, rule).length > 0) return { ...state, cells, shuffles, shuffledAfter };
    const next = shuffleTiles(geometry, cells, rule, shuffles);
    if (next === null) return over({ ...state, cells, shuffles, shuffledAfter });
    cells = next;
    shuffles += 1;
    shuffledAfter = state.taken.length;
  }
}

function over(state: MahjongTableState): MahjongTableState {
  const best = Math.max(...state.scores);
  return { ...state, over: true, winners: state.scores.flatMap((score, seat) => (score === best ? [seat] : [])) };
}

/** One pair taken by the player to move, from where the game stands; null where the rules do not allow it. */
function applyTake(geometry: MahjongGeometry, rule: MahjongBonusRule, state: MahjongTableState, a: number, b: number): MahjongTableState | null {
  if (state.over || !canTake(geometry, state.cells, rule, a, b)) return null;
  const codes = [state.cells[a]!, state.cells[b]!] as const;
  const points = pairPoints(codes[0]);
  const again = pairGoesAgain(codes[0]);
  const scores = state.scores.map((score, seat) => (seat === state.turn ? score + points : score));
  const pairs = state.pairs.map((count, seat) => (seat === state.turn ? count + 1 : count));
  const taken = [...state.taken, { seat: state.turn, pair: [a, b] as const, codes, points, again }];
  const turn = again ? state.turn : (state.turn + 1) % state.scores.length;
  return settle(geometry, rule, { ...state, cells: takePair(state.cells, a, b), scores, pairs, taken, turn });
}

/** The layout's geometry and the deal's matching rule, or null for a table that is not one. */
function rulesOf(table: MahjongTable): { geometry: MahjongGeometry; rule: MahjongBonusRule } | null {
  const layout = layoutFor(table.size);
  const count = table.seats.length;
  if (layout === null || !dealFits(table.size, table.givens) || count < MAHJONG_TABLE.least || count > MAHJONG_TABLE.most) return null;
  return { geometry: geometryOf(layout), rule: bonusRuleOf(table.givens) };
}

/**
 * WHERE THE GAME STANDS, played again from its pairs: null for a deal that is
 * not one, or a pair the rules would not have allowed.
 */
export function readTable(table: MahjongTable): MahjongTableState | null {
  const rules = rulesOf(table);
  if (rules === null) return null;
  const count = table.seats.length;
  let state: MahjongTableState | null = settle(rules.geometry, rules.rule, {
    cells: table.givens,
    turn: 0,
    scores: new Array<number>(count).fill(0),
    pairs: new Array<number>(count).fill(0),
    taken: [],
    shuffles: 0,
    shuffledAfter: null,
    over: false,
    winners: [],
  });
  for (const [a, b] of table.takes) {
    state = applyTake(rules.geometry, rules.rule, state, a, b);
    if (state === null) return null;
  }
  return state;
}

/** The pairs the player to move may take: none once the game is over. */
export function tablePairs(table: MahjongTable, state: MahjongTableState | null = readTable(table)): [number, number][] {
  const rules = rulesOf(table);
  if (state === null || state.over || rules === null) return [];
  return freePairs(rules.geometry, state.cells, rules.rule);
}

/**
 * The player to move takes this pair: the table and where it now stands, or
 * null where the rules do not allow it. Played on from `state` where the
 * caller holds it, so a turn costs one pair rather than the whole game again.
 */
export function playAtTable(table: MahjongTable, a: number, b: number, state: MahjongTableState | null = readTable(table)): { table: MahjongTable; state: MahjongTableState } | null {
  const rules = rulesOf(table);
  if (rules === null || state === null) return null;
  const next = applyTake(rules.geometry, rules.rule, state, a, b);
  return next === null ? null : { table: { ...table, takes: [...table.takes, [a, b] as const] }, state: next };
}

/** The table after the player to move takes this pair, or null where the rules do not allow it. */
export function takeAtTable(table: MahjongTable, a: number, b: number): MahjongTable | null {
  return playAtTable(table, a, b)?.table ?? null;
}

/** The table with its last pair given back: the undo a table agrees to. Null with nothing to give back. */
export function undoAtTable(table: MahjongTable): MahjongTable | null {
  if (table.takes.length === 0) return null;
  return { ...table, takes: table.takes.slice(0, -1) };
}

/** Whether a computer plays this seat. */
export function isComputerSeat(table: MahjongTable, at: number): boolean {
  return table.seats[at]?.computer === true;
}

/** As kept in the browser: the table as JSON, its takes as slot pairs. */
export function encodeTable(table: MahjongTable): string {
  return JSON.stringify({ v: 1, ...table });
}

/** A kept table read back, its shape checked and every pair played again; null for anything that is not one. */
export function decodeTable(text: string | null): MahjongTable | null {
  if (text === null) return null;
  try {
    const raw = JSON.parse(text) as Partial<MahjongTable> & { v?: number };
    if (raw.v !== 1 || typeof raw.size !== "number" || typeof raw.seed !== "number" || typeof raw.givens !== "string") return null;
    if (raw.level !== "easy" && raw.level !== "medium" && raw.level !== "hard") return null;
    if (!Array.isArray(raw.seats) || !Array.isArray(raw.takes)) return null;
    const seats: MahjongSeat[] = raw.seats.map((seat) => (seat?.computer === true ? { name: "", computer: true as const } : { name: tidySeatName(String(seat?.name ?? "")) }));
    const takes = raw.takes.map((pair) => [Number(pair?.[0]), Number(pair?.[1])] as const);
    const table: MahjongTable = { size: raw.size, level: raw.level, seed: raw.seed, givens: raw.givens, seats, takes };
    return readTable(table) === null ? null : table;
  } catch {
    return null;
  }
}
