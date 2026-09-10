import { describe, expect, it } from "vitest";

import { createGame, playMove } from "./engine";
import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, RULE_VARIANT_LIST, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { boardSizesFor } from "./gomoku.constants";
import { seededRandom } from "./rules/random";
import {
  BOT_ALL_TIERS,
  BOT_PROFILES,
  BOT_SPECIALIST_LIST,
  BOT_TIER_LIST,
  BOT_TIERS,
  TIER_SPECS,
} from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { applyTurn, legalTurns } from "./opponentTurns";
import { readsThreats } from "./opponentEval";
import { fromDiagram } from "./gomoku.test-support";
import { searchTurn, searchable } from "./opponentSearch";
import type { GameSettings, GameState, RuleVariant } from "./gomoku.types";
import type { BotTier } from "./opponent.types";

/**
 * The computer opponent, checked the way the engine is: by playing.
 *
 * The claims worth making about a graded player are that it can finish a game
 * of anything on the site, that it never plays a turn the rules refuse, that it
 * takes a win and stops one, that it knows a giveaway game is giveaway — and
 * that the three grades are actually in that order. Each of those is a test.
 */

/**
 * What the strongest grade may spend in these tests: a small, fixed number of
 * positions, and a clock set far enough out that it never binds.
 *
 * Counted rather than timed, so the same seed gives the same game on a loaded
 * machine as on an idle one. Timed, it does not: the search deepens
 * iteratively, so a busy laptop buys it fewer plies, it plays a different move,
 * and a series that reads 8-0 alone reads 7-1 with the rest of the suite
 * running beside it. That is not a flaky test, it is a test of the laptop.
 *
 * Far less than it gets in a real game, which is the point of asserting with
 * it: a claim that holds when the strongest grade is given a fraction of what
 * it normally spends holds when it is given all of it.
 */
const TEST_BUDGET = { nodes: 600, millis: 60_000 };

/** Plays a whole game between two tiers and returns where it ended. */
function playOut(
  variant: RuleVariant,
  black: BotTier,
  white: BotTier,
  seed: number,
  extra: Partial<GameSettings> = {},
): GameState {
  const random = seededRandom(seed);
  const size = boardSizesFor(variant)[0];
  let state = createGame({ variant, size, ...extra }, random());
  let guard = 0;
  const cap = size * size * 4 + 200;

  while (state.status === GAME_STATUS.playing && guard < cap) {
    const tier = state.toPlay === STONES.black ? black : white;
    const turn = chooseTurn(state, tier, random, TEST_BUDGET);
    if (turn === null) break;
    const next = applyTurn(state, turn);
    // A turn the engine refuses would leave the state untouched and loop forever.
    expect(next, `${variant}: the engine refused a turn the chooser offered`).not.toBe(state);
    state = next;
    guard += 1;
  }
  return state;
}

