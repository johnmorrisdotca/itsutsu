/**
 * STONES, AS THE SITE OFFERS THEM. The package's board (2.1) can lay a marble on a passage beside the line that the line
 * may not enter: a helper for the big mazes, for shutting a passage found to lead nowhere, never a pen (it goes only within two
 * cells of the line, and only so many at once). John, who asked for it: "I chose marbles as I didn't want people to start painting
 * the map and just placing anywhere... it has to be a carefully placed item that you must lay adjacent to your existing path."
 *
 * The site offers it on every maze, limited by default (the package's few for the size: 4 for a small maze to 13 for a colossal
 * one) or with no limit, chosen on the set-up's options and kept on this device (`meikyuuStonesStore.ts`). A stone is the player's
 * own and is never part of the answer: what is handed in and checked is the line alone (`wayOfRun`), and a run kept half way carries
 * its stones after the line (`runFits`), so a resumed run has them where they were laid.
 */

/** The two limits a reader chooses between. */
export const MEIKYUU_STONE_LIMITS = ["limited", "unlimited"] as const;
export type StoneLimit = (typeof MEIKYUU_STONE_LIMITS)[number];

/** Where the choice is kept on a device. */
export const STONES_STORAGE = "itsutsu.meikyuu.stones";

/** Whether a word is one of the two choices. */
export function isStoneLimit(word: unknown): word is StoneLimit {
  return typeof word === "string" && (MEIKYUU_STONE_LIMITS as readonly string[]).includes(word);
}

/** What the package's `stones` option is for a choice: its defaults (`true`: a few by the maze's size, two cells from the line), or the same with no limit. */
export function stoneOptionOf(limit: StoneLimit): true | { limit: null } {
  return limit === "unlimited" ? { limit: null } : true;
}
