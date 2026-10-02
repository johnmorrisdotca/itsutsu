import { wayFits } from "./steps";

/** The most steps a line through any level has, with room: the longest on any of the package's levels is 2,434 (`levels.test.ts`). */
export const MEIKYUU_MOST_STEPS = 2600;

/** Whether a kept line could be one this puzzle wrote: its alphabet and its length, which is all it can be read against without its maze (`decodeWay` reads the rest when it is opened). */
export function meikyuuCodeFits(code: string): boolean {
  return wayFits(code, MEIKYUU_MOST_STEPS);
}
