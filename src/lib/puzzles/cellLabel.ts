import type { Speaker } from "../i18n/i18n";

/**
 * What a screen reader hears for one cell of a grid: where it is, then what is in it and what else is true of it,
 * each said in the reader's language and joined the way their language joins a list of facts ("row 2, column 3,
 * empty, given" in English, "2行3列、空欄、…" in Japanese). `row` and `col` count from 0.
 */
export function cellLabel(say: Speaker, row: number, col: number, ...facts: readonly string[]): string {
  return say.joined([say.say("pgrid.cell.where", { row: String(row + 1), col: String(col + 1) }), ...facts]);
}

/** What a cell is, then what else is true of it, joined the way the reader's language joins facts: "A, in its place, chosen". */
export function cellFacts(say: Speaker, head: string, ...facts: readonly string[]): string {
  return say.joined([head, ...facts]);
}