describe("the graded players", () => {
  it("names every grade, weakest first, each with its own words", () => {
    expect(BOT_TIER_LIST).toEqual([
      BOT_TIERS.razryad,
      BOT_TIERS.kyu,
      BOT_TIERS.dan,
      BOT_TIERS.meijin,
      BOT_TIERS.guoshou,
    ]);
    for (const tier of BOT_TIER_LIST) {
      const profile = BOT_PROFILES[tier];
      expect(profile.name.length).toBeGreaterThan(1);
      // Every grade is a rank in some language, so every grade has a script.
      expect(profile.native?.length ?? 0).toBeGreaterThan(0);
      expect(profile.strength.length).toBeGreaterThan(0);
      expect(profile.blurb.length).toBeGreaterThan(40);
    }
    // A name and a native form each, with no accidental duplicates.
    const many = BOT_TIER_LIST.length;
    expect(new Set(BOT_TIER_LIST.map((tier) => BOT_PROFILES[tier].name)).size).toBe(many);
    expect(new Set(BOT_TIER_LIST.map((tier) => BOT_PROFILES[tier].native)).size).toBe(many);
  });

  it("names the specialists as players rather than as rungs", () => {
    /*
     * The two are not on the ladder and must not be: neither is stronger than
     * 国手 at the other thirty-odd games, and neither is stronger or weaker
     * than the other at anything, because they do not play the same game.
     */
    expect(BOT_SPECIALIST_LIST).toEqual([BOT_TIERS.tamenoki, BOT_TIERS.meritalu]);
    for (const tier of BOT_SPECIALIST_LIST) {
      expect(BOT_TIER_LIST).not.toContain(tier);
      const profile = BOT_PROFILES[tier];
      // A person's name: two words, not a one-word rank.
      expect(profile.name.split(" ").length).toBeGreaterThan(1);
      expect(profile.blurb.length).toBeGreaterThan(40);
      // What it is strongest at, rather than how strong it is in general.
      expect(profile.strength.toLowerCase()).toContain("at");
      expect(TIER_SPECS[tier].expertise.length).toBe(1);
    }
    /*
     * A native form where there is another script to put the name in, and
     * null where there is not. A field repeating the Latin name would mean
     * both "here is the other script" and "there isn't one".
     */
    expect(BOT_PROFILES.tamenoki.native).toBe("為乃木秀正");
    expect(BOT_PROFILES.meritalu.native).toBeNull();
    expect(BOT_ALL_TIERS).toEqual([...BOT_TIER_LIST, ...BOT_SPECIALIST_LIST]);
    const names = BOT_ALL_TIERS.map((tier) => BOT_PROFILES[tier].name);
    expect(new Set(names).size).toBe(BOT_ALL_TIERS.length);
  });

  it("gets stronger, grade by grade, in every knob that makes a player weak", () => {
    /*
     * Walked in pairs rather than named one by one, so the ladder can grow
     * without the test quietly checking only its first three rungs — which is
     * what a destructured [kyu, dan, meijin] would have done the moment a
     * fourth grade existed.
     *
     * Never weaker, and somewhere stronger: a grade may share a knob with the
     * one below — everything is already at its limit by the top — but it has
     * to be ahead in something, or it is the same player under a new name.
     */
    const specs = BOT_TIER_LIST.map((tier) => TIER_SPECS[tier]);
    for (let i = 1; i < specs.length; i += 1) {
      const under = specs[i - 1];
      const over = specs[i];
      expect(over.blunder, `${BOT_TIER_LIST[i]} blunders no more`).toBeLessThanOrEqual(under.blunder);
      expect(over.guard, `${BOT_TIER_LIST[i]} guards no less`).toBeGreaterThanOrEqual(under.guard);
      expect(over.noise, `${BOT_TIER_LIST[i]} is no noisier`).toBeLessThanOrEqual(under.noise);
      expect(over.searchDepth, `${BOT_TIER_LIST[i]} sees no less far`).toBeGreaterThanOrEqual(under.searchDepth);
      expect(over.width, `${BOT_TIER_LIST[i]} weighs no fewer`).toBeGreaterThanOrEqual(under.width);
      const better =
        over.blunder < under.blunder ||
        over.guard > under.guard ||
        over.noise < under.noise ||
        over.searchDepth > under.searchDepth ||
        over.width > under.width;
      expect(better, `${BOT_TIER_LIST[i]} is stronger than ${BOT_TIER_LIST[i - 1]} somewhere`).toBe(true);
    }
    const top = specs[specs.length - 1];
    expect(top.blunder).toBe(0);
    expect(top.guard).toBe(1);
  });
});

describe("every turn it offers is a turn the rules allow", () => {
  it.each([...RULE_VARIANT_LIST])("%s", (variant) => {
    const random = seededRandom(7);
    const size = boardSizesFor(variant)[0];
    let state = createGame({ variant, size }, random());

    // Ten turns in, then check every single option the chooser would weigh.
    for (let step = 0; step < 10 && state.status === GAME_STATUS.playing; step += 1) {
      const turn = chooseTurn(state, BOT_TIERS.dan, random, TEST_BUDGET);
      if (turn === null) break;
      state = applyTurn(state, turn);
    }
    if (state.status !== GAME_STATUS.playing) return;

    const turns = legalTurns(state);
    expect(turns.length).toBeGreaterThan(0);
    for (const turn of turns) {
      expect(applyTurn(state, turn), `${variant}: offered a turn the engine refuses`).not.toBe(state);
    }
  });
});

describe("it can finish a game of anything on the site", () => {
  /*
   * Go's board is 19×19, four times the points of the 9×9 and 10×10 boards
   * every other variant here is checked on, so it gets more room than the
   * default 5s. Scoring Go by area, rather than by a line reading that meant
   * nothing there, and preferring a pass over a move that gains nothing, took
   * the seed this suite plays from about 68 seconds to about five. It varies
   * a lot by seed — some games still run to half a minute — because playing
   * Go *well* is a separate matter from knowing when to stop, so the margin
   * here is generous on purpose.
   */
  it.each([...RULE_VARIANT_LIST])(
    "%s",
    (variant) => {
      const state = playOut(variant, BOT_TIERS.dan, BOT_TIERS.kyu, 1234);
      /*
       * Not every game here must *end* — the race games can be called off by the
       * guard, as the simulator's own slide cap acknowledges — but the position
       * must always be one the engine and the chooser agree about: either it is
       * settled, or there was still a turn to take when we stopped counting.
       */
      if (state.status === GAME_STATUS.playing) {
        expect(legalTurns(state).length, `${variant}: stopped with nothing to play`).toBeGreaterThan(0);
      } else {
        expect([GAME_STATUS.won, GAME_STATUS.draw]).toContain(state.status);
      }
    },
    30_000,
  );
});

