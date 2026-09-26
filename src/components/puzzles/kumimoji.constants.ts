/*
 * The look of a Kumimoji: letter tiles on a table, and the tray of the hand.
 *
 * A tile is the Gomoji Tiles style's white tile (`WORD_TILE_TYPED`) — ink
 * letter, a rim a shade darker — sized by the view rather than by a grid, so
 * its letter is set in pixels from the tile's side (`tileLetterPx`).
 */

/** A tile, on the table or in the hand. */
export const TILE =
  "flex items-center justify-center rounded-[14%] border-2 border-ink-soft/70 bg-white font-bold uppercase leading-none text-ink shadow-[0_1px_2px_rgba(0,0,0,0.35)] select-none";

/** A tile in a line that is not a word: red rim and a red wash, never colour alone — the line under the table names the word. */
export const TILE_MISSPELT = "border-shu bg-shu-soft text-shu";

/** A tile not joined to the rest: dashed, as though set down to one side. */
export const TILE_APART = "border-dashed opacity-80";

/** The tile chosen to move, in the hand or on the table. */
export const TILE_CHOSEN = "ring-4 ring-moss ring-offset-1 ring-offset-transparent";

/** The letter's size on a tile of this side. */
export function tileLetterPx(side: number): number {
  return Math.round(side * 0.56);
}

/**
 * The table's height: on a phone, the screen less the tray under it and the
 * clock over it, so the three fit together once the play is brought into view
 * (`bringTableIntoView`); on a desk, as tall as leaves the tray room under
 * it, and never taller than a comfortable board.
 */
export const TABLE_BOX = "relative h-[calc(100dvh-18rem)] min-h-72 w-full touch-none overflow-hidden rounded-xl bg-shade/60 select-none sm:h-[min(34rem,calc(100dvh-16rem))] sm:min-h-80";

/** A table nobody presses — a finished grid, the set-up preview — in a square box of its own. */
export const TILE_PICTURE_BOX = "relative aspect-square w-full overflow-hidden rounded-xl bg-shade/60";

/** An empty square on the table, a press waiting for a tile: a faint dot in its middle, and nothing drawn round it. */
export const TABLE_SQUARE = "absolute flex items-center justify-center outline-none focus-visible:bg-moss-soft/50";

/** The square a typed letter goes to. */
export const TABLE_CURSOR = "rounded-[14%] bg-moss-soft/70 ring-2 ring-inset ring-moss";

/**
 * THE HAND, a tray fixed to the bottom of a phone's screen so it is always in
 * reach while the table is panned, and under the table from a tablet up.
 */
export const TRAY =
  "fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-rule bg-ivory/95 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-sm sm:static sm:z-auto sm:rounded-2xl sm:border sm:bg-ivory/60 sm:p-4";

/** Room kept under the page on a phone, so nothing sits behind the tray. */
export const TRAY_ROOM = "pb-48 sm:pb-0";

/** A tile in the hand: a fingertip each way. */
export const HAND_TILE_PX = 40;
