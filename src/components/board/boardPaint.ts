import type { CSSProperties } from "react";

import type { BoardThemeTokens } from "./board.types";

/**
 * A patch of a board's surface, drawn as a bit of the board rather than a dot
 * of its colour: the surface, crossed once each way by its own ruling, so the
 * patch reads as four squares, inside a rim of the board's frame. For every
 * swatch that picks a board (`FeltPatches`, and the board themes beside a
 * game); a stone's or a marble's colour stays a circle.
 */
export function boardPatchLook(look: BoardThemeTokens): CSSProperties {
  const rule = `linear-gradient(${look.line}, ${look.line})`;
  return {
    background: `${rule} center / 1px 100% no-repeat, ${rule} center / 100% 1px no-repeat, ${look.surface}`,
    // A border rather than an inset shadow: the ring that marks the chosen patch is a box-shadow, and an inline one would replace it.
    border: `2px solid ${look.frame}`,
  };
}
