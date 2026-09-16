import { describe, expect, it } from "vitest";

import { chooseTurn } from "./opponent";
import { createGame } from "./engine";
import { applyTurn, legalTurns, sameTurn } from "./opponentTurns";
import { assess } from "./analysis";
import { defenceNow } from "./opponentEval";
import { BOT_CHARACTER_LIST, BOT_SPECIALIST_LIST, BOT_TIER_LIST, EVAL_WEIGHTS, TIER_SPECS } from "./opponent.constants";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import type { BotTurn, TierSpec } from "./opponent.types";
import type { GameState } from "./gomoku.types";

/*
 * STYLE IS NOT STRENGTH, AND THIS FILE EXISTS TO KEEP THEM APART.
 *
 * John, on why a roster of personalities is worth having: "in real life, you
 * can have a defensive mood, or style... and an attacking controlling style...
 * so we could have bots that are super good at defending the best defense...
 * and ones that are the most offensive best attack."
 *
 * The knob is one number — how much taking your point is worth against making
 * its own — and it costs nothing, because both halves were already being
 * computed and only the weighing changes. That is the whole reason a roster of
 * styles is affordable on this site where a roster of deeper searches is not.
 *
 * The danger is that "personality" quietly becomes "worse". A bot that attacks
 * by ignoring your four in a row is not aggressive, it is broken — and it
 * would read to a player as the site cheating in their favour.
 */

const at = (row: number, col: number): BotTurn => ({ kind: "place", row, col });

function build(state: GameState, moves: readonly BotTurn[]): GameState {
  let here = state;
  for (const move of moves) {
    const next = applyTurn(here, move);
    expect(next, `turn ${JSON.stringify(move)} was refused`).not.toBe(here);
    here = next;
  }
  return here;
}

/** The top grade, wearing a style. */
function styled(defence: number): TierSpec {
  return { ...TIER_SPECS.guoshou, defence };
}

const ATTACKER = styled(0.2);
const DEFENDER = styled(2.5);

/*
 * A grade that does NOT search, wearing a style.
 *
 * The knob lives in the base score, and the top grade's search runs after it
 * and can agree with itself whatever the base score preferred — which is
 * exactly what happened on this file's first run, and read as "the knob is
 * wired to nothing". Dan reads no ladder and looks no plies ahead, so what it
 * chooses IS what the base score preferred. The top grade's job in this file
 * is the safety tests below, where search overriding style is the point.
 */
const QUIET_ATTACKER: TierSpec = { ...TIER_SPECS.dan, defence: 0.1 };
const QUIET_DEFENDER: TierSpec = { ...TIER_SPECS.dan, defence: 3 };

/** `chooseTurn` takes a tier, so a styled spec is exercised through a stand-in tier registry. */
function chooseWith(state: GameState, spec: TierSpec, as: "guoshou" | "dan" = "guoshou"): BotTurn | null {
  const saved = TIER_SPECS[as];
  try {
    (TIER_SPECS as Record<string, TierSpec>)[as] = spec;
    return chooseTurn(state, as, () => 0.5, { nodes: 4_000, millis: 5_000 });
  } finally {
    (TIER_SPECS as Record<string, TierSpec>)[as] = saved;
  }
}

describe("a style that changes during the game", () => {
  it("holds a mood for a run of turns, then takes the next", () => {
    const spec = { moods: [0.3, 2.4] as const, moodMoves: 6 };
    // Six turns of one, six of the other, and back — a person in a mood, not
    // a coin flip. A flip every turn would be noise, which the weak grades
    // already have.
    for (const move of [0, 1, 5]) expect(defenceNow(spec, move)).toBe(0.3);
    for (const move of [6, 7, 11]) expect(defenceNow(spec, move)).toBe(2.4);
    for (const move of [12, 17]) expect(defenceNow(spec, move)).toBe(0.3);
  });

  it("answers from the position, so the same position always answers the same", () => {
    /*
     * The property that keeps a moody player checkable. Her mood is read from
     * the move number rather than a die, so a move she chose in somebody's
     * browser can be replayed on the server and reach the same answer — see
     * botSeed.ts. A style that rolled for itself would make the one character
     * nobody could ever verify.
     */
    const spec = TIER_SPECS.amaraOkafor;
    for (const move of [0, 3, 7, 14, 30]) {
      expect(defenceNow(spec, move)).toBe(defenceNow(spec, move));
    }
    expect(defenceNow(spec, 0)).not.toBe(defenceNow(spec, 6));
  });

  it("leaves a player with no mood on its fixed style", () => {
    expect(defenceNow(TIER_SPECS.rafaDuarte, 0)).toBe(TIER_SPECS.rafaDuarte.defence);
    expect(defenceNow(TIER_SPECS.rafaDuarte, 99)).toBe(TIER_SPECS.rafaDuarte.defence);
    // And a rung of the ladder has neither, so it reads as even-handed.
    expect(defenceNow(TIER_SPECS.dan, 4)).toBeUndefined();
  });
});

