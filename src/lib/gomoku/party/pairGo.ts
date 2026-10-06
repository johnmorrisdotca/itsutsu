// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import { canPass, createGame, passTurn, playMove, resign, scoreArea } from "../engine";
import { speaker, type Speaker } from "../../i18n/i18n";

import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, STONES, boardSizesFor } from "../gomoku.constants";
import type { Point, Stone } from "../gomoku.types";
import { indexOf, pointOf } from "../rules/board";
import { playerNumberName } from "../seatWords";
import { komiFor } from "../rules/headStart";

import type { PairGoGame, PairPlace, PairPlayer, PairTeams } from "./pairGo.types";

/**
 * PAIR GO: TWO TEAMS OF TWO, ON ONE DEVICE.
 *
 * The tournament format: Black is two players, White is two, and the turns go
 * round the table — Black's first player, White's first, Black's second,
 * White's second, and round again. Each plays their team's colour when its
 * turn comes, and partners may not talk.
 *
 * NOTHING ABOUT THE GAME IS WRITTEN HERE. It is the site's own Go, played by
 * the engine exactly as the board for two plays it: the same boards, captures,
 * ko, passing and count. What is new is only who is at the board — and that
 * is read from the engine's own record rather than kept beside it: a colour's
 * next turn is taken by the first of its pair when the colour has taken an
 * even number of turns so far, and by the second when odd. A pass is a turn
 * like a stone, so it is the passing player's and moves the order on; two
 * passes in a row end the game by count, as they always do in Go.
 */

/** The game a pair game is played in. */
export const PAIR_GO_VARIANT = RULE_VARIANTS.go;

/** Go's own boards, smallest first. */
export const PAIR_GO_SIZES: readonly number[] = boardSizesFor(PAIR_GO_VARIANT);

/**
 * The board a table starts on: the nine. A phone passed round four people is
 * the small board's natural home, and a nineteen is a long evening — a choice
 * the set-up offers, not the one it makes for them.
 */
export const PAIR_GO_DEFAULT_SIZE = 9;

/** The longest name the table keeps. */
export const PAIR_NAME_MOST = 20;

/** The four seats in the order their first turns come: Black 1, White 1, Black 2, White 2. */
export const PAIR_SEATS: readonly { stone: Stone; place: PairPlace }[] = [
  { stone: STONES.black, place: 0 },
  { stone: STONES.white, place: 0 },
  { stone: STONES.black, place: 1 },
  { stone: STONES.white, place: 1 },
];

/** A name as the table keeps it: runs of space made one, trimmed, and not too long. */
export function cleanPairName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, PAIR_NAME_MOST);
}

/** Where a seat's first turn comes round the table, 0 to 3, given who opens. */
function turnOrderOf(stone: Stone, place: PairPlace, opener: Stone): number {
  return place * 2 + (stone === opener ? 0 : 1);
}

/** One of the four, as the table reads them: the name they gave, or "Player 3" by their place in the order. */
export function pairPlayer(teams: PairTeams, stone: Stone, place: PairPlace, opener: Stone = STONES.black, say: Speaker = speaker("en")): PairPlayer {
  const turnOrder = turnOrderOf(stone, place, opener);
  const given = cleanPairName(teams[stone][place] ?? "");
  return { stone, place, turnOrder, name: given === "" ? playerNumberName(say, turnOrder + 1) : given };
}

/** All four, in the order their first turns come. */
export function pairPlayers(game: PairGoGame, say: Speaker = speaker("en")): PairPlayer[] {
  return PAIR_SEATS.map(({ stone, place }) => pairPlayer(game.teams, stone, place, game.state.opener, say))
    .sort((a, b) => a.turnOrder - b.turnOrder);
}

/** How many turns `stone` has taken in the first `upTo` moves: stones and passes alike. */
function turnsTaken(game: PairGoGame, stone: Stone, upTo: number): number {
  return game.state.moves.slice(0, upTo).filter((move) => (move.by ?? move.stone) === stone).length;
}

/**
 * Whose move it is: the colour the engine says is to play, and which of that
 * colour's two players — or null once the game is over.
 */
export function pairPlayerToMove(game: PairGoGame): PairPlayer | null {
  const { state } = game;
  if (state.status !== GAME_STATUS.playing) return null;
  const place = (turnsTaken(game, state.toPlay, state.moves.length) % 2) as PairPlace;
  return pairPlayer(game.teams, state.toPlay, place, state.opener);
}

/** Who made the move at `index` in the record: the colour that moved, and which of its pair. */
export function pairPlayerOfMove(game: PairGoGame, index: number): PairPlayer | null {
  const move = game.state.moves[index];
  if (move === undefined) return null;
  const stone = move.by ?? move.stone;
  const place = (turnsTaken(game, stone, index) % 2) as PairPlace;
  return pairPlayer(game.teams, stone, place, game.state.opener);
}

