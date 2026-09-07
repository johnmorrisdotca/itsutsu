import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  MOVE_KINDS,
  OBSTACLE_LAYOUTS,
  RULE_VARIANTS,
  STONES,
} from "@/lib/gomoku/gomoku.constants";
import { fetchGameDetail } from "./gameHistory";
import { GAME_RESULTS, PLAYER_NAME_MAX } from "./gameHistory.constants";
import type { GameDetail } from "./gameHistory.types";

const stoneSchema = z.enum([STONES.black, STONES.white]);

const moveSchema = z.object({
  row: z.number().int().min(0).max(64),
  col: z.number().int().min(0).max(64),
  stone: stoneSchema,
  kind: z.enum([MOVE_KINDS.place, MOVE_KINDS.skip]).default(MOVE_KINDS.place),
});

/**
 * A game as the client reports it. The move list is the record — `moveCount`
 * is derived here rather than accepted, so the stored count can never disagree
 * with the stones it counts.
 */
export const gameRecordSchema = z
  .object({
    blackName: z.string().max(PLAYER_NAME_MAX).default(""),
    whiteName: z.string().max(PLAYER_NAME_MAX).default(""),
    size: z.number().int().min(5).max(25),
    winLength: z.number().int().min(3).max(9),
    variant: z.enum([RULE_VARIANTS.freestyle, RULE_VARIANTS.standard]),
    obstacles: z
      .enum([OBSTACLE_LAYOUTS.none, OBSTACLE_LAYOUTS.hoshi])
      .default(OBSTACLE_LAYOUTS.none),
    opener: stoneSchema,
    result: z.enum(GAME_RESULTS),
    winner: stoneSchema.nullable().default(null),
    durationMs: z.number().int().min(0).max(86_400_000).nullable().default(null),
    moves: z.array(moveSchema).max(625),
  })
  .refine((game) => game.moves.every((move) => move.row < game.size && move.col < game.size), {
    message: "A move falls outside the board.",
    path: ["moves"],
  })
  .refine(
    (game) =>
      game.result === "draw" || game.result === "abandoned"
        ? game.winner === null
        : game.winner === game.result,
    { message: "The winner must match the result.", path: ["winner"] },
  )
  .refine(
    (game) => {
      const seen = new Set(game.moves.map((move) => `${move.row},${move.col}`));
      return seen.size === game.moves.length;
    },
    { message: "Two moves share an intersection.", path: ["moves"] },
  );

export type GameRecordInput = z.infer<typeof gameRecordSchema>;

/**
 * Stores one finished game and its stones in a single transaction, so a game
 * row can never exist without the moves that produced it.
 */
export async function recordGame(input: GameRecordInput): Promise<GameDetail> {
  const created = await prisma.game.create({
    data: {
      blackName: input.blackName.trim(),
      whiteName: input.whiteName.trim(),
      size: input.size,
      winLength: input.winLength,
      variant: input.variant,
      obstacles: input.obstacles,
      opener: input.opener,
      result: input.result,
      winner: input.winner,
      durationMs: input.durationMs,
      moveCount: input.moves.length,
      moves: {
        create: input.moves.map((move, index) => ({
          number: index + 1,
          row: move.row,
          col: move.col,
          stone: move.stone,
          kind: move.kind,
        })),
      },
    },
    select: { id: true },
  });

  const detail = await fetchGameDetail(created.id);
  if (detail === null) {
    throw new Error(`Game ${created.id} vanished immediately after being written.`);
  }
  return detail;
}
