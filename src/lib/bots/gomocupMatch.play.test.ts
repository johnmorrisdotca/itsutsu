import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { applyTurn } from "@/lib/gomoku/opponentTurns";
import type { GameState, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * OUR COMPUTER PLAYER AGAINST AN OUTSIDE ENGINE — how strong are we, really?
 *
 * `pnpm bots:gomocup`, with `GOMOCUP_ENGINE` naming an engine's executable. It
 * speaks the Gomocup (Piskvork) protocol, the plain-text one every competition
 * engine answers — START, INFO, BOARD, and a move back as "x,y" — so it works
 * with any of them, and it contains nothing of theirs: the engine is a separate
 * program on this machine, never part of this repository. John, 2026-09-17: run
 * it against Rapfi, the Gomocup champion, to know whether we are less, equal or
 * better; see the memory note on GPL for why Rapfi lives beside itsutsu and not
 * inside it.
 *
 * Runs on this machine only, and writes nothing. Knobs:
 * - `GOMOCUP_ENGINE` (required): path to the engine executable.
 * - `GOMOCUP_GAMES` (default 10): games, colours alternating, openings paired.
 * - `GOMOCUP_TIER` (default guoshou): which of our grades plays.
 * - `GOMOCUP_OUR_MS` / `GOMOCUP_ENGINE_MS` (default 250 each): time per move.
 * - `GOMOCUP_ENGINE_NODES`: instead of a clock, the most positions the engine may
 *   search a move (the Yixin-Board `INFO max_node`). This is the handicap to use:
 *   a clock of a few milliseconds is not a weaker engine but a broken one — Rapfi
 *   keeps a safety margin, budgeted 0 ms at a 20 ms limit, searched nothing, and
 *   lost 10–0 in 17 moves, which measured the margin and not the engine.
 * - `GOMOCUP_VARIANT` (freestyle | standard | renju) and `GOMOCUP_SIZE` (15).
 */
const ENGINE = process.env.GOMOCUP_ENGINE ?? "";
const GAMES = Number(process.env.GOMOCUP_GAMES ?? 10);
const TIER = (process.env.GOMOCUP_TIER ?? "guoshou") as BotTier;
const OUR_MS = Number(process.env.GOMOCUP_OUR_MS ?? 250);
const ENGINE_NODES = process.env.GOMOCUP_ENGINE_NODES === undefined ? null : Number(process.env.GOMOCUP_ENGINE_NODES);
// With a node limit the clock is only a backstop, far above what the limit costs.
const ENGINE_MS = ENGINE_NODES === null ? Number(process.env.GOMOCUP_ENGINE_MS ?? 250) : 60_000;
const VARIANT = (process.env.GOMOCUP_VARIANT ?? RULE_VARIANTS.freestyle) as RuleVariant;
const SIZE = Number(process.env.GOMOCUP_SIZE ?? 15);

/** The protocol's rule numbers: 0 five or more, 1 exactly five, 4 renju. */
const RULE_NUMBER: Partial<Record<RuleVariant, number>> = {
  [RULE_VARIANTS.freestyle]: 0,
  [RULE_VARIANTS.standard]: 1,
  [RULE_VARIANTS.renju]: 4,
};

/** One engine process, and a way to ask it for the next line that is not commentary. */
function startEngine(path: string): { child: ChildProcessWithoutNullStreams; next: (ms: number) => Promise<string>; send: (line: string) => void } {
  const child = spawn(path, [], { cwd: path.replace(/\/[^/]+$/, "") });
  const lines: string[] = [];
  const waiting: Array<(line: string) => void> = [];
  createInterface({ input: child.stdout }).on("line", (raw) => {
    const line = raw.trim();
    // MESSAGE, DEBUG, ERROR and UNKNOWN lines are commentary; only answers are queued.
    if (line === "" || /^(MESSAGE|DEBUG|ERROR|UNKNOWN)\b/.test(line)) return;
    const reader = waiting.shift();
    if (reader !== undefined) reader(line);
    else lines.push(line);
  });
  const next = (ms: number) =>
    new Promise<string>((resolve, reject) => {
      const ready = lines.shift();
      if (ready !== undefined) return resolve(ready);
      const timer = setTimeout(() => reject(new Error(`engine gave no answer in ${ms} ms`)), ms);
      waiting.push((line) => {
        clearTimeout(timer);
        resolve(line);
      });
    });
  const send = (line: string) => child.stdin.write(`${line}\n`);
  return { child, next, send };
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Three stones near the centre, the same for both games of a pair. */
function opening(pair: number): GameState {
  const r = seeded(4242 + pair);
  let state = createGame({ variant: VARIANT, size: SIZE } as never);
  const mid = Math.floor(SIZE / 2);
  while (state.moves.length < 3) {
    const row = mid - 2 + Math.floor(r() * 5);
    const col = mid - 2 + Math.floor(r() * 5);
    const after = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
    if (after !== state) state = after;
  }
  return state;
}

/** The whole board as the protocol's BOARD block, from the engine's side: 1 its own, 2 ours. */
function boardFor(state: GameState, engine: Stone): string[] {
  const lines = ["BOARD"];
  for (const move of state.moves) {
    if (move.row === undefined || move.col === undefined || move.stone === undefined) continue;
    lines.push(`${move.col},${move.row},${move.stone === engine ? 1 : 2}`);
  }
  lines.push("DONE");
  return lines;
}

describe.skipIf(ENGINE === "")("our computer player against an outside engine", () => {
  it(`${TIER} against ${ENGINE.split("/").pop()}`, async () => {
    let ours = 0;
    let theirs = 0;
    let drawn = 0;
    const lengths: number[] = [];

    for (let game = 0; game < GAMES; game += 1) {
      let state = opening(Math.floor(game / 2));
      // Even games: we play the colour to move after the opening; odd games: the engine does.
      const us = game % 2 === 0 ? state.toPlay : state.toPlay === STONES.black ? STONES.white : STONES.black;
      const engineStone = us === STONES.black ? STONES.white : STONES.black;
      const engine = startEngine(ENGINE);
      engine.send(`START ${SIZE}`);
      expect(await engine.next(10_000)).toBe("OK");
      engine.send(`INFO timeout_turn ${ENGINE_MS}`);
      engine.send("INFO timeout_match 100000000");
      engine.send(`INFO rule ${RULE_NUMBER[VARIANT] ?? 0}`);
      if (ENGINE_NODES !== null) engine.send(`INFO max_node ${ENGINE_NODES}`);
      const dice = seeded(900 + game);
      let result = "";

      while (state.status === GAME_STATUS.playing && state.moves.length < SIZE * SIZE) {
        if (state.toPlay === us) {
          const turn = chooseTurn(state, TIER, dice, { millis: OUR_MS });
          if (turn === null) {
            result = "we had no move";
            break;
          }
          state = applyTurn(state, turn);
          continue;
        }
        for (const line of boardFor(state, engineStone)) engine.send(line);
        const answer = await engine.next(ENGINE_MS * 2 + 5_000);
        const [col, row] = answer.split(",").map(Number);
        const after = applyTurn(state, { kind: MOVE_KINDS.place, row, col });
        if (after === state) {
          // An illegal answer loses the game, as it would at a tournament.
          result = `engine played an illegal move: ${answer}`;
          break;
        }
        state = after;
      }
      engine.send("END");
      engine.child.kill();

      const winner = result.startsWith("engine") ? us : result !== "" ? engineStone : state.winner;
      if (winner === null) drawn += 1;
      else if (winner === us) ours += 1;
      else theirs += 1;
      lengths.push(state.moves.length);
      console.log(
        `game ${game + 1}: ${winner === null ? "draw" : winner === us ? `WE won (${us})` : `engine won (${engineStone})`} in ${state.moves.length} moves${result === "" ? "" : ` — ${result}`}`,
      );
    }

    console.log(
      `${TIER} at ${OUR_MS} ms against ${ENGINE.split("/").slice(-2).join("/")} at ${ENGINE_NODES === null ? `${ENGINE_MS} ms` : `${ENGINE_NODES} positions`}, ${VARIANT} ${SIZE}x${SIZE}: ` +
        `us ${ours} – engine ${theirs} – drawn ${drawn}; average game ${Math.round(lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length))} moves`,
    );
  }, 24 * 3_600_000);
});
