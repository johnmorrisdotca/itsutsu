import { isWayUp, WAY_UP_STORAGE, type MeikyuuWayUp } from "@/lib/puzzles/meikyuu/turn";

import { deviceChoice } from "./meikyuuDeviceChoice";

/**
 * WHICH WAY UP A TALL MAZE IS SHOWN, as this device chooses it (`meikyuu/turn.ts`): Auto, Upright or Lying down.
 * One store, read by everything that draws a tall maze and written by the one chooser (`MeikyuuWayUp`), so a choice made
 * on the set-up is on the play screen and a finished level at once. Kept on this device only (`meikyuuDeviceChoice.ts`):
 * which way up suits is a fact about a screen.
 */
const wayUp = deviceChoice<MeikyuuWayUp>(WAY_UP_STORAGE, "auto", (word) => (isWayUp(word) ? word : null));

export const chooseWayUp = wayUp.choose;

/** The choice now, and the way to change it. */
export function useWayUp(): { wayUp: MeikyuuWayUp; choose: (next: MeikyuuWayUp) => void } {
  return { wayUp: wayUp.use(), choose: wayUp.choose };
}
