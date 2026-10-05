import { EDGE_PAN_STORAGE } from "@/lib/puzzles/meikyuu/turn";

import { deviceChoice } from "./meikyuuDeviceChoice";

/**
 * WHETHER A LINE DRAWN TO THE EDGE OF A ZOOMED BOARD SLIDES THE VIEW ALONG (the package's `edgePan`): on, as it has always
 * been, unless this device has turned it off in the colours window (`MeikyuuColours`). Some hands want the view to stay
 * where it is put and to move it themselves (Move, or two fingers), so it is a choice; kept on this device only, as it is a
 * fact about a hand and a screen (`meikyuuDeviceChoice.ts`).
 */
const edge = deviceChoice<"on" | "off">(EDGE_PAN_STORAGE, "on", (word) => (word === "on" || word === "off" ? word : null));

/** Whether the view slides at the edge, and the way to change that. */
export function useEdgePan(): { edgePan: boolean; choose: (on: boolean) => void } {
  return { edgePan: edge.use() === "on", choose: (on) => edge.choose(on ? "on" : "off") };
}
