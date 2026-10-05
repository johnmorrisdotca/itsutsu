import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";

/**
 * THE WORDS A PENCIL PUZZLE'S SOLVE SCREEN SAYS, per kind: what to do, what a
 * check counts, and what a step wrote. One table so every puzzle says the same
 * thing in the same place, and so a reader hears "bulb" where it is a bulb and
 * "rectangle" where it is a rectangle (`docs/plans/plain-english/GLOSSARY.md`).
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
  slitherlink: { howTo: "Tap a line between two dots to draw it.", thing: ["line", "lines"], placed: "drawn", step: "a line", erased: "cleared" },
  hitori: { howTo: "Tap a square to shade it.", thing: ["square", "squares"], placed: "shaded", step: "shaded", erased: "cleared" },
  fillomino: { howTo: "Tap a cell, then a number.", thing: ["cell", "cells"], placed: "filled", step: "", erased: "cleared" },
  kakuro: { howTo: "Tap a white cell, then a digit.", thing: ["cell", "cells"], placed: "filled", step: "", erased: "cleared" },
};

/** What a Check says: how many of the marks are wrong and how many are still to make, never which. */
export function pencilChecked(kind: PencilKind, checked: { wrong: number; missing: number }): string {
  const [one, many] = PENCIL_COPY[kind].thing;
  if (checked.wrong === 0 && checked.missing === 0) return "Everything is in place.";
  const bad = checked.wrong === 0 ? "Nothing wrong so far" : `${checked.wrong} ${checked.wrong === 1 ? `${one} is` : `${many} are`} wrong`;
  const left = checked.missing > 0 ? `, ${checked.missing} still to ${kind === "kakuro" || kind === "fillomino" ? "fill" : kind === "shikaku" ? "draw" : kind === "hitori" ? "shade" : kind === "akari" ? "place" : "draw"}` : "";
  return `${bad}${left}.`;
}

/** What a step wrote at one mark place, for the list of steps. */
export function pencilStepWord(kind: PencilKind, value: string | number): string {
  if (value === "." || value === 0) return PENCIL_COPY[kind].erased;
  return PENCIL_COPY[kind].step === "" ? String(value) : PENCIL_COPY[kind].step;
}

/** A Slitherlink edge said in words, for the list of steps: which line of the grid, and where along it. */
export function edgeWords(size: number, edge: number): string {
  const horizontal = size * (size + 1);
  if (edge < horizontal) return `horizontal line ${Math.floor(edge / size) + 1}, column ${(edge % size) + 1}`;
  const at = edge - horizontal;
  return `row ${Math.floor(at / (size + 1)) + 1}, vertical line ${(at % (size + 1)) + 1}`;
}
