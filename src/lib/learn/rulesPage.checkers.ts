import { CAPTURE_CHOICES, CROWN_MID_CAPTURE, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { CheckersRules, EndgameCount, PieceTally, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { NO_PROGRESS_RULES, PROGRESS_MEASURES } from "@/lib/gomoku/rules/noProgress";

/**
 * The rules page's sentences for a game of the checkers family, written from
 * its `CheckersRules` rather than from its name — so International Draughts
 * and Canadian Checkers, which differ only in their board, cannot be described
 * differently, and English checkers reads exactly as it did before the family
 * had other games in it.
 */

const SMALL = [
  "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** A count under two hundred in words, as a sentence on this page uses one: "sixty-four", "hundred and forty-four". */
export function inWords(count: number): string {
  if (count >= 100) return count === 100 ? "hundred" : `hundred and ${inWords(count - 100)}`;
  if (count < 20) return SMALL[count];
  const unit = count % 10;
  return unit === 0 ? TENS[Math.floor(count / 10)] : `${TENS[Math.floor(count / 10)]}-${SMALL[unit]}`;
}

function rulesOf(variant: RuleVariant): CheckersRules {
  const rules = VARIANT_SPECS[variant].checkersRules;
  if (rules === null) throw new Error(`${variant} is not a game of the checkers family`);
  return rules;
}

/** What the board holds at the start. */
export function checkersBoardLine(variant: RuleVariant, size: number): string {
  const rules = rulesOf(variant);
  const men = (rules.menRows * size) / 2;
  return `Played on the dark squares only, ${inWords((size * size) / 2)} of the ${inWords(size * size)}. Each side starts with ${inWords(men)} men filling its own ${inWords(rules.menRows)} rows.`;
}

/** How a turn goes: stepping, capturing, carrying a capture on, crowning, and how the game ends. */
export function checkersPlayLines(variant: RuleVariant): string[] {
  const rules = rulesOf(variant);
  const lines = ["A turn moves one piece: a man steps one square diagonally forward, onto an empty square."];

  if (!rules.menCaptureBackward && rules.captureChoice === CAPTURE_CHOICES.free) {
    lines.push("Capturing is a jump over an adjacent enemy piece into the empty square beyond, and it is forced: if any of your pieces can capture, you must play a capture rather than a step, though you may choose which one.");
  } else {
    lines.push(
      rules.menCaptureBackward
        ? "A man captures by jumping an adjacent enemy piece into the empty square beyond it, forward or backward."
        : "A man captures by jumping an adjacent enemy piece into the empty square beyond it, forward only.",
    );
    lines.push(
      rules.captureChoice === CAPTURE_CHOICES.maximum
        ? "Capturing is forced, and so is taking the most you can: of every capture on the board, only one taking the greatest number of pieces may be played. A king counts as one piece, the same as a man; among captures taking equally many, you choose."
        : "Capturing is forced: if any of your pieces can capture, you must play a capture rather than a step, though you may choose which one — the longer or the shorter.",
    );
  }

  if (rules.crownMidCapture === CROWN_MID_CAPTURE.stops) {
    lines.push("A piece that captures and can capture again from where it lands keeps jumping in the same move. A man crowned partway through always stops there — only a king may carry a chain on, and only on a later move.");
  } else {
    lines.push(
      rules.crownMidCapture === CROWN_MID_CAPTURE.passes
        ? "A piece that captures and can capture again keeps going in the same move, turning corners as it must. A man that crosses the far row partway through is not crowned: it carries on as a man, and is crowned only if the capture ends there."
        : "A piece that captures and can capture again keeps going in the same move, turning corners as it must. A man that reaches the far row partway through is crowned at once, and carries on capturing as a king.",
    );
  }
  if (rules.flyingKings || rules.menCaptureBackward) {
    lines.push("The pieces a capture takes come off the board only when it is over. Until then each still stands in the way: none may be jumped a second time, and nothing may pass through one.");
  }

  lines.push(
    rules.flyingKings
      ? "A man whose move ends on the far row is crowned a king. A king flies: it moves any distance along an open diagonal, either way, and captures a piece at any distance, landing on any empty square beyond it — one from which it can capture again, where there is one."
      : "A man reaching the far row is crowned a king, and may then step and capture backward as well as forward.",
  );
  lines.push("The game ends the moment a colour has no piece that can move: none left, or every one shut in.");
  return lines;
}

/** A side's pieces in words: "two kings and a man", "a lone king". */
function tallyWords(tally: PieceTally): string {
  const part = (count: number, one: string, many: string) =>
    count === 0 ? null : count === 1 ? `a ${one}` : `${inWords(count)} ${many}`;
  return [part(tally.kings, "king", "kings"), part(tally.men, "man", "men")].filter((word) => word !== null).join(" and ");
}

/** The endings a count covers, in one clause. */
function endingsWords(count: EndgameCount): string {
  const list = (items: string[]) =>
    items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
  const against = count.endings[0][1];
  const sameOpponent = count.endings.every(([, other]) => other.kings === against.kings && other.men === against.men);
  if (sameOpponent) return `${list(count.endings.map(([one]) => tallyWords(one)))} against ${tallyWords(against)}`;
  return list(count.endings.map(([one, other]) => `${tallyWords(one)} against ${tallyWords(other)}`));
}

/** The ways the game can be drawn, as this site applies them. */
export function checkersDrawLines(variant: RuleVariant): string[] {
  const rules = rulesOf(variant);
  const lines: string[] = [];
  const idle = NO_PROGRESS_RULES[variant];
  if (idle !== undefined && idle.measure === PROGRESS_MEASURES.taking) {
    lines.push(`It is a draw once ${inWords(idle.plies / 2)} moves each have gone by in which only kings have moved and nothing has been taken.`);
  }
  if (rules.repetitionDraw !== null) {
    lines.push("It is a draw when the same position comes round for the third time with the same side to move.");
  }
  for (const count of rules.endgameCounts) {
    lines.push(`It is a draw when ${endingsWords(count)} is not won within ${inWords(count.movesEach)} more moves each of that ending arising.`);
  }
  return lines;
}