/** A new game on a board of `size`, Black to move — the engine's own Go, as the board for two starts it. */
export function startPairGo(size: number, teams: PairTeams): PairGoGame {
  const state = createGame({ variant: PAIR_GO_VARIANT, size: PAIR_GO_SIZES.includes(size) ? size : PAIR_GO_DEFAULT_SIZE });
  return {
    teams: {
      black: [cleanPairName(teams.black[0]), cleanPairName(teams.black[1])],
      white: [cleanPairName(teams.white[0]), cleanPairName(teams.white[1])],
    },
    state,
    resigned: null,
  };
}

/** The same four, a fresh board of the same size: "play again". */
export function againPairGo(game: PairGoGame): PairGoGame {
  return startPairGo(game.state.settings.size, game.teams);
}

/** A stone at `point` by whoever is to move, or null when the engine refuses it. */
export function pairPlay(game: PairGoGame, point: Point): PairGoGame | null {
  if (game.resigned !== null) return null;
  const next = playMove(game.state, point);
  return next === game.state ? null : { ...game, state: next };
}

/** A pass by whoever is to move — the second in a row ends the game by count — or null when none is on offer. */
export function pairPass(game: PairGoGame): PairGoGame | null {
  if (game.resigned !== null || !canPass(game.state)) return null;
  return { ...game, state: passTurn(game.state) };
}

/** The team to move gives the game up, or null when it is already over. */
export function pairResign(game: PairGoGame): PairGoGame | null {
  const { state } = game;
  if (state.status !== GAME_STATUS.playing) return null;
  return { ...game, state: resign(state, state.toPlay), resigned: state.toPlay };
}

/**
 * The count as it stands: each colour's stones and walled-in ground, and the
 * komi White is given. The engine's own count, the one that decided the game
 * when two passes ended it.
 */
export function pairCount(game: PairGoGame): { black: number; white: number; komi: number } {
  const area = scoreArea(game.state.board, game.state.settings.size);
  return { ...area, komi: komiFor(game.state.settings) };
}

/** The kept form's own shape, read back only through `decodePairGo`. */
type KeptPairGo = { v: 1; size: number; teams: PairTeams; moves: number[]; resigned: Stone | null };

/** A pass in the kept list of moves, where a stone is its point's index on the board. */
const KEPT_PASS = -1;

/**
 * THE GAME AS TEXT, for this browser to keep: the board size, the four names
 * and the moves — never the board, which the moves make again through the
 * engine, so a kept game is always one the rules could have produced.
 */
export function encodePairGo(game: PairGoGame): string {
  const { size } = game.state.settings;
  const kept: KeptPairGo = {
    v: 1,
    size,
    teams: game.teams,
    moves: game.state.moves.map((move) => (move.kind === MOVE_KINDS.pass ? KEPT_PASS : indexOf(size, move))),
    resigned: game.resigned,
  };
  return JSON.stringify(kept);
}

function isTeam(value: unknown): value is readonly [string, string] {
  return Array.isArray(value) && value.length === 2 && value.every((name) => typeof name === "string");
}

/**
 * A kept game, played out again move by move through the engine — or null for
 * anything that is not one: bad text, another version or shape (the board for
 * two kept under its own key is never read as one), a board Go is not played
 * on, or a move the rules refuse. Null rather than as much as could be read,
 * because a game resumed from half its moves is a different game wearing its
 * name.
 */
export function decodePairGo(text: string | null): PairGoGame | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, size, teams, moves, resigned } = kept as Partial<Record<keyof KeptPairGo, unknown>>;
  if (v !== 1 || typeof size !== "number" || !PAIR_GO_SIZES.includes(size) || !Array.isArray(moves)) return null;
  if (typeof teams !== "object" || teams === null) return null;
  const { black, white } = teams as Partial<Record<Stone, unknown>>;
  if (!isTeam(black) || !isTeam(white)) return null;
  if (resigned !== null && resigned !== STONES.black && resigned !== STONES.white) return null;

  let game: PairGoGame | null = startPairGo(size, { black, white });
  for (const move of moves) {
    if (!Number.isInteger(move)) return null;
    const at = move as number;
    if (at === KEPT_PASS) game = pairPass(game);
    else if (at < 0 || at >= size * size) return null;
    else game = pairPlay(game, pointOf(size, at));
    if (game === null) return null;
  }
  if (resigned === null) return game;
  // A resignation is the team to move giving up, so it can only be the colour the moves leave to play.
  if (game.state.toPlay !== resigned) return null;
  return pairResign(game);
}
