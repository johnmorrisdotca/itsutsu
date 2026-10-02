// By package name, which resolves from node_modules for Playwright too; the rest of lib/party stays relative, as the browser specs resolve no alias.
import {
  canDouble,
  choosePlay,
  concede,
  concedeKind,
  dropDouble,
  endTurn,
  finishGame,
  formatOpening,
  formatRecordHeader,
  formatResult,
  formatTurn,
  legalMoves,
  legalPlaysOf,
  newMatch,
  offerDouble,
  openingFrom,
  otherSide,
  playMove,
  replayRecord,
  rollDice,
  rollFrom,
  rollOpening,
  seededDice,
  settingsFor,
  sideToAct,
  startGame,
  takeDouble,
  turnIsPlayed,
  wantsToDouble,
  wantsToTake,
  type DiceSource,
  type GameResult,
  type GameState,
  type Match,
  type Position,
  type Settings,
  type Side,
  type Strength,
} from "@johnmorrisdotca/sugoroku";

import { SUGOROKU_DEFAULT_STRENGTH, SUGOROKU_LENGTHS, SUGOROKU_STRENGTHS, SUGOROKU_VARIANT_KEY, isSugorokuKind, type SugorokuKind } from "./sugoroku.constants";
import type { SugorokuMove, SugorokuTable, SugorokuView } from "./sugoroku.types";

/**
 * ONE OF THE SEVEN, PLAYED BY THE PACKAGE'S RULES (`@johnmorrisdotca/sugoroku`):
 * a table is who sits where and the record of the match, and a move is made by
 * adding a line to that record. The game in play is read from the record
 * (`viewOf`), once for each table, by replaying it against the rules; a move is
 * made from the game as the last move left it, so playing a long match costs
 * what each move costs and never a replay of everything before it.
 *
 * THE DICE ARE THE SEED'S. A table is given a seed when it starts, and every
 * throw — the opening, each roll — is the next of the dice that seed makes
 * (`seededDice`), so a reload throws what it threw, a server can tell dice the
 * game was given from dice somebody made up, and nobody has a hand to throw
 * them with: the roll is part of the turn, not a press of its own. What that
 * costs is stated in docs/plans/sugoroku/README.md: a table that holds its
 * seed holds its future dice, so a person who reads the stored text could
 * look ahead; the same trust every table here with a seed gives.
 */

/** The text the table is kept as begins with this line. */
const HEADER = "sugoroku-table 1";

/** The longest a name may be, as every party table's are. */
const NAME_MOST = 24;

/** The rules a kind is played with at a match length: a single game with no cube, or a match with the cube, the Crawford rule and gammons. Anti-Backgammon is only ever played single. */
export function sugorokuSettings(kind: SugorokuKind, points: number): Settings {
  const single = points === 1 || kind === "antiBackgammon";
  return settingsFor(SUGOROKU_VARIANT_KEY[kind], single ? { points, cube: false, gammons: false } : { points, cube: true, crawford: true, gammons: true });
}

/** The game as a table is partway through writing it: its text, and what has been read from it. */
type Work = {
  text: string;
  match: Match;
  game: GameState | null;
  last: { result: GameResult; position: Position } | null;
  drawn: number;
  seed: number;
};

/** The dice after the first `drawn` of the seed's. */
function sourceAfter(seed: number, drawn: number): DiceSource {
  const source = seededDice(seed);
  for (let at = 0; at < drawn; at += 1) source();
  return source;
}

/** The opening throw, and again for every tie, until a side starts. */
function opened(work: Work): Work {
  let { text, game, drawn } = work;
  if (game === null) return work;
  while (game.phase === "opening") {
    const throws = openingFrom(sourceAfter(work.seed, drawn));
    drawn += 2;
    text += `${formatOpening(throws)}\n`;
    game = rollOpening(game, throws);
  }
  return { ...work, text, game, drawn };
}

/** A game that has ended is written down and added up; the next one of the match begins, with its opening thrown. */
function settled(work: Work): Work {
  const { game } = work;
  if (game === null || game.phase !== "over" || game.result === null) return work;
  const match = finishGame(work.match, game.result);
  const last = { result: game.result, position: game.position };
  const text = `${work.text}${formatResult(game.result)}\n`;
  if (match.over) return { ...work, text, match, game: null, last };
  return opened({ ...work, text: `${text}game ${match.results.length + 1}\n`, match, game: startGame(match), last });
}

