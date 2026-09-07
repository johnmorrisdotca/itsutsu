import type { Stone } from "@/lib/gomoku/gomoku.types";

/** Board surface and line colours. The board keeps its wood look in both themes. */
export const BOARD_SURFACE_CLASS = "bg-[#e2ba7a]";
export const BOARD_LINE_CLASS = "stroke-[#5b3d1c]";
export const BOARD_STAR_CLASS = "fill-[#5b3d1c]";

/** SVG stroke widths in board units (one intersection spacing = 1). */
export const LINE_WIDTH = 0.045;
export const EDGE_LINE_WIDTH = 0.08;
export const STAR_RADIUS = 0.11;

/** Width of the coordinate-label gutter along the top and left edges. */
export const LABEL_GUTTER = "1.5rem";

export const STONE_CLASS: Record<Stone, string> = {
  black:
    "bg-[radial-gradient(circle_at_35%_35%,#6b6b6b_0%,#1a1a1a_45%,#000_100%)]",
  white:
    "bg-[radial-gradient(circle_at_35%_35%,#ffffff_0%,#ececec_45%,#bfbfbf_100%)]",
};

/** Colour of the last-move dot, chosen to contrast with the stone it sits on. */
export const LAST_MOVE_DOT_CLASS: Record<Stone, string> = {
  black: "bg-white/90",
  white: "bg-black/80",
};

export const WINNING_RING_CLASS = "ring-[0.2em] ring-red-500/90";
