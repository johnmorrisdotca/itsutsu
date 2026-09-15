import { BOARD_SIZE_LATTICE, BOARD_SIZE_MARK_CLASS } from "@/components/board/Board.constants";
import { pictureBox } from "@/components/games/picture";

import { openingStones, openingZone } from "./openingPicture";
import { MARK_STONE, MARK_STONE_COLOUR, OPENING_ZONE_CLASS } from "./picker.constants";
import type { OpeningMarkProps } from "./picker.types";

/**
 * An opening as a picture: the chosen board's lattice, the square the opening
 * restricts, and the three stones that say what the restriction is.
 *
 * THE LATTICE IS `BoardSizeMark`'s — the same gradient and the same frame — so
 * an opening's tile and a board's block read as one family of pictures on one
 * screen. It is drawn at the board the reader has chosen, so Pro's square is a
 * third of a 15×15 and a quarter of a 19×19, the way it will be when they play.
 *
 * Decorative (`aria-hidden`): the name and the line under it on the same tile
 * say everything the picture does, and a screen reader would otherwise be told
 * it twice.
 *
 * At one of the site's three picture sizes: regular on the set-up tile, large
 * beside the doorstep's board. It was 44px on the tile and 112 on the doorstep.
 */
export function OpeningMark({ opening, side, size }: OpeningMarkProps) {
  const cell = 100 / side;
  const zone = openingZone(opening, side);
  return (
    <span
      aria-hidden="true"
      className={`${BOARD_SIZE_MARK_CLASS} overflow-hidden`}
      style={{
        ...pictureBox(size),
        backgroundImage: BOARD_SIZE_LATTICE,
        backgroundSize: `${cell}% ${cell}%`,
      }}
      data-testid="opening-mark"
      data-opening={opening}
      data-picture={size}
    >
      {zone !== null ? (
        <span
          className={OPENING_ZONE_CLASS}
          style={{
            left: `${zone.from * cell}%`,
            top: `${zone.from * cell}%`,
            width: `${zone.span * cell}%`,
            height: `${zone.span * cell}%`,
          }}
        />
      ) : null}
      {openingStones(opening, side).map((stone) => (
        <span
          key={`${stone.row}-${stone.col}`}
          className={`${MARK_STONE} ${MARK_STONE_COLOUR[stone.colour]}`}
          style={{ left: `${(stone.col + 0.5) * cell}%`, top: `${(stone.row + 0.5) * cell}%` }}
        />
      ))}
    </span>
  );
}