describe("what every grade sees", () => {
  it("takes five in a row when it is there to be taken", () => {
    // Black four in a row on row 4; white idling in the four corners, where it
    // has no line of its own and nothing to answer.
    const idle = [
      { row: 0, col: 0 },
      { row: 0, col: 8 },
      { row: 8, col: 0 },
      { row: 8, col: 8 },
    ];
    for (const tier of BOT_TIER_LIST) {
      let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
      [2, 3, 4, 5].forEach((col, index) => {
        state = playMove(state, { row: 4, col });
        state = playMove(state, idle[index]);
      });
      const turn = chooseTurn(state, tier, seededRandom(3), TEST_BUDGET);
      expect(turn?.kind).toBe("place");
      const after = applyTurn(state, turn!);
      expect(after.status, `${tier} did not finish the line`).toBe(GAME_STATUS.won);
      expect(after.winner).toBe(STONES.black);
    }
  });

  it("stops four in a row where stopping it is still possible", () => {
    /*
     * Deliberately *not* an open four. An open four cannot be stopped by one
     * stone — both ends win — so a player who answers it has not shown
     * anything, and a player who plays elsewhere has not blundered. The
     * position that tells you something is a four with one end already shut:
     * there is exactly one saving point, and a grade either finds it or does
     * not.
     */
    for (const tier of [BOT_TIERS.dan, BOT_TIERS.meijin] as const) {
      let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
      state = playMove(state, { row: 4, col: 2 });
      state = playMove(state, { row: 4, col: 1 });
      state = playMove(state, { row: 4, col: 3 });
      state = playMove(state, { row: 8, col: 0 });
      state = playMove(state, { row: 4, col: 4 });
      state = playMove(state, { row: 8, col: 8 });
      state = playMove(state, { row: 4, col: 5 });
      expect(state.toPlay).toBe(STONES.white);

      const turn = chooseTurn(state, tier, seededRandom(11), TEST_BUDGET);
      expect(turn?.kind).toBe("place");
      const played = turn as { row: number; col: number };
      expect(
        `${played.row},${played.col}`,
        `${tier} let black finish the line`,
      ).toBe("4,6");
    }
  });

  it("knows a giveaway game is giveaway, and will not complete the line", () => {
    // The same four in a row, in the game where making five loses.
    let state = createGame({ variant: RULE_VARIANTS.misereFive, size: 9 }, 0);
    for (const col of [2, 3, 4, 5]) {
      state = playMove(state, { row: 4, col });
      state = playMove(state, { row: 0, col });
    }
    for (const tier of BOT_TIER_LIST) {
      const turn = chooseTurn(state, tier, seededRandom(5), TEST_BUDGET);
      const after = applyTurn(state, turn!);
      expect(
        after.winner,
        `${tier} completed a losing line in a giveaway game`,
      ).not.toBe(STONES.white);
    }
  });

  it("looks ahead, and only where looking ahead says something true", () => {
    /*
     * The strongest grade's actual difference, tested directly rather than by
     * sampling games.
     *
     * Whether Meijin *wins more* than Dan is a question about a series, and a
     * series on a board big enough for the answer to mean anything takes
     * minutes — too slow to keep here. Measured separately, over twelve games
     * on a fifteen by fifteen board with the colours swapped, the search wins
     * ten and loses two against the identical player with the search turned
     * off. What is asserted here is the mechanism that produces that: it finds
     * the move, and it declines to look where looking is meaningless.
     */
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    const idle = [
      { row: 0, col: 0 },
      { row: 0, col: 8 },
      { row: 8, col: 0 },
    ];
    // Black three in a row in the open; either extension makes a four nobody can stop.
    [3, 4, 5].forEach((col, index) => {
      state = playMove(state, { row: 4, col });
      state = playMove(state, idle[index]);
    });

    const found = searchTurn(state, 6, seededRandom(2), TEST_BUDGET);
    expect(found?.kind).toBe("place");
    const played = found as { row: number; col: number };
    expect(`${played.row},${played.col}`).toMatch(/^4,(2|6)$/);

    // A flipping board has no line to read ahead, so the search declines it.
    const reversi = createGame({ variant: RULE_VARIANTS.reversi, size: 8 }, 0);
    expect(searchTurn(reversi, 6, seededRandom(2), TEST_BUDGET)).toBeNull();
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(true);
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.reversi])).toBe(false);
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.halma])).toBe(false);
    // Making the line loses here, so the ladder the ordering leans on is wrong.
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
  });

  it("reads lines only where the reading says something true", () => {
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(true);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.renju])).toBe(true);
    // Making the line loses, so the ladder is exactly backwards.
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.notakto])).toBe(false);
    // A shorter run loses, and a square wins: neither is a thing the ladder counts.
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.trapThree])).toBe(false);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.squareFour])).toBe(false);
    // Nothing on a flipping or racing board is a line at all.
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.reversi])).toBe(false);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.halma])).toBe(false);
  });
});

