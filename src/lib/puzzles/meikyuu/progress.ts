import { runFits } from "./steps";

/** The most steps a line through any level has, with room: the longest on any of the package's levels is 5,009, a colossal one (`levels.test.ts`). */
export const MEIKYUU_MOST_STEPS = 5200;

/** The most characters of stones a kept run may carry after its line: up to a couple of hundred, at three characters or fewer each. */
export const MEIKYUU_MOST_STONE_CHARS = 800;

/** Whether a kept run could be one this puzzle wrote: its steps' alphabet and length, and its stones', which is all it can be read against without its maze (`mount.restore` reads the rest when it is opened). */
export function meikyuuCodeFits(code: string): boolean {
  return runFits(code, MEIKYUU_MOST_STEPS, MEIKYUU_MOST_STONE_CHARS);
}
