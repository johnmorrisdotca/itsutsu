import { speaker, type CountKey, type Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE, type PhraseKey } from "@/lib/i18n/i18n.constants";
import { checkSentence } from "@/lib/puzzles/checkWords";
import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";

/**
 * THE WORDS A PENCIL PUZZLE'S SOLVE SCREEN SAYS, per kind: what to do, what a
 * check counts, and what a step wrote. One table so every puzzle says the same
 * thing in the same place, and so a reader hears "bulb" where it is a bulb and
 * "rectangle" where it is a rectangle (`docs/plans/plain-english/GLOSSARY.md`).
 * `edgeWords` is Loop's, which is drawn on its edges.
 */
export const PENCIL_COPY: Record<PencilKind, { howTo: string; corner?: string; thing: [string, string]; placed: string; step: string; erased: string }> = {
  shikaku: {
    howTo: "Tap one corner of a rectangle, then the opposite corner.",
    corner: "Now tap the opposite corner.",
    thing: ["rectangle", "rectangles"],
    placed: "drawn",
    step: "a rectangle",
    erased: "cleared",
  },
  akari: { howTo: "Tap a white square to put a bulb in it.", thing: ["bulb", "bulbs"], placed: "placed", step: "a bulb", erased: "cleared" },
  loop: { howTo: "Tap a line between two dots to draw it.", thing: ["line", "lines"], placed: "drawn", step: "a line", erased: "cleared" },
  hitori: { howTo: "Tap a square to shade it.", thing: ["square", "squares"], placed: "shaded", step: "shaded", erased: "cleared" },
  regions: { howTo: "Tap a cell, then a number.", thing: ["cell", "cells"], placed: "filled", step: "", erased: "cleared" },
  crossSums: { howTo: "Tap a white cell, then a digit.", thing: ["cell", "cells"], placed: "filled", step: "", erased: "cleared" },
};

/** What a Check says: how many of the marks are wrong and how many are still to make, never which. */
export function pencilChecked(kind: PencilKind, checked: { wrong: number; missing: number }, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  const left = checked.missing > 0 ? say.say(LEFT_PHRASE[kind], { count: String(checked.missing) }) : null;
  return checkSentence(say, "pgrid.check.okPlace", checked.wrong, WRONG_PHRASE[kind], left);
}

const WRONG_PHRASE = {
  shikaku: "pgrid.check.wrongRectangle",
  akari: "pgrid.check.wrongBulb",
  loop: "pgrid.check.wrongLine",
  hitori: "pgrid.check.wrongSquare",
  regions: "pgrid.check.wrongCell",
  crossSums: "pgrid.check.wrongCell",
} as const satisfies Record<PencilKind, CountKey>;

const LEFT_PHRASE = {
  shikaku: "pgrid.check.leftDraw",
  akari: "pgrid.check.leftPlace",
  loop: "pgrid.check.leftDraw",
  hitori: "pgrid.check.leftShade",
  regions: "pgrid.check.leftFill",
  crossSums: "pgrid.check.leftFill",
} as const satisfies Record<PencilKind, PhraseKey>;

/** What a step wrote at one mark place, for the list of steps. */
export function pencilStepWord(kind: PencilKind, value: string | number, say: Speaker = speaker(DEFAULT_LOCALE), words: typeof PENCIL_COPY = PENCIL_COPY): string {
  if (value === "." || value === 0) return say.say("pgrid.step.cleared");
  return words[kind].step === "" ? String(value) : words[kind].step;
}

/** A Loop (Slitherlink) edge said in words, for the list of steps: which line of the grid, and where along it. */
export function edgeWords(size: number, edge: number, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  const horizontal = size * (size + 1);
  if (edge < horizontal) return say.say("pgrid.step.hLine", { row: String(Math.floor(edge / size) + 1), column: String((edge % size) + 1) });
  const at = edge - horizontal;
  return say.say("pgrid.step.vLine", { row: String(Math.floor(at / (size + 1)) + 1), column: String((at % (size + 1)) + 1) });
}
