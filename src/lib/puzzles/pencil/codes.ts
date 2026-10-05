/**
 * What the pencil puzzles share in writing their codes: a code is one
 * character a mark place, `.` for a place with nothing on it, and these are
 * the comparisons that need nothing of a kind's rules.
 */
export const BLANK = ".";

/** The characters a mark is written with: an Akari bulb, a Loop (Slitherlink) edge and a Hitori shade, written here so the presses on them (`input.ts`) need no engine. */
export const BULB = "o";
export const EDGE = "#";
export const SHADE = "#";

/** The digits and letters a value of up to 35 is written with, one character. */
export const SYMBOLS = "0123456789abcdefghijklmnopqrstuvwxyz";

/** A value as one character, or null past what one character holds. */
export function symbolFor(value: number): string | null {
  return Number.isInteger(value) && value >= 0 && value < SYMBOLS.length ? SYMBOLS[value]! : null;
}

/** A character as the value it writes, or null when it is not one of `SYMBOLS`. */
export function valueOf(symbol: string | undefined): number | null {
  if (symbol === undefined || symbol.length !== 1) return null;
  const at = SYMBOLS.indexOf(symbol);
  return at === -1 ? null : at;
}

/** Whether a string is exactly `length` characters, each one of `allowed`. */
export function isCodeOf(code: string, length: number, allowed: string): boolean {
  if (code.length !== length) return false;
  for (const character of code) if (!allowed.includes(character)) return false;
  return true;
}

/**
 * The mark places a code marks that the answer does not have: a place with
 * something on it where the answer has something else. A place left blank is
 * never wrong, only missing.
 */
export function charWrong(code: string, solution: string): number[] {
  const found: number[] = [];
  for (let at = 0; at < code.length; at += 1) if (code[at] !== BLANK && code[at] !== solution[at]) found.push(at);
  return found;
}

/** How many places the answer has marked that the code has left blank. */
export function charMissing(code: string, solution: string): number {
  let count = 0;
  for (let at = 0; at < code.length; at += 1) if (code[at] === BLANK && solution[at] !== BLANK) count += 1;
  return count;
}

/**
 * One right mark: the first place where the answer has something the code
 * does not, set as the answer has it; or, if the code has only too much, the
 * first extra mark taken off. Null when the code is the answer.
 */
export function charFix(code: string, solution: string): { code: string; at: number } | null {
  let at = -1;
  for (let place = 0; place < code.length && at === -1; place += 1) if (solution[place] !== BLANK && code[place] !== solution[place]) at = place;
  if (at === -1) for (let place = 0; place < code.length && at === -1; place += 1) if (code[place] !== solution[place]) at = place;
  if (at === -1) return null;
  return { code: `${code.slice(0, at)}${solution[at]}${code.slice(at + 1)}`, at };
}