/** The dice of each throw a record has asked of the seed, counted from its lines. */
function drawnBy(text: string, settings: Settings): number {
  let drawn = 0;
  // After a roll-off the starter plays the opening dice as the first roll, so that turn throws nothing more.
  let free = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (/^game\b/.test(line)) {
      free = false;
      continue;
    }
    const opening = /^open\s+(\d)\s+(\d)$/.exec(line);
    if (opening !== null) {
      drawn += 2;
      free = settings.variant.opening === "roll-off" && opening[1] !== opening[2];
      continue;
    }
    const turn = /^(?:white|black)\s+(\d{2,3}):/.exec(line);
    if (turn !== null) {
      if (free) free = false;
      else drawn += turn[1].length;
    }
  }
  return drawn;
}

const KNOWN = new WeakMap<SugorokuTable, Work>();

/** What a record has come to: replayed from its first line, or null for a record these rules cannot play out. */
function replayed(text: string): Work | null {
  const replay = replayRecord(text);
  if (!replay.ok || typeof replay.seed !== "number") return null;
  const last = replay.games.at(-1);
  return {
    text,
    match: replay.match,
    game: replay.current,
    last: last === undefined ? null : { result: last.result, position: last.position },
    drawn: drawnBy(text, replay.settings),
    seed: replay.seed,
  };
}

function workOf(table: SugorokuTable): Work {
  const known = KNOWN.get(table);
  if (known !== undefined) return known;
  const work = replayed(table.text);
  if (work === null) throw new Error("A table's record does not replay");
  KNOWN.set(table, work);
  return work;
}

/** The table's game, read from its record: what a board draws. */
export function viewOf(table: SugorokuTable): SugorokuView {
  const work = workOf(table);
  return { settings: sugorokuSettings(table.kind, table.points), match: work.match, game: work.game, last: work.last, drawn: work.drawn };
}

function tidy(name: string): string {
  return name.replace(/[\r\n]+/g, " ").slice(0, NAME_MOST);
}

/**
 * A new table of one of the seven at this match length, for these two names, in
 * the dice of this seed; null for a length the game is not played to or a table
 * that is not two. `computers` says which seats a computer plays, and `levels`
 * how strongly (a computer left without one plays at the usual strength).
 */
export function startSugoroku(
  kind: SugorokuKind,
  points: number,
  players: readonly string[],
  seed: number,
  computers: readonly boolean[] = [],
  levels: readonly string[] = [],
): SugorokuTable | null {
  if (!isSugorokuKind(kind) || !SUGOROKU_LENGTHS[kind].includes(points) || players.length !== 2 || !Number.isInteger(seed) || seed < 0) return null;
  const settings = sugorokuSettings(kind, points);
  const match = newMatch(settings);
  const header = `${formatRecordHeader(settings, seed).join("\n")}\ngame 1\n`;
  const work = opened({ text: header, match, game: startGame(match), last: null, drawn: 0, seed });
  const seated = players.map((name, seat) => ({
    name: tidy(name),
    computer: computers[seat] === true,
    level: computers[seat] === true ? (SUGOROKU_STRENGTHS.find((strength) => strength === levels[seat]) ?? SUGOROKU_DEFAULT_STRENGTH) : "",
  }));
  const table: SugorokuTable = {
    kind,
    points,
    seed,
    players: seated.map((seat) => seat.name),
    computers: seated.map((seat) => seat.computer),
    levels: seated.map((seat) => seat.level),
    text: work.text,
  };
  KNOWN.set(table, work);
  return table;
}

/** The side whose answer the game is waiting on. */
function actor(game: GameState): Side | null {
  return sideToAct(game);
}

/** The seat to play: 0 for white, 1 for black, or null once the match is over. */
export function sugorokuToPlay(table: SugorokuTable): number | null {
  const { game } = workOf(table);
  if (game === null) return null;
  const side = actor(game);
  return side === null ? null : side === "white" ? 0 : 1;
}

/** The next roll of the dice, which the table already knows; null where the game waits on an answer or is over. */
export function peekRoll(table: SugorokuTable): readonly number[] | null {
  const work = workOf(table);
  const { game } = work;
  if (game === null || game.phase !== "before-roll") return null;
  return rollFrom(sourceAfter(work.seed, work.drawn), game.settings.variant.dice);
}

