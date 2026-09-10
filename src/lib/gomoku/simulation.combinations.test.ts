import { describe, expect, it } from "vitest";

import {
  GAME_STATUS,
  NO_HANDICAP,
  OPENING_RULES,
  RULE_VARIANTS,
  STONES,
  VARIANT_SPECS,
  boardSizesFor,
} from "./gomoku.constants";
import { createGame, replayMoves } from "./engine";
import type { Handicap, RuleVariant } from "./gomoku.types";
import { playOut } from "./simulation.support";

/**
 * Every game, on every board it offers, under every opening it offers, and
 * with a handicap laid over it.
 *
 * The simulator already plays every variant, and it already plays several
 * board sizes — but never the two together, and never with an opening or a
 * handicap in the way. Each of those reaches into the engine from a different
 * direction, and a game breaks where two of them meet far more often than
 * where one of them is.
 *
 * COUNTED FROM `VARIANT_SPECS`, NOT WRITTEN DOWN. A game added to the specs is
 * played here on every board its own row claims, without anybody remembering
 * to add it — the same bargain the New Game Gate makes, and the reason this is
 * worth more than a longer list of hand-picked cases.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO, because the simulator cannot yet judge
 * it and a test that cannot judge its subject is worse than no test:
 *
 *  - It does not play a game through a swap opening. `playOut` places stones
 *    and never makes an opening CHOICE, so a game waiting for one looks to it
 *    like a game with no legal move. The openings that need a choice are
 *    checked here only as far as "the game is waiting for a choice, not for a
 *    stone", which is true and is what a player would see.
 *  - It does not hand a colour a handicap that changes WHAT WINS — exactLine,
 *    longerLine, openLine, overline. `runWinsIndependently`, the hand-written
 *    restatement that makes this simulator worth having, switches on the
 *    variant and knows nothing of handicaps: it reads a line of six as a win
 *    where the engine correctly refuses one, and then reports the ENGINE as
 *    wrong. Teaching it handicaps is its own piece of work, and until it is
 *    done a sweep over those flags would be a sweep that lies.
 */

const EVERY_VARIANT = Object.values(RULE_VARIANTS) as RuleVariant[];

/** The openings a player walks through alone, with nothing to decide. */
const NO_CHOICE: readonly string[] = [OPENING_RULES.free, OPENING_RULES.pro, OPENING_RULES.longPro];

/** A seed that depends on the combination, so two of them never play the same game. */
function seedFor(variant: string, extra: string, index: number): number {
  let hash = index * 2_654_435_761;
  for (const text of [variant, extra]) {
    for (let at = 0; at < text.length; at += 1) {
      hash = (hash * 31 + text.charCodeAt(at)) >>> 0;
    }
  }
  return (hash % 100_000) + 1;
}

/**
 * The one thing every game must be able to do: be replayed from its own move
 * list. A stored game is its settings and its moves and nothing else, so a
 * replay that diverges means a saved game and the game that was played are
 * two different games.
 */
function replays(final: ReturnType<typeof playOut>, what: string) {
  const start = createGame({ ...final.settings, firstPlayer: final.opener });
  const timeline = replayMoves(
    start,
    final.moves.map((move) => ({
      row: move.row,
      col: move.col,
      kind: move.kind,
      from: move.from,
      twist: move.twist,
      cells: move.cells,
      stone: move.stone,
    })),
    final.opening.choices,
  );
  const replayed = timeline[timeline.length - 1];
  expect(replayed.board, `${what}: replayed board differs`).toEqual(final.board);
  expect(replayed.status, `${what}: replayed status differs`).toBe(final.status);
  expect(replayed.winner, `${what}: replayed winner differs`).toBe(final.winner);
}

describe("every game on every board it offers", () => {
  it("plays out, and replays from its moves alone", () => {
    let played = 0;
    for (const variant of EVERY_VARIANT) {
      for (const [index, size] of boardSizesFor(variant).entries()) {
        const what = `${variant} on ${size}×${size}`;
        const final = playOut({ variant, size }, seedFor(variant, String(size), index));
        // The board it was played on is the board it was given: a game that
        // quietly resized itself would make its own record a lie.
        expect(final.settings.size, `${what}: played on another board`).toBe(size);
        expect(final.board, `${what}: board is the wrong length`).toHaveLength(size * size);
        replays(final, what);
        played += 1;
      }
    }
    // The sweep is only worth having if it is actually sweeping.
    expect(played).toBeGreaterThan(EVERY_VARIANT.length);
  });
});

