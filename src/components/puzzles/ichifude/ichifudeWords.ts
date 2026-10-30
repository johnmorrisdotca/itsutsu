import { checkSentence } from "@/lib/puzzles/checkWords";
import type { Speaker } from "@/lib/i18n/i18n";

/** What Check says of the line: how many squares of it are off the answer, and how many are still to fill. */
export function ichifudeChecked(checked: { wrong: number; missing: number }, say: Speaker): string {
  const left = checked.missing > 0 ? say.say("pgrid.check.leftFill", { count: String(checked.missing) }) : null;
  return checkSentence(say, "pgrid.check.okPlace", checked.wrong, "pgrid.check.wrongSquare", left);
}

/** What a step of the line wrote on a square, for the list of steps: reached, or cleared. */
export function ichifudeStepWord(value: number | string, say: Speaker): string {
  return value === "." ? say.say("pgrid.step.cleared") : say.say("pgrid.ichifude.step");
}
