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
import type { GameSettings, GameState, OpeningRule, Seat, Stone } from "../gomoku.types";
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

  // A flipping game begins with the centre set; it is part of the position, not the record.
  const board = emptyBoard(settings);
  for (const disc of startingDiscs(settings)) {
    board[disc.point.row * settings.size + disc.point.col] = disc.stone;
  }

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
    status: GAME_STATUS.playing,
    winner: null,
    winBy: null,
    winningLine: [],
  };
}