/**
 * The claim the whole feature rests on: the grades are in the order they are
 * offered in. Played over a series with the colours swapped each game, so a
 * result cannot be an artefact of who opened.
 */
describe("the grades beat the grades below them", () => {
  /**
   * A series with the colours swapped every game, so a result cannot be an
   * artefact of who opened — which on these boards is most of the advantage.
   */
  const series = (
    variant: RuleVariant,
    strong: BotTier,
    weak: BotTier,
    games: number,
    size?: number,
  ) => {
    let won = 0;
    let lost = 0;
    for (let game = 0; game < games; game += 1) {
      const strongIsBlack = game % 2 === 0;
      const state = playOut(
        variant,
        strongIsBlack ? strong : weak,
        strongIsBlack ? weak : strong,
        1000 + game,
        size === undefined ? {} : { size },
      );
      const strongStone = strongIsBlack ? STONES.black : STONES.white;
      if (state.winner === strongStone) won += 1;
      else if (state.winner !== null) lost += 1;
    }
    return { score: (won + (games - won - lost) / 2) / games, won, lost, games };
  };

  it("Meijin beats Kyu at Gomoku", () => {
    expect(series(RULE_VARIANTS.freestyle, BOT_TIERS.meijin, BOT_TIERS.kyu, 8).score).toBeGreaterThanOrEqual(0.875);
  });

  it("Dan beats Kyu at Gomoku", () => {
    expect(series(RULE_VARIANTS.freestyle, BOT_TIERS.dan, BOT_TIERS.kyu, 8).score).toBeGreaterThan(0.5);
  });

  it("Meijin beats Kyu at Connect Four", () => {
    expect(series(RULE_VARIANTS.dropFour, BOT_TIERS.meijin, BOT_TIERS.kyu, 8).score).toBeGreaterThan(0.5);
  });

  it("Meijin beats Kyu at Reversi", () => {
    expect(series(RULE_VARIANTS.reversi, BOT_TIERS.meijin, BOT_TIERS.kyu, 6).score).toBeGreaterThan(0.5);
  });
});

/**
 * The computer player knows when to stop in Go.
 *
 * It did not. Go fell through to the capture count and its placements were
 * scored by the line reading, so the bot was being rewarded for building rows
 * of five on a Go board — and since filling your own ground costs nothing
 * under area scoring, nothing ever told it to stop. It played on until the
 * board was full.
 */
describe("the computer player in Go", () => {
  it("passes when there is nothing left worth playing", () => {
    /*
     * A 9×9 board that is entirely Black's: every point is a black stone or
     * an empty point only black stones touch. Playing anywhere gains Black
     * nothing at all, so the only sensible turn is the pass that ends it.
     */
    const state = fromDiagram(
      [
        ". x . . . . . . .",
        "x x x x x x x x x",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
        ". . . . . . . . .",
      ].join("\n"),
      { toPlay: STONES.black, settings: { variant: "go", size: 9 } },
    );
    const turn = chooseTurn(state, BOT_TIERS.dan, () => 0.5);
    expect(turn?.kind, "the bot should pass rather than fill its own ground").toBe(
      MOVE_KINDS.pass,
    );
  });

  it("still plays a stone when a stone is worth playing", () => {
    // An empty board: every stone takes a point of area, so passing is wrong.
    const state = createGame({ variant: "go", size: 9 });
    const turn = chooseTurn(state, BOT_TIERS.dan, () => 0.5);
    expect(turn?.kind, "the bot should not pass an empty board away").toBe(MOVE_KINDS.place);
  });

  it("finishes a game of Go rather than filling the board", () => {
    const state = playOut("go", BOT_TIERS.dan, BOT_TIERS.kyu, 4321);
    // Two passes end a game of Go; it must actually reach an end.
    expect(state.status).not.toBe(GAME_STATUS.playing);
    /*
     * And it must end because both sides chose to stop, not because there was
     * nowhere left to put a stone. That is the whole of what this fix claims:
     * the bot still plays a long game on a big board, and playing Go *well* —
     * knowing a hopeless invasion from a live one — is a separate matter and
     * not attempted here. What it no longer does is play on to the last point
     * because nothing could tell it the game was over.
     */
    const points = state.settings.size * state.settings.size;
    const stones = state.board.filter((cell) => cell !== null).length;
    expect(stones, `played ${stones} of ${points} points`).toBeLessThan(points);
  }, 60_000);
});
