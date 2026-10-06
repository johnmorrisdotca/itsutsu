import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { commaOf, stopOf } from "@/lib/puzzles/puzzleText";

/**
 * THE WORDS A JIRAI SOLVE SCREEN SAYS (`JiraiSolve`), in one table as the pencil puzzles' are
 * (`pencil/pencil.constants.ts`): what to do, how many mines are left, what a mine uncovered cost, what a Check counts.
 */
export const JIRAI_COPY = {
  howTo: "Tap a square to uncover it. Press and hold, or turn on Flag, to flag a mine.",
  flagging: "Flag is on: tap a square to flag it, and again to take the flag off.",
  label: (size: number) => `Jirai board, ${size} by ${size}. Tap a square to uncover it; press and hold, or right-click, to flag it.`,
  minesLeft: (left: number, mistakes: number) => `${left} ${left === 1 ? "mine" : "mines"} left${mistakes > 0 ? ` · ${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}` : ""}`,
  boom: (hit: number) => (hit === 1 ? "That was a mine. It is flagged where it lies, and counted as a mistake." : `${hit} mines. They are flagged where they lie, and counted as mistakes.`),
};

/** What a Check says: how many flags are on no mine and how many safe squares are still covered, never which. */
export function jiraiChecked({ wrong, missing }: { wrong: number; missing: number }, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  if (wrong === 0 && missing === 0) return say.say("pgrid.check.okJirai");
  const bad = wrong === 0 ? say.say("pgrid.check.noFlagWrong") : say.count("pgrid.check.wrongFlag", wrong);
  return `${bad}${commaOf(say)}${say.count("pgrid.check.leftUncover", missing)}${stopOf(say)}`;
}

/** What a step did at one square, for the list of steps. */
export function jiraiStepWord(value: string, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  if (value === "f") return say.say("pgrid.step.flag");
  if (value === ".") return say.say("pgrid.step.covered");
  return value === "0" ? say.say("pgrid.step.blank") : say.say("pgrid.step.uncovered", { count: value });
}
