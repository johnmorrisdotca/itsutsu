import { pictureBox } from "@/components/games/picture";

import { SEAT_MARK_LOOK } from "./picker.constants";
import type { SeatMarkProps } from "./picker.types";

/**
 * The picture on an opponent's tile: a stone. White with an initial for a
 * person, black with its own script for a program, an empty dashed ring for
 * the seat nobody has taken.
 *
 * At one of the site's two picture sizes, like every other picture on the
 * set-up page. It was 36px, beside a 70px board block, a 56px family tile and a
 * 40px game chip — the several sizes John asked to become one.
 *
 * Decorative: the tile's own words say who it is.
 */
export function SeatMark({ kind, size, children = null }: SeatMarkProps) {
  return (
    <span aria-hidden="true" className={SEAT_MARK_LOOK[kind]} style={pictureBox(size)} data-testid="seat-mark" data-picture={size}>
      {children}
    </span>
  );
}
