import { z } from "zod";

import {
  ALL_BOARD_SIZES,
  NO_HANDICAP,
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  RULE_VARIANTS,
  RULE_VARIANT_LIST,
  SECOND_STONE_EXCLUSIONS,
  STONES,
} from "@/lib/gomoku/gomoku.constants";
import type { Handicap, OpeningRule } from "@/lib/gomoku/gomoku.types";

/**
 * The shapes of a game's settings as they cross the API and the database.
 * Shared by recording, shared games and the history readers, so a handicap
 * stored by one is exactly what the others read back.
 */

export const stoneSchema = z.enum([STONES.black, STONES.white]);

/** The cells of a piece as a record carries them. A pass has none. */
export const pieceCellsSchema = z
  .array(
    z.object({
      row: z.number().int().min(0).max(64),
      col: z.number().int().min(0).max(64),
      stone: stoneSchema,
    }),
  )
  .min(2)
  .max(4)
  .nullable();

export const variantSchema = z.enum(RULE_VARIANT_LIST).default(RULE_VARIANTS.freestyle);

export const obstaclesSchema = z
  .enum([OBSTACLE_LAYOUTS.none, OBSTACLE_LAYOUTS.hoshi])
  .default(OBSTACLE_LAYOUTS.none);

export const boardSizeSchema = z
  .number()
  .int()
  .refine((size) => (ALL_BOARD_SIZES as readonly number[]).includes(size), {
    message: "Not a board size this game offers.",
  });

/** Every opening a recorded game may carry. */
export const openingSchema = z
  .enum([
    OPENING_RULES.free,
    OPENING_RULES.pro,
    OPENING_RULES.longPro,
    OPENING_RULES.swap,
    OPENING_RULES.swap2,
    OPENING_RULES.rif,
  ])
  .default(OPENING_RULES.free);

/**
 * The openings a shared game may use. A seat token is a colour, and the swap
 * protocols move colours between players, so those cannot be played across
 * two devices.
 */
export const SHARED_OPENINGS: readonly OpeningRule[] = [
  OPENING_RULES.free,
  OPENING_RULES.pro,
  OPENING_RULES.longPro,
];

export const sharedOpeningSchema = z
  .enum([OPENING_RULES.free, OPENING_RULES.pro, OPENING_RULES.longPro])
  .default(OPENING_RULES.free);

/** Per-move time limits a shared game may use, in milliseconds. Null is no clock. */
export const MOVE_TIME_OPTIONS = [
  null,
  5 * 60_000,
  30 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
  24 * 60 * 60_000,
  3 * 24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
] as const;

export const TIMEOUT_PENALTIES = ["turn", "game"] as const;
export type TimeoutPenalty = (typeof TIMEOUT_PENALTIES)[number];

/** Three missed turns in a row lose the game under the graceful penalty. */
export const FORFEITS_TO_LOSE = 3;

export const moveTimeSchema = z
  .number()
  .int()
  .min(60_000)
  .max(30 * 24 * 60 * 60_000)
  .nullable()
  .default(null);

export const timeoutPenaltySchema = z.enum(TIMEOUT_PENALTIES).default("turn");

export const handicapSchema = z
  .object({
    stone: stoneSchema.nullable().default(null),
    doubleThree: z.boolean().default(false),
    doubleFour: z.boolean().default(false),
    overline: z.boolean().default(false),
    exactLine: z.boolean().default(false),
    openLine: z.boolean().default(false),
    longerLine: z.boolean().default(false),
    singleStone: z.boolean().default(false),
    noCaptures: z.boolean().default(false),
    secondStoneExclusion: z
      .number()
      .int()
      .refine((value) => (SECOND_STONE_EXCLUSIONS as readonly number[]).includes(value))
      .default(0),
  })
  .nullable()
  .default(null);

/**
 * A handicap read back from the database's JSON column. Anything that does
 * not parse, including null, is no handicap — a stored game must always load.
 */
export function parseHandicap(value: unknown): Handicap {
  const parsed = handicapSchema.safeParse(value);
  if (!parsed.success || parsed.data === null || parsed.data.stone === null) {
    return NO_HANDICAP;
  }
  return parsed.data;
}

/** What goes into the JSON column: null rather than a handicap for nobody. */
export function storedHandicap(handicap: Handicap): Handicap | null {
  return handicap.stone === null ? null : handicap;
}
