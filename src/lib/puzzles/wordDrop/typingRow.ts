/**
 * THE ROW BEING TYPED, before Enter: a place for each letter and the one that
 * is waiting. John, 2026-09-25: "click a letter and replace with keyboard
 * selection if they haven't submitted yet… select the letter and delete keys
 * can clear it… spacebars would clear it too… the concept of focus, so that
 * we know we're on the first letter, or on the 3rd letter".
 *
 * `at` is the place waiting for a letter, or `slots.length` once every place
 * after the last one typed is filled — past the end, where a letter typed does
 * nothing, as the published game does. Every function returns a new row.
 */
export type TypingRow = { slots: readonly string[]; at: number };

export function emptyRow(size: number): TypingRow {
  return { slots: new Array<string>(size).fill(""), at: 0 };
}

/** The first empty place after `from`, else the first empty place at all, else past the end. */
function nextEmpty(slots: readonly string[], from: number): number {
  const after = slots.findIndex((slot, index) => index > from && slot === "");
  if (after !== -1) return after;
  const any = slots.indexOf("");
  return any === -1 ? slots.length : any;
}

/** A letter into the waiting place, which then moves on to the next empty one. */
export function typeLetter(row: TypingRow, letter: string): TypingRow {
  if (row.at >= row.slots.length) return row;
  const slots = row.slots.map((slot, index) => (index === row.at ? letter : slot));
  return { slots, at: nextEmpty(slots, row.at) };
}

/** Backspace or Delete: the chosen letter cleared where it is; on an empty place, the one before it. */
export function backspace(row: TypingRow): TypingRow {
  if (row.at < row.slots.length && row.slots[row.at] !== "") return clearAt(row);
  const back = row.at - 1;
  if (back < 0) return row;
  return { slots: row.slots.map((slot, index) => (index === back ? "" : slot)), at: back };
}

/** Space: the chosen letter cleared, and the place stays chosen. */
export function clearAt(row: TypingRow): TypingRow {
  if (row.at >= row.slots.length) return row;
  return { slots: row.slots.map((slot, index) => (index === row.at ? "" : slot)), at: row.at };
}

/** A tap on a place: that place is the one waiting. */
export function choose(row: TypingRow, place: number): TypingRow {
  return place < 0 || place >= row.slots.length ? row : { ...row, at: place };
}

/** The arrows: one place along, never off the row. */
export function step(row: TypingRow, by: -1 | 1): TypingRow {
  return { ...row, at: Math.min(row.slots.length - 1, Math.max(0, Math.min(row.at, row.slots.length) + by)) };
}

/** The word typed, or null while any place is empty. */
export function wordOf(row: TypingRow): string | null {
  return row.slots.every((slot) => slot !== "") ? row.slots.join("") : null;
}

/** How many places hold a letter. */
export function lettersIn(row: TypingRow): number {
  return row.slots.filter((slot) => slot !== "").length;
}
