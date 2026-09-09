import { assess } from "./analysis";
import { OUTLOOKS } from "./analysis.constants";
import { ADVANTAGE_MEASURES, UNREADABLE_REASONS } from "./advantage.constants";
import { STONES, VARIANT_SPECS } from "./gomoku.constants";
import { piecesHome } from "./rules/camps";
import { STAR_RADIUS, starPiecesHome } from "./rules/chineseCheckers";
import type { Advantage, AdvantageMeasure, Lead, UnreadableReason } from "./advantage.types";
import type { Assessment, Outlook } from "./analysis.types";
import type { GameState, Stone, VariantSpec } from "./gomoku.types";

/**
 * Worst to best. Only the order matters — the gaps carry no meaning, and
 * nothing here is ever subtracted, because the distance between "even" and
 * "you have the initiative" is not a quantity anybody could defend.
 */
const OUTLOOK_ORDER: readonly Outlook[] = [
  OUTLOOKS.lost,
  OUTLOOKS.critical,
  OUTLOOKS.danger,
  OUTLOOKS.even,
  OUTLOOKS.ahead,
  OUTLOOKS.winning,
  OUTLOOKS.won,
];

/**
 * Which counted quantity, if any, this game can be weighed by.
 *
 * Read from the spec's mechanics rather than the variant's name, the same way
 * the engine reads it: a flipping game counts discs whether it is Reversi,
 * Grand Reversi or one somebody adds next month.
 */
function measureFor(spec: VariantSpec): AdvantageMeasure | null {
  if (spec.flips) return ADVANTAGE_MEASURES.discs;
  if (spec.camps || spec.chineseCheckers) return ADVANTAGE_MEASURES.home;
  if (spec.checkers) return ADVANTAGE_MEASURES.material;
  return null;
}

/**
 * Why a game with no countable quantity cannot be read either.
 *
 * Ordered by which property defeats the reading most completely: a board that
 * turns invalidates everything, so it is asked first, and maker-breaker is
 * asked before `anyColour` because it has both flags and the asymmetry is the
 * more interesting half.
 */
function reasonFor(spec: VariantSpec): UnreadableReason {
  if (spec.quadrantSize !== null) return UNREADABLE_REASONS.turning;
  if (spec.queue !== null) return UNREADABLE_REASONS.queued;
  if (spec.connects) return UNREADABLE_REASONS.connection;
  if (spec.squareWins) return UNREADABLE_REASONS.square;
  if (spec.makerBreaker) return UNREADABLE_REASONS.asymmetric;
  return UNREADABLE_REASONS.shared;
}

/**
 * Which of the three readings this game gets, from its rules alone.
 *
 * Separated from `readAdvantage` because the settings panel has to answer the
 * same question with no game in front of it: whether to offer the control at
 * all, and what to say when it cannot. Asking it in one place is what keeps
 * the toggle's reason and the panel's sentence from drifting apart.
 */
export function advantageReadingFor(
  spec: VariantSpec,
):
  | { kind: "threats" }
  | { kind: "count"; measure: AdvantageMeasure }
  | { kind: "unreadable"; reason: UnreadableReason } {
  if (spec.analysis) return { kind: "threats" };
  const measure = measureFor(spec);
  return measure === null
    ? { kind: "unreadable", reason: reasonFor(spec) }
    : { kind: "count", measure };
}

/** Pieces or discs of one colour standing on the board. */
function stonesOn(state: GameState, stone: Stone): number {
  return state.board.reduce((total, cell) => (cell === stone ? total + 1 : total), 0);
}

function countFor(
  state: GameState,
  measure: AdvantageMeasure,
  stone: Stone,
): number {
  const { size, variant } = state.settings;
  if (measure === ADVANTAGE_MEASURES.home) {
    return VARIANT_SPECS[variant].chineseCheckers
      ? starPiecesHome(state.board, size, STAR_RADIUS, stone)
      : piecesHome(state.board, size, stone);
  }
  return stonesOn(state, stone);
}

/**
 * Who a pair of numbers favours.
 *
 * `fewer` inverts it for the misère games, where finishing with the smaller
 * pile is the object. Equal counts are a genuine level, not a rounding of one.
 */
function leadFromCount(black: number, white: number, fewer: boolean): Lead {
  if (black === white) return null;
  const blackAhead = fewer ? black < white : black > white;
  return blackAhead ? STONES.black : STONES.white;
}

/** Who a pair of outlooks favours, by rank alone. */
function leadFromOutlook(outlook: Record<Stone, Outlook>): Lead {
  const black = OUTLOOK_ORDER.indexOf(outlook[STONES.black]);
  const white = OUTLOOK_ORDER.indexOf(outlook[STONES.white]);
  if (black === white) return null;
  return black > white ? STONES.black : STONES.white;
}

/**
 * How this game stands, in the terms this game can honestly be put in.
 *
 * Three readings, and choosing between them is the substance of it. The
 * gomoku family is read by threats, because that is what its positions are
 * made of — and it is read in words, not in a percentage, because a
 * percentage would be a claim about a search this site does not run, and
 * would read as most trustworthy exactly where it is least reliable.
 *
 * The games that turn `analysis` off are not all alike, and lumping them
 * together was the old reading's mistake: it handed every one of them an even
 * bar, which says the sides are level — a statement about the position, made
 * without looking at it. Several of them can be weighed perfectly well, just
 * by a different quantity: discs on the board, pieces home, pieces left. Those
 * are facts, so they get a number where the threat reading does not. The rest
 * say plainly that they cannot be read this way, and why.
 *
 * Advisory throughout: it reads the position and never decides anything about
 * it, so it sits above the engine like the rest of `analysis`.
 */
export function readAdvantage(
  state: GameState,
  assessment: Assessment = assess(state),
): Advantage {
  const spec = VARIANT_SPECS[state.settings.variant];
  const reading = advantageReadingFor(spec);

  if (reading.kind === "threats") {
    return {
      kind: "threats",
      outlook: assessment.outlook,
      decided: assessment.decided,
      lead: leadFromOutlook(assessment.outlook),
    };
  }
  if (reading.kind === "unreadable") return reading;

  const { measure } = reading;
  const black = countFor(state, measure, STONES.black);
  const white = countFor(state, measure, STONES.white);
  // Only a count of discs is ever inverted; you cannot win a race by getting
  // fewer pieces home, whatever `misere` means elsewhere.
  const fewer = spec.misere && measure === ADVANTAGE_MEASURES.discs;
  return { kind: "count", measure, black, white, fewer, lead: leadFromCount(black, white, fewer) };
}
