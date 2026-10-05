import { isStoneLimit, STONES_STORAGE, type StoneLimit } from "@/lib/puzzles/meikyuu/stones";

import { deviceChoice } from "./meikyuuDeviceChoice";

/**
 * HOW MANY STONES MAY LIE AT ONCE (`meikyuu/stones.ts`): limited, the package's few for the maze's size, unless this device has chosen none. One store, read by the
 * play screen and written by the set-up's option, kept on this device only (`meikyuuDeviceChoice.ts`): how a hand likes to play is a fact about it.
 */
const limit = deviceChoice<StoneLimit>(STONES_STORAGE, "limited", (word) => (isStoneLimit(word) ? word : null));

/** The choice now, and the way to change it. */
export function useStoneLimit(): { stones: StoneLimit; choose: (next: StoneLimit) => void } {
  return { stones: limit.use(), choose: limit.choose };
}