/** The side on turn's game with its dice thrown, ready to play: what a board lets a person move in. Null where nobody is to play a roll. */
export function rolledGame(table: SugorokuTable): GameState | null {
  const { game } = workOf(table);
  if (game === null) return null;
  if (game.phase === "playing") return game;
  const roll = peekRoll(table);
  return roll === null ? null : rollDice(game, roll);
}

/** One turn played on, from the game as it stands; null for a play the rules refuse. */
function played(work: Work, game: GameState, steps: SugorokuMove & { t: "play" }): Work | null {
  const side = actor(game);
  if (side === null || (game.phase !== "before-roll" && game.phase !== "playing")) return null;
  let drawn = work.drawn;
  let rolled = game;
  if (game.phase === "before-roll") {
    const roll = rollFrom(sourceAfter(work.seed, drawn), game.settings.variant.dice);
    drawn += roll.length;
    rolled = rollDice(game, roll);
  }
  const dice = rolled.dice ?? [];
  let at = rolled;
  for (const [index, [from, to]] of steps.steps.entries()) {
    if (at.phase !== "playing" || !legalMoves(at).some((move) => move.from === from && move.to === to)) return null;
    at = playMove(at, { from, to });
    if (at.phase === "over" && index < steps.steps.length - 1) return null;
  }
  const moves = at.moves;
  if (at.phase !== "over") {
    if (!turnIsPlayed(at)) return null;
    at = endTurn(at);
  }
  return settled({ ...work, text: `${work.text}${formatTurn(side, dice, moves)}\n`, game: at, drawn });
}

/** The table after a move, or null for a move the rules refuse; the table given is left untouched. */
export function playSugoroku(table: SugorokuTable, move: SugorokuMove): SugorokuTable | null {
  const work = workOf(table);
  const { game } = work;
  if (game === null) return null;
  const side = actor(game);
  if (side === null) return null;
  let next: Work | null = null;
  if (move.t === "play") next = played(work, game, move);
  else if (move.t === "double") next = game.phase === "before-roll" && canDouble(game) ? { ...work, text: `${work.text}${side} doubles\n`, game: offerDouble(game) } : null;
  else if (move.t === "take") next = game.phase === "double-offered" ? { ...work, text: `${work.text}${side} takes\n`, game: takeDouble(game) } : null;
  else if (move.t === "drop") next = game.phase === "double-offered" ? settled({ ...work, text: `${work.text}${side} drops\n`, game: dropDouble(game) }) : null;
  else if (move.t === "concede") {
    const kind = concedeKind(game, side);
    next = settled({ ...work, text: `${work.text}${side} concedes ${kind}\n`, game: concede(game, side, kind) });
  }
  if (next === null) return null;
  const after: SugorokuTable = { ...table, text: next.text };
  KNOWN.set(after, next);
  return after;
}

/**
 * EVERY MOVE THE SEAT TO PLAY MAY MAKE: each way of playing the roll (with the
 * double before it, where the cube allows), or the answer to a double. Giving
 * up is a move too, which a player may make and a table never offers.
 */
export function sugorokuMoves(table: SugorokuTable): SugorokuMove[] {
  const { game } = workOf(table);
  if (game === null) return [];
  if (game.phase === "double-offered") return [{ t: "take" }, { t: "drop" }];
  const rolled = rolledGame(table);
  if (rolled === null) return [];
  const plays: SugorokuMove[] = legalPlaysOf(rolled).map((play) => ({ t: "play", steps: play.moves.map((move) => [move.from, move.to] as const) }));
  return game.phase === "before-roll" && canDouble(game) ? [{ t: "double" }, ...plays] : plays;
}

/** A move as a browser sent it, checked for its shape only, or null: whether the rules take it is `playSugoroku`'s to say. */
export function readSugorokuMove(sent: unknown): SugorokuMove | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { t, steps } = sent as { t?: unknown; steps?: unknown };
  if (t === "double" || t === "take" || t === "drop" || t === "concede") return { t };
  if (t !== "play" || !Array.isArray(steps) || steps.length > 4) return null;
  const read: [number, number][] = [];
  for (const step of steps) {
    if (!Array.isArray(step) || step.length !== 2) return null;
    const [from, to] = step as unknown[];
    if (!Number.isInteger(from) || !Number.isInteger(to) || (from as number) < 1 || (from as number) > 25 || (to as number) < 0 || (to as number) > 24) return null;
    read.push([from as number, to as number]);
  }
  return { t: "play", steps: read };
}

