import { OUTLOOKS } from "./analysis.constants";
import { assess, shapeScore } from "./analysis";
import { otherStone } from "./engine";
import { GAME_STATUS, STONES } from "./gomoku.constants";
import { candidatePoints } from "./threats";
import type { Assessment, ThreatReport, WinChance } from "./analysis.types";
import type { GameState, Stone } from "./gomoku.types";

/**
 * Weights for the win estimate. A five is decisive, an open four unanswerable,
 * and everything below them is worth progressively less — roughly the order a
 * player would rank the same threats by eye.
 */
const THREAT_WEIGHT = {
  five: 1000,
  openFour: 500,
  doubleThreat: 260,
  four: 45,
  openThree: 85,
} as const;

/** How sharply a score difference turns into a percentage. */
const CHANCE_STEEPNESS = 0.006;

/** Being on move is worth something when neither side has a forcing threat. */
const TEMPO_BONUS = 30;

function threatScore(report: ThreatReport): number {
  return (
    report.five.length * THREAT_WEIGHT.five +
    report.openFour.length * THREAT_WEIGHT.openFour +
    report.doubleThreat.length * THREAT_WEIGHT.doubleThreat +
    report.four.length * THREAT_WEIGHT.four +
    report.openThree.length * THREAT_WEIGHT.openThree
  );
}

/**
 * A rough chance of winning for each colour.
 *
 * Decided positions report 100/0, because the assessment has already
 * established the win cannot be prevented. Everything else is a logistic
 * squash of the difference in threats and shape — an estimate offered to a
 * player as a feel for the position, and never consulted by the rules.
 */
export function winChance(
  state: GameState,
  assessment: Assessment = assess(state),
): WinChance {
  if (state.status === GAME_STATUS.draw) return { black: 50, white: 50 };

  for (const stone of [STONES.black, STONES.white] as const) {
    if (assessment.outlook[stone] === OUTLOOKS.won) {
      return chanceFor(stone, 100);
    }
    if (assessment.outlook[stone] === OUTLOOKS.winning && assessment.decided) {
      return chanceFor(stone, 97);
    }
    if (assessment.outlook[stone] === OUTLOOKS.lost) {
      return chanceFor(stone, 3);
    }
  }

  const mover = state.toPlay;
  const foe = otherStone(mover);
  const candidates = candidatePoints(state);

  const shapeFor = (stone: Stone) =>
    candidates.reduce(
      (total, point) => total + shapeScore(state.board, state.settings, stone, point),
      0,
    ) / Math.max(1, candidates.length);

  const difference =
    threatScore(assessment.threats[mover]) -
    threatScore(assessment.threats[foe]) +
    (shapeFor(mover) - shapeFor(foe)) +
    TEMPO_BONUS;

  const moverChance = 100 / (1 + Math.exp(-CHANCE_STEEPNESS * difference));
  return chanceFor(mover, Math.round(moverChance));
}

function chanceFor(stone: Stone, percent: number): WinChance {
  const clamped = Math.max(0, Math.min(100, percent));
  return stone === STONES.black
    ? { black: clamped, white: 100 - clamped }
    : { black: 100 - clamped, white: clamped };
}
