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
 * - `GOMOCUP_ORACLE_NODES`: after each game, score every move WE made with the
 *   engine at this many positions — the position before it and after it, each
 *   from the side to move — and print the moves that lost the most. It is how a
 *   loss is turned into a list of the moves that caused it. With
 *   `GOMOCUP_ORACLE_OUT` the full list, positions included, is written as JSON.
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
const ORACLE_NODES = process.env.GOMOCUP_ORACLE_NODES === undefined ? null : Number(process.env.GOMOCUP_ORACLE_NODES);
const ORACLE_OUT = process.env.GOMOCUP_ORACLE_OUT ?? null;

/** The protocol's rule numbers: 0 five or more, 1 exactly five, 4 renju. */
const RULE_NUMBER: Partial<Record<RuleVariant, number>> = {
  [RULE_VARIANTS.freestyle]: 0,
  [RULE_VARIANTS.standard]: 1,
  [RULE_VARIANTS.renju]: 4,
};

/** One engine process, and a way to ask it for the next line that is not commentary. */
type Engine = {
  child: ChildProcessWithoutNullStreams;
  next: (ms: number) => Promise<string>;
  send: (line: string) => void;
  /** The last evaluation the engine announced, as it printed it ("-657", "+M3"), or null. */
  lastEval: () => string | null;
};

function startEngine(path: string): Engine {
  const child = spawn(path, [], { cwd: path.replace(/\/[^/]+$/, "") });
  const lines: string[] = [];
  const waiting: Array<(line: string) => void> = [];
  let evaluation: string | null = null;
  createInterface({ input: child.stdout }).on("line", (raw) => {
    const line = raw.trim();
    const said = /\bEval ([+-]?M?\d+)/.exec(line);
    if (said !== null) evaluation = said[1];
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
  const send = (line: string) => {
    if (line === "BOARD") evaluation = null;
    child.stdin.write(`${line}\n`);
  };
  return { child, next, send, lastEval: () => evaluation };
}

/** An evaluation as a number from the side to move: a forced win in k is 30000 − k, a forced loss its negative. */
function scoreOf(said: string | null): number | null {
  if (said === null) return null;
  const mate = /^([+-])?M(\d+)$/.exec(said);
  if (mate !== null) return (mate[1] === "-" ? -1 : 1) * (30_000 - Number(mate[2]));
  return Number(said);
}

/** The engine's verdict on the position after the first `count` moves, from the side to move, and its choice there. */
async function verdict(oracle: Engine, state: GameState, count: number): Promise<{ score: number | null; best: string }> {
  const moves = state.moves.slice(0, count);
  const toMove = count % 2 === 0 ? state.moves[0].stone : moves[0].stone === STONES.black ? STONES.white : STONES.black;
  const lines = ["BOARD", ...moves.map((move) => `${move.col},${move.row},${move.stone === toMove ? 1 : 2}`), "DONE"];
  for (const line of lines) oracle.send(line);
  const best = await oracle.next(120_000);
  return { score: scoreOf(oracle.lastEval()), best };
}

type Scored = { game: number; move: number; ours: string; best: string; before: number | null; after: number | null; drop: number | null; moves: string[] };

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
    const scored: Scored[] = [];
    let oracle: Engine | null = null;
    if (ORACLE_NODES !== null) {
      oracle = startEngine(ENGINE);
      oracle.send(`START ${SIZE}`);
      expect(await oracle.next(10_000)).toBe("OK");
      oracle.send("INFO timeout_turn 120000");
      oracle.send("INFO timeout_match 100000000");
      oracle.send(`INFO rule ${RULE_NUMBER[VARIANT] ?? 0}`);
      oracle.send(`INFO max_node ${ORACLE_NODES}`);
    }
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

      if (oracle !== null) {
        const mine: Scored[] = [];
        for (let at = 3; at < state.moves.length; at += 1) {
          const move = state.moves[at];
          if (move.stone !== us) continue;
          const before = await verdict(oracle, state, at);
          const after = await verdict(oracle, state, at + 1);
          const afterForUs = after.score === null ? null : -after.score;
          mine.push({
            game: game + 1,
            move: at + 1,
            ours: `${move.col},${move.row}`,
            best: before.best,
            before: before.score,
            after: afterForUs,
            drop: before.score === null || afterForUs === null ? null : before.score - afterForUs,
            moves: state.moves.map((one) => `${one.col},${one.row}`),
          });
        }
        scored.push(...mine);
        const worst = mine.filter((one) => one.drop !== null).sort((a, b) => (b.drop ?? 0) - (a.drop ?? 0)).slice(0, 3);
        for (const one of worst) {
          console.log(`   move ${one.move}: we played ${one.ours}, oracle prefers ${one.best}; ${one.before} → ${one.after} (lost ${one.drop})`);
        }
      }
      console.log(
        `game ${game + 1}: ${winner === null ? "draw" : winner === us ? `WE won (${us})` : `engine won (${engineStone})`} in ${state.moves.length} moves${result === "" ? "" : ` — ${result}`}`,
      );
    }

    if (oracle !== null) {
      oracle.send("END");
      oracle.child.kill();
      const drops = scored.map((one) => one.drop).filter((drop): drop is number => drop !== null);
      const bands = [
        ["lost the game outright (a decided loss from a position that was not)", (one: Scored) => (one.after ?? 0) <= -20_000 && (one.before ?? 0) > -20_000],
        ["lost over 1000", (one: Scored) => (one.drop ?? 0) > 1000 && (one.after ?? 0) > -20_000],
        ["lost 300–1000", (one: Scored) => (one.drop ?? 0) > 300 && (one.drop ?? 0) <= 1000],
        ["lost 100–300", (one: Scored) => (one.drop ?? 0) > 100 && (one.drop ?? 0) <= 300],
      ] as const;
      console.log(`oracle at ${ORACLE_NODES} positions scored ${drops.length} of our moves:`);
      for (const [label, test] of bands) console.log(`   ${scored.filter(test).length} ${label}`);
      if (ORACLE_OUT !== null) {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(ORACLE_OUT, JSON.stringify(scored, null, 1));
      }
    }

    console.log(
      `${TIER} at ${OUR_MS} ms against ${ENGINE.split("/").slice(-2).join("/")} at ${ENGINE_NODES === null ? `${ENGINE_MS} ms` : `${ENGINE_NODES} positions`}, ${VARIANT} ${SIZE}x${SIZE}: ` +
        `us ${ours} – engine ${theirs} – drawn ${drawn}; average game ${Math.round(lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length))} moves`,
    );
  }, 24 * 3_600_000);
});