/** Whether the match is over. */
export function sugorokuOver(table: SugorokuTable): boolean {
  return workOf(table).match.over;
}

/** The seats that won the match: one, or both for one drawn. */
export function sugorokuWinners(table: SugorokuTable): readonly number[] {
  const { match } = workOf(table);
  if (!match.over) return [];
  return match.winner === null ? [0, 1] : [match.winner === "white" ? 0 : 1];
}

/** How many moves the table has had: each turn, double, take, drop and giving up is one line of its record. */
export function sugorokuMoveCount(table: SugorokuTable): number {
  return table.text.split("\n").filter((line) => /^(white|black)\s/.test(line)).length;
}

/** The table with the seats' names written in, for a page to draw: the record has none, so a seat taken by a link needs no rewrite of the game. */
export function namedSugoroku(table: SugorokuTable, names: readonly string[]): SugorokuTable {
  const players = table.players.map((was, seat) => tidy(names[seat] ?? was));
  const same = players.every((name, seat) => name === table.players[seat]);
  if (same) return table;
  const named: SugorokuTable = { ...table, players };
  const known = KNOWN.get(table);
  if (known !== undefined) KNOWN.set(named, known);
  return named;
}

/**
 * WHAT THE COMPUTER DOES NEXT, for the seat to play at the strength asked: a
 * double it wants to offer, the answer to one, or a play of the roll. The roll
 * is the seed's, so the move chosen is the move of the dice the table will
 * make. A search takes up to a tenth of a second at the strongest.
 */
export function sugorokuComputerMove(table: SugorokuTable, strength: Strength, random?: () => number): SugorokuMove | null {
  const { game } = workOf(table);
  if (game === null) return null;
  const options = { strength, ...(random === undefined ? {} : { random }) };
  if (game.phase === "double-offered") return wantsToTake(game, options) ? { t: "take" } : { t: "drop" };
  if (game.phase === "before-roll" && canDouble(game) && wantsToDouble(game, options)) return { t: "double" };
  const rolled = rolledGame(table);
  if (rolled === null) return null;
  return { t: "play", steps: choosePlay(rolled, options).moves.map((move) => [move.from, move.to] as const) };
}

/** The table as the text it is kept as: its seats, then the match's record. */
export function encodeSugoroku(table: SugorokuTable): string {
  return `${HEADER}\nkind ${table.kind}\nnames ${JSON.stringify(table.players)}\nlevels ${JSON.stringify(table.levels)}\n${table.text}`;
}

function readList(line: string | undefined, label: string): string[] | null {
  if (line === undefined || !line.startsWith(`${label} `)) return null;
  try {
    const parsed: unknown = JSON.parse(line.slice(label.length + 1));
    return Array.isArray(parsed) && parsed.length === 2 && parsed.every((one) => typeof one === "string") ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/** A table read back from its text, or null for nothing kept or anything these rules cannot play out again. */
export function decodeSugoroku(stored: string | null): SugorokuTable | null {
  if (stored === null) return null;
  const lines = stored.split("\n");
  if (lines[0] !== HEADER || !lines[1]?.startsWith("kind ")) return null;
  const kind = lines[1].slice(5);
  const players = readList(lines[2], "names");
  const levels = readList(lines[3], "levels");
  if (!isSugorokuKind(kind) || players === null || levels === null) return null;
  const text = lines.slice(4).join("\n");
  const work = replayed(text);
  if (work === null || work.seed < 0) return null;
  const points = work.match.settings.rules.points;
  if (work.match.settings.variant.key !== SUGOROKU_VARIANT_KEY[kind] || !SUGOROKU_LENGTHS[kind].includes(points)) return null;
  if (!levels.every((level) => level === "" || SUGOROKU_STRENGTHS.some((strength) => strength === level))) return null;
  const table: SugorokuTable = { kind, points, seed: work.seed, players: players.map(tidy), computers: levels.map((level) => level !== ""), levels, text };
  KNOWN.set(table, work);
  return table;
}

export type { SugorokuMove, SugorokuTable, SugorokuView, Position, Side };
