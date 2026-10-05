import { jumpsFit } from "./way";

/** Whether a kept run could be one this puzzle wrote: its alphabet and its length. Replayed on its board when it is opened (`replayJumps`). */
export function tobiishiCodeFits(code: string): boolean {
  return jumpsFit(code);
}
