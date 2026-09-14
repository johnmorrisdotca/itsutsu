import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The gate on the two moves that have no point.
 *
 * A turn lost on time used to be written as a pass, and the one fact that
 * separates them — whether the rules offered a pass at all — is exactly the
 * one a replay needs. Every game with no pass to offer stopped its record at
 * the first timeout, and the game could not be finished. The fix is a kind of
 * its own, `forfeit`, and that is only a fix for as long as every reader of a
 * move's kind knows it exists.
 *
 * Nothing fails when one does not. A move list that prints "-1,-1", a replay
 * that stops a turn short, a file that writes `W[]` for a turn nobody passed:
 * each looks like a record, and is read as one. So the shape of the mistake is
 * checked in the source, the way `settledTurn.coverage.test.ts` checks its own:
 *
 *  1. A MODULE THAT ASKS WHETHER A MOVE IS A PASS SAYS WHAT IT DOES WITH A
 *     FORFEIT — by naming `MOVE_KINDS.forfeit`, or by asking `leavesNoStone`
 *     or `stonelessWord` instead. Or it is listed below with the reason a
 *     forfeit can never reach it.
 *  2. A MODULE THAT REPLAYS A RECORD SAYS WHETHER IT HAD A CLOCK. Without it a
 *     forfeit is refused, which is the safe answer and the wrong one for a
 *     live game.
 *  3. ONLY THE ENGINE WRITES A FORFEIT, and nothing that takes a move from
 *     outside accepts one. A forfeit is a claim's verdict, not a request.
 */

/** Every module under src/ that is not a test. */
function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, found);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(path);
  }
  return found;
}

const files = sources("src").map((path) => ({ path, text: readFileSync(path, "utf8") }));

/** A kind compared with a pass, by constant or by string. */
const ASKS_FOR_A_PASS = /\bkind\s*[!=]==\s*(?:MOVE_KINDS\.pass\b|["']pass["'])/;
const ACCOUNTS_FOR_A_FORFEIT = /MOVE_KINDS\.forfeit\b|\bleavesNoStone\(|\bstonelessWord\(/;

/**
 * Modules that ask about a pass and rightly say nothing about a forfeit, and why.
 */
const PASS_AND_ONLY_A_PASS = new Map([
  [
    "src/lib/gomoku/engine.ts",
    "passTurn asks whether the move before was a PASS, since two in a row end the game; a turn lost on time is not the first of two",
  ],
  ["src/lib/history/liveGame.ts", "reads a REQUEST's kind; there is no request for a forfeit, so the pass branch is the whole of it"],
  ["src/lib/gomoku/opponentTurns.ts", "a computer's candidate turns, which offer a pass and never a forfeit"],
  ["src/lib/gomoku/opponent.ts", "scores a computer's candidate turn, never a stored move"],
  ["src/lib/bots/botPlay.ts", "turns a computer's chosen turn into a request, and no computer chooses a forfeit"],
  ["src/lib/history/gameRecord.ts", "a filed game's move schema has no forfeit in its enum, so no move reaching that check can be one"],
  ["src/lib/gomoku/simulation.checks.ts", "the simulator plays without a clock, so nothing on its record is a forfeit"],
  ["src/lib/gomoku/simulation.go.ts", "the simulator plays without a clock, so nothing on its record is a forfeit"],
]);

/**
 * A forfeit named as a move's kind in an object — a move made, a row written,
 * or a row looked for. Every module doing it is listed with the reason, so a
 * new one is a decision somebody wrote down rather than a way round the claim.
 */
const NAMES_A_FORFEIT_KIND = /kind:\s*MOVE_KINDS\.forfeit\b/;
const MAY_NAME_A_FORFEIT_KIND = new Map([
  ["src/lib/gomoku/rules/seats.ts", "forfeitTurn: the engine making one, which the claim then writes as it settled it"],
  ["src/lib/history/forfeitRows.ts", "the one-off repair of passes a claim wrote before this kind existed"],
  ["src/lib/history/liveAgainst.ts", "a fork COUNTING forfeits in a position, to refuse carrying one into a game with no clock; it writes none"],
]);

describe("the moves that have no point", () => {
  it("are both accounted for wherever a move's kind is asked about", () => {
    const forgotten = files
      .filter(({ path, text }) => ASKS_FOR_A_PASS.test(text) && !ACCOUNTS_FOR_A_FORFEIT.test(text))
      .map(({ path }) => path)
      .filter((path) => !PASS_AND_ONLY_A_PASS.has(path));
    expect(forgotten, "these ask whether a move is a pass and say nothing of a forfeit").toEqual([]);
  });

  it("list no exception that no longer asks about a pass", () => {
    const stale = [...PASS_AND_ONLY_A_PASS.keys()].filter((path) => {
      const file = files.find((one) => one.path === path);
      return file === undefined || !ASKS_FOR_A_PASS.test(file.text);
    });
    expect(stale, "an exception for a module that no longer needs one lets the next one through unread").toEqual([]);
  });

  it("are replayed with the clock the record had", () => {
    const unsaid = files
      .filter(({ path, text }) => /\breplayMoves\(/.test(text) && !path.endsWith(join("rules", "record.ts")))
      .filter(({ text }) => !/\bclocked\b/.test(text))
      .map(({ path }) => path);
    expect(unsaid, "these replay a record without saying whether it ran a clock").toEqual([]);
  });

  it("include a forfeit made by the engine alone, and named as a kind nowhere unlisted", () => {
    const naming = files.filter(({ text }) => NAMES_A_FORFEIT_KIND.test(text)).map(({ path }) => path);
    expect(naming.filter((path) => !MAY_NAME_A_FORFEIT_KIND.has(path)), "these name a forfeit kind with no reason given").toEqual([]);
    expect([...MAY_NAME_A_FORFEIT_KIND.keys()].filter((path) => !naming.includes(path)), "listed, and no longer naming one").toEqual([]);
  });

  it("never include a forfeit taken from a caller", () => {
    const accepting = files
      .filter(({ text }) => /z\.enum\(\[[^\]]*MOVE_KINDS\.forfeit/.test(text) || /z\.literal\(\s*MOVE_KINDS\.forfeit/.test(text))
      .map(({ path }) => path);
    expect(accepting).toEqual([]);
  });
});
