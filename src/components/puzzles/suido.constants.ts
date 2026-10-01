import type { Kind } from "@johnmorrisdotca/suido";

import type { SuidoReading } from "@/lib/puzzles/suido/play";

/**
 * Suido's screen: the words it says, and the two choices it offers. One
 * constants module for the Suido components.
 */

/** What each kind of board asks, as a chip on the set-up and the line under it. */
export const SUIDO_KINDS: Record<Kind, { label: string; kanji: string; blurb: string }> = {
  drains: {
    label: "Drains",
    kanji: "排水",
    blurb: "Lead the water to every drain. Pieces the water does not need are spares: leave them facing any way.",
  },
  network: {
    label: "Network",
    kanji: "網",
    blurb: "Every piece must carry water, so there are no spares: the whole board is one set of pipes.",
  },
};

/** Which way a tap turns a piece, chosen under the board. */
export const SUIDO_WAYS = {
  clockwise: { label: "Clockwise", kanji: "右回り" },
  anticlockwise: { label: "Anticlockwise", kanji: "左回り" },
} as const;

export const SUIDO_COPY = {
  howTo: "Tap a piece to turn it a quarter. The water runs from the pump along every pipe that joins, and drips out of any open end.",
  turn: "Turn",
  /** The line under the board: how far the water has got, and how many open ends still leak. */
  status: ({ solved, reached, wanted, leaks, kind }: SuidoReading): string => {
    if (solved) return kind === "network" ? "Every piece is wet and nothing leaks." : "Every drain is reached and nothing leaks.";
    const what = kind === "network" ? `${reached} of ${wanted} ${wanted === 1 ? "piece" : "pieces"} wet` : `${reached} of ${wanted} ${wanted === 1 ? "drain" : "drains"} reached`;
    return `${what}, ${leaks === 0 ? "nothing leaking" : `${leaks} ${leaks === 1 ? "open end" : "open ends"} leaking`}.`;
  },
} as const;