describe("the style knob", () => {
  it("is even-handed unless a spec asks otherwise", () => {
    /*
     * Every RUNG of the ladder leaves it off, so nothing about how the five
     * grades play changed when the knob arrived. The characters are the ones
     * that set it — that is what makes them characters — so the claim is about
     * the ladder and the specialists, not about every spec there is.
     */
    for (const tier of [...BOT_TIER_LIST, ...BOT_SPECIALIST_LIST]) {
      expect(TIER_SPECS[tier].defence, `${tier} should play even-handed`).toBeUndefined();
      expect(TIER_SPECS[tier].moods, `${tier} should have no moods`).toBeUndefined();
    }
    expect(BOT_CHARACTER_LIST.length, "a character with no style is just its grade").toBeGreaterThan(0);
    for (const tier of BOT_CHARACTER_LIST) {
      const knobs = TIER_SPECS[tier];
      const styled = knobs.defence !== undefined || knobs.moods !== undefined;
      expect(styled, `${tier} has no style, so it is just its grade`).toBe(true);
    }
    expect(EVAL_WEIGHTS.defence).toBe(0.85);
  });

  it("changes which move is chosen, in a position where attack and defence differ", () => {
    /*
     * Both sides have a three in a row going. Building and blocking are
     * different points, so a preference has somewhere to show itself.
     */
    const start = createGame({ variant: RULE_VARIANTS.freestyle, size: 9, firstPlayer: "black" });
    const state = build(start, [
      at(2, 2), at(6, 2),
      at(2, 3), at(6, 3),
      at(8, 8), at(6, 4),
    ]);
    expect(state.toPlay).toBe("black");

    const attacking = chooseWith(state, QUIET_ATTACKER, "dan");
    const defending = chooseWith(state, QUIET_DEFENDER, "dan");
    expect(attacking).not.toBeNull();
    expect(defending).not.toBeNull();
    // If these agreed, the knob would be wired to nothing — which is exactly
    // how the solved-game table failed its first run.
    expect(sameTurn(attacking!, defending!)).toBe(false);
  });

  it("never lets a style walk past a win in hand", () => {
    // Black has four in a row. No personality declines to finish a game.
    const start = createGame({ variant: RULE_VARIANTS.freestyle, size: 9, firstPlayer: "black" });
    const state = build(start, [
      at(4, 1), at(0, 0),
      at(4, 2), at(0, 1),
      at(4, 3), at(0, 2),
      at(4, 4), at(8, 8),
    ]);

    for (const spec of [ATTACKER, DEFENDER]) {
      const chosen = chooseWith(state, spec);
      expect(chosen).not.toBeNull();
      const next = applyTurn(state, chosen!);
      expect(next.status, "a styled top grade declined a win").toBe(GAME_STATUS.won);
      expect(next.winner).toBe("black");
    }
  });

  it("never lets the ATTACKER hand over a loss it could have blocked", () => {
    /*
     * The one that matters. White has a four with one live end — black must
     * block it. An aggressive bot that would rather build is the failure this
     * whole file guards against, because it reads as the site throwing the
     * game rather than as a personality.
     */
    const start = createGame({ variant: RULE_VARIANTS.freestyle, size: 9, firstPlayer: "black" });
    const state = build(start, [
      at(4, 0), at(4, 1),
      at(0, 0), at(4, 2),
      at(0, 1), at(4, 3),
      at(0, 2), at(4, 4),
    ]);
    expect(state.toPlay).toBe("black");

    // The premise: blocking holds, looking away loses.
    const ignoring = applyTurn(state, at(8, 0));
    expect(legalTurns(ignoring, 200).some((turn) => {
      const next = applyTurn(ignoring, turn);
      return next !== ignoring && next.status === GAME_STATUS.won && next.winner === "white";
    })).toBe(true);

    for (const [name, spec] of [["attacker", ATTACKER], ["defender", DEFENDER]] as const) {
      const chosen = chooseWith(state, spec);
      expect(chosen).not.toBeNull();
      const next = applyTurn(state, chosen!);
      expect(assess(next).outlook.black, `the ${name} gave the game away`).not.toBe("lost");
    }
  });
});
