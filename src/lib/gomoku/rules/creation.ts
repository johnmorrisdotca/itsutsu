import { startingPieces } from "./camps";
import { checkersStartingPieces } from "./checkers";
import { STAR_RADIUS, starStartingPieces } from "./chineseCheckers";
import { startingDiscs } from "./flips";
import {
  DEFAULT_SETTINGS,
  FIRST_STONE,
  FIRST_PLAYERS,
  GAME_STATUS,
  OPENING_RULES,
  SEATS,
  SEED_RANGE,
  STONES,
  VARIANT_SPECS,
} from "../gomoku.constants";
import { emptyBoard } from "../obstacles";
import type { Cell, GameSettings, GameState, OpeningRule, Point, Seat, Stone } from "../gomoku.types";
import { otherStone } from "./board";
import { hasHandicap } from "./handicap";
import { initialOpening } from "./opening";
import { seedFromRoll } from "./random";

/**
 * Settings and the state a game starts from. Nothing here plays a move; it
 * decides what the players agreed to and lays out an empty board for it.
 */

/** Openings that move colours between seats, which a colour-bound handicap cannot survive. */
const SWAPPING_OPENINGS: readonly GameSettings["opening"][] = [
  OPENING_RULES.swap,
  OPENING_RULES.swap2,
  OPENING_RULES.rif,
];

/**
 * The openings these settings may use: what the variant offers, less the
 * colour-swapping ones when a handicap is bound to a colour.
 */
export function availableOpenings(settings: GameSettings): OpeningRule[] {
  const offered = VARIANT_SPECS[settings.variant].openings;
  return hasHandicap(settings)
    ? offered.filter((opening) => !SWAPPING_OPENINGS.includes(opening))
    : [...offered];
}

/**
 * Settings that agree with their variant: a pinned line length wins over the
 * player's choice, an opening the variant does not offer falls back to free,
 * and a handicap rules out the openings that swap colours. Applied on creation
 * so a state can never carry a contradiction.
 */
export function normaliseSettings(settings: GameSettings): GameSettings {
  const spec = VARIANT_SPECS[settings.variant];
  // A game with a board of its own is played on it; the rest take any size they are given.
  const size =
    spec.boardSizes !== null && !spec.boardSizes.includes(settings.size)
      ? spec.boardSizes[0]
      : settings.size;
  return {
    ...settings,
    size,
    capturesToWin: spec.capturesToWin ?? settings.capturesToWin,
    winLength: spec.winLength ?? settings.winLength,
    opening: availableOpenings(settings).includes(settings.opening)
      ? settings.opening
      : OPENING_RULES.free,
  };
}

/**
 * The board a game of these settings begins on: empty, but for the pieces a
 * variant sets out before anybody moves.
 *
 * Lifted out of `createGame` so it can be asked on its own. Which way round a
 * board should be drawn for the person looking at it is a question about where
 * their colour starts, and the only honest answer to that is the position
 * itself — a second list of who begins where would be wrong the first time a
 * variant disagreed with it.
 */
export function startingBoard(settings: GameSettings): Cell[] {
  const spec = VARIANT_SPECS[settings.variant];
  const board = emptyBoard(settings);
  const place = (piece: { point: Point; stone: Stone }) => {
    board[piece.point.row * settings.size + piece.point.col] = piece.stone;
  };
  // A flipping game begins with the centre set; it is part of the position, not the record.
  for (const disc of startingDiscs(settings)) place(disc);
  // A race game begins with both camps full, likewise part of the position.
  if (spec.camps) for (const piece of startingPieces(settings)) place(piece);
  // Checkers begins with both sides' men filling their three rows, likewise.
  if (spec.checkers) for (const piece of checkersStartingPieces(settings.size)) place(piece);
  // Chinese Checkers begins with both points full, likewise.
  if (spec.chineseCheckers) for (const piece of starStartingPieces(STAR_RADIUS)) place(piece);
  return board;
}

/**
 * The colour that opens. `random` is decided by `roll`, a number in [0, 1),
 * which the caller supplies so this stays pure and testable. Variants that
 * constrain black, and every opening protocol, put black on move one.
 */
export function resolveOpener(settings: GameSettings, roll = 0): Stone {
  if (!VARIANT_SPECS[settings.variant].allowFirstPlayerChoice) return FIRST_STONE;
  if (settings.opening !== OPENING_RULES.free) return FIRST_STONE;
  if (settings.firstPlayer === FIRST_PLAYERS.random) {
    return roll < 0.5 ? STONES.black : STONES.white;
  }
  return settings.firstPlayer;
}

export function createGame(
  overrides: Partial<GameSettings> = {},
  roll = 0,
): GameState {
  // A game asked for without a seed draws one from the roll, and keeps it.
  const seed = overrides.seed ?? seedFromRoll(roll, SEED_RANGE);
  const settings = normaliseSettings({ ...DEFAULT_SETTINGS, ...overrides, seed });
  const opener = resolveOpener(settings, roll);
  // Seat one always takes the opening colour, whichever that turned out to be.
  const seats = {
    [opener]: SEATS.one,
    [otherStone(opener)]: SEATS.two,
  } as Record<Stone, Seat>;

  const board = startingBoard(settings);

  return {
    settings,
    board,
    moves: [],
    opener,
    seats,
    swapsUsed: { one: 0, two: 0 },
    captures: { black: 0, white: 0 },
    opening: initialOpening(settings, opener, seats),
    toPlay: opener,
    pendingTwist: false,
    kings: [],
    chainAt: null,
    koPoint: null,
    status: GAME_STATUS.playing,
    winner: null,
    winBy: null,
    winningLine: [],
  };
}