describe("every game under every opening it offers", () => {
  it("plays out under the openings a player walks through alone", () => {
    for (const variant of EVERY_VARIANT) {
      for (const [index, opening] of VARIANT_SPECS[variant].openings.entries()) {
        if (!NO_CHOICE.includes(opening)) continue;
        const what = `${variant} with the ${opening} opening`;
        const final = playOut({ variant, opening }, seedFor(variant, opening, index + 7));
        expect(final.settings.opening, `${what}: played under another opening`).toBe(opening);
        /*
         * A game that is over before anybody has moved is the shape a broken
         * opening takes: a mistake there ends the game rather than refusing
         * something, and the record looks ordinary afterwards.
         */
        if (final.status !== GAME_STATUS.playing) {
          expect(final.moves.length, `${what}: finished with an empty board`).toBeGreaterThan(0);
        }
        replays(final, what);
      }
    }
  });

  it("starts every opening that has something to decide, waiting for the decision", () => {
    /*
     * As far as this can be taken without a simulator that makes choices: a
     * swap game must begin, must know which opening it is under, and must be
     * asking for a decision rather than sitting there finished or waiting for
     * a stone nobody may place.
     */
    let checked = 0;
    for (const variant of EVERY_VARIANT) {
      for (const opening of VARIANT_SPECS[variant].openings) {
        if (NO_CHOICE.includes(opening)) continue;
        const what = `${variant} with the ${opening} opening`;
        const game = createGame({ variant, opening });
        expect(game.settings.opening, `${what}: created under another opening`).toBe(opening);
        expect(game.status, `${what}: began already over`).toBe(GAME_STATUS.playing);
        expect(game.opening.choices, `${what}: began with a decision already made`).toEqual([]);
        checked += 1;
      }
    }
    expect(checked, "no game offers an opening with a decision in it").toBeGreaterThan(0);
  });
});

describe("every game with a handicap laid over it", () => {
  /*
   * Every handicap that FORBIDS A MOVE, all at once, and none that changes
   * what wins — see the note at the top of this file. Everything that asks
   * "may this colour…" reads `rulesFor`, which lays this over the variant's
   * own spec, so this is where the two disagree most.
   */
  const heavy = (stone: Handicap["stone"]): Handicap => ({
    ...NO_HANDICAP,
    stone,
    doubleThree: true,
    doubleFour: true,
  });

  it("still plays out, for one colour or the other", () => {
    /*
     * One colour per game, alternating down the list, rather than both for
     * every game. Two full games a variant doubled what this file costs the
     * unit gate to say something the first one had already said; alternating
     * still puts every rule under both colours across the sweep.
     */
    for (const [index, variant] of EVERY_VARIANT.entries()) {
      const stone = index % 2 === 0 ? STONES.black : STONES.white;
      const what = `${variant} with ${stone} handicapped`;
      const final = playOut(
        { variant, handicap: heavy(stone) },
        seedFor(variant, `handicap-${stone}`, index + 23),
      );
      expect(final.settings.handicap.stone, `${what}: the handicap was dropped`).toBe(stone);
      replays(final, what);
    }
  });

  it("gives the unhandicapped colour exactly the rules its variant gives it", () => {
    /*
     * A handicap belongs to one colour. The commonest way to get this wrong
     * is to lay it over the board rather than over a player, and that is
     * invisible in a game where both sides are being watched loosely: the
     * game still ends, somebody still wins.
     */
    for (const variant of EVERY_VARIANT) {
      // Created rather than played: this asks what the game was set up with,
      // and a whole game of random moves to answer that is nine seconds of
      // the unit gate spent on a question the first line already answers.
      const game = createGame({ variant, handicap: heavy(STONES.black) });
      expect(game.settings.handicap.stone, `${variant}: the handicap changed colour`).toBe(STONES.black);
      expect(game.settings.handicap.doubleThree, `${variant}: the handicap lost a rule`).toBe(true);
      expect(game.settings.handicap.overline, `${variant}: the handicap gained a rule`).toBe(false);
    }
  });
});
