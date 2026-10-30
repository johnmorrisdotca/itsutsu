import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { speaker } from "@/lib/i18n/i18n";

import type { PuzzleCheck } from "../puzzles.types";
import { adjacent, decodeNumbers } from "./code";

/** A place along the line, read from the character the line keeps it as; written out here so the check owes nothing to the code that drew the line. */
const PLACES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";

/** What the route answers with: the site's own English, as every refusal from it is. */
const refused = (reason: Parameters<ReturnType<typeof speaker>["say"]>[0]): PuzzleCheck => ({ ok: false, reason: speaker(DEFAULT_LOCALE).say(reason) });

/**
 * Whether a line solves an Hitofude board: the check the browser makes to say
 * "solved" and the server makes before it pays. O(cells), no search, and written
 * out here rather than taken from the solver: the solver made the board, and a
 * check that reads its mind proves only that it agrees with itself.
 *
 * Every cell has one place along the line and every place is taken, each cell
 * shares a side with the one before it, and the numbers come in order, starting
 * on the first place and ending on the last.
 */
export function checkHitofude(size: number, givens: string, answer: string): PuzzleCheck {
  const cells = size * size;
  const numbers = decodeNumbers(givens, size);
  if (numbers === null) return refused("pgrid.hitofude.refuse.notBoard");
  if (typeof answer !== "string" || answer.length !== cells) return refused("pgrid.hitofude.refuse.wrongSize");
  const atPlace = new Array<number>(cells).fill(-1);
  for (let cell = 0; cell < cells; cell += 1) {
    const place = PLACES.indexOf(answer[cell]!);
    if (place < 0 || place >= cells) return refused("pgrid.hitofude.refuse.offLine");
    if (atPlace[place] !== -1) return refused("pgrid.hitofude.refuse.crosses");
    atPlace[place] = cell;
  }
  let next = 1;
  for (let place = 0; place < cells; place += 1) {
    const cell = atPlace[place]!;
    if (place > 0 && !adjacent(atPlace[place - 1]!, cell, size)) return refused("pgrid.hitofude.refuse.jumps");
    const number = numbers[cell]!;
    if (number === 0) continue;
    if (number !== next) return refused("pgrid.hitofude.refuse.outOfOrder");
    next += 1;
  }
  if (numbers[atPlace[0]!] !== 1) return refused("pgrid.hitofude.refuse.wrongStart");
  if (numbers[atPlace[cells - 1]!] !== next - 1) return refused("pgrid.hitofude.refuse.wrongEnd");
  return { ok: true };
}
