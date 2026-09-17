import { appendFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { forcedReplies } from "@/lib/gomoku/forcedReplies";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { applyTurn } from "@/lib/gomoku/opponentTurns";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * GAMES TO TUNE THE COMPUTER'S JUDGEMENT FROM — asked for by name.
 *
 * `pnpm bots:eval-games`, on John's own machines. The line games' score for a
 * position is hand-set: a window of five points is worth 1, 4, 16, 64 or 256 as
 * it holds one to four of a colour's stones. The documented way to set such
 * numbers properly is Texel's: gather many positions from real games, each with
 * the result its game reached, and choose the numbers under which the score
 * best predicts those results. This plays the games and writes the positions.
 *
 * Only QUIET positions are kept — no five to make or block, no open three on
 * the board — because a position in the middle of a forced sequence is decided
 * by the sequence, not by the score, and would teach the score nothing.
 *
 * Writes nothing to any database. Knobs:
 * - `BOT_EVAL_GAMES` (required): games to play.
 * - `BOT_EVAL_OUT` (required): the file to append positions to, one JSON a line.
 * - `BOT_EVAL_SEED` (default 1): the first game's seed — give each machine or
 *   shard its own, so no two play the same games.
 * - `BOT_EVAL_MS` (default 60): time a move. Short on purpose: the aim is many
 *   decent games, not a few excellent ones.
 */
const GAMES = Number(process.env.BOT_EVAL_GAMES ?? 0);
const OUT = process.env.BOT_EVAL_OUT ?? "";
const SEED = Number(process.env.BOT_EVAL_SEED ?? 1);
const MS = Number(process.env.BOT_EVAL_MS ?? 60);
const SIZE = 15;

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Grades paired so both strong and ordinary play appear: the score must judge both kinds of position. */
const PAIRINGS: Array<[BotTier, BotTier]> = [
  ["guoshou", "guoshou"],
  ["meijin", "guoshou"],
  ["dan", "meijin"],
  ["guoshou", "dan"],
];

describe.skipIf(GAMES === 0 || OUT === "")("games for tuning the computer's judgement", () => {
  it(`plays ${GAMES} games from seed ${SEED}`, () => {
    let kept = 0;
    let decided = 0;
    for (let game = 0; game < GAMES; game += 1) {
      const random = seeded(SEED * 1_000_003 + game);
      let state = createGame({ variant: RULE_VARIANTS.freestyle, size: SIZE } as never);
      // A varied opening: four to seven stones near the middle, so no two games begin alike.
      const opening = 4 + Math.floor(random() * 4);
      while (state.moves.length < opening) {
        const row = 4 + Math.floor(random() * 7);
        const col = 4 + Math.floor(random() * 7);
        const next = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
        if (next !== state) state = next;
      }
      const [first, second] = PAIRINGS[game % PAIRINGS.length];
      const quiet: Array<{ moves: string[]; toPlay: string }> = [];
      while (state.status === GAME_STATUS.playing && state.moves.length < SIZE * SIZE) {
        if (forcedReplies(state) === null) {
          quiet.push({ moves: state.moves.map((move) => `${move.row},${move.col}`), toPlay: state.toPlay });
        }
        const tier = state.toPlay === STONES.black ? first : second;
        const turn = chooseTurn(state, tier, random, { millis: MS });
        if (turn === null) break;
        state = applyTurn(state, turn);
      }
      const winner = state.status === GAME_STATUS.won ? state.winner : null;
      if (winner !== null) decided += 1;
      const lines = quiet.map((position) =>
        JSON.stringify({
          moves: position.moves,
          // The result from the side to move's point of view: 1 won, 0 lost, 0.5 drawn.
          result: winner === null ? 0.5 : winner === position.toPlay ? 1 : 0,
        }),
      );
      if (lines.length > 0) appendFileSync(OUT, `${lines.join("\n")}\n`);
      kept += lines.length;
    }
    console.log(`seed ${SEED}: ${GAMES} games, ${decided} decided, ${kept} quiet positions written to ${OUT}`);
    expect(kept).toBeGreaterThan(0);
  }, 24 * 3_600_000);
});
