import { jumpAt, legalJumps, pegCount, type Game } from "@johnmorrisdotca/tobiishi";
import { expect, type Page } from "@playwright/test";

import { tobiishiLevelCount } from "../src/lib/puzzles/tobiishi/levelCounts";
import { tobiishiChallengeOf, tobiishiRefOf } from "../src/lib/puzzles/tobiishi/levels";

/**
 * PLAYING A TOBIISHI LEVEL AS A PLAYER DOES: a tap on a peg and then on the hole it jumps to, or a drag
 * from one to the other with the mouse pressed on the peg and let go over the hole. The level is the
 * package's own, found again from its place in its length (`tobiishiChallengeOf`), and a hole is named by
 * its place in the board's list, which is also its `data-cell` on the page.
 *
 * The run is never handed to the board: this is the control a player drives (`e2e/language.spec.ts` on
 * why a test drives the control, not the mechanism).
 */
export { tobiishiLevelCount };

export type Level = { game: Game; answer: readonly { from: number; to: number }[] };

/** Level `level` of a length, as the package makes it: its starting position and its own answer. */
export function levelOf(size: number, level: number): Level {
  const ref = tobiishiRefOf(size, level);
  if (ref === null) throw new Error(`no level ${level} at ${size}`);
  const challenge = tobiishiChallengeOf(ref);
  return { game: challenge.game, answer: challenge.answer.map(({ from, to }) => ({ from, to })) };
}

/** A hole on the page. */
export const hole = (page: Page, cell: number) => page.locator(`[data-testid="tobiishi-hole"][data-cell="${cell}"]`);

/** The pegs on the board as the page counts them. */
export async function pegsLeft(page: Page): Promise<number> {
  return Number(await page.getByTestId("tobiishi-board").getAttribute("data-pegs"));
}

/** The jumps made as the page counts them. */
export async function jumpsMade(page: Page): Promise<number> {
  return Number(await page.getByTestId("tobiishi-board").getAttribute("data-jumps"));
}

/** One jump by tapping: the peg, then the hole. The page is waited on, so the next press finds the board settled. */
export async function tapJump(page: Page, from: number, to: number): Promise<void> {
  const before = await jumpsMade(page);
  await hole(page, from).click();
  await expect(hole(page, to)).toHaveAttribute("data-legal", "true");
  await hole(page, to).click();
  await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-jumps", String(before + 1));
}

/** One jump by dragging, as the mouse does it: pressed on the peg, taken across, let go over the hole. */
export async function dragJump(page: Page, from: number, to: number): Promise<void> {
  const before = await jumpsMade(page);
  const a = await hole(page, from).boundingBox();
  const b = await hole(page, to).boundingBox();
  if (a === null || b === null) throw new Error("a hole is not on the screen");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("tobiishi-board")).toHaveAttribute("data-jumps", String(before + 1));
}

/** Plays the first `count` jumps of a run by tapping (all of them when none is given). */
export async function playByTapping(page: Page, jumps: readonly { from: number; to: number }[], count = jumps.length): Promise<void> {
  for (const { from, to } of jumps.slice(0, count)) await tapJump(page, from, to);
}

/**
 * A run of legal jumps from a position to one peg left away from the goal, found by walking every order: the
 * ending a player reaches by taking pegs in the wrong order. Null when there is none.
 */
export function runToTheWrongHole(game: Game): { from: number; to: number }[] | null {
  const search = (now: Game, run: { from: number; to: number }[]): { from: number; to: number }[] | null => {
    if (pegCount(now) === 1) return now.pegs[now.target!] ? null : run;
    for (const jump of legalJumps(now)) {
      const found = search(jumpAt(now, jump.from, jump.to), [...run, { from: jump.from, to: jump.to }]);
      if (found !== null) return found;
    }
    return null;
  };
  return search(game, []);
}
