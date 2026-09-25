"use client";

import type { ReactNode } from "react";

import { columnLetter, rowNumber } from "@/lib/gomoku/notation";

import { BOARD_FRAME, COORDINATE_GAP, LABEL_GUTTER } from "./Board.constants";
import { layoutOrder } from "./flip";
import { labelTracks, latticeLabelTracks, type LatticeShape } from "./margin";
import type { BoardThemeTokens } from "./board.types";

/**
 * The coordinate strips sit outside the board's own box, so the rim that
 * insets the playing area cannot inset them too — they carry it themselves,
 * as an empty track at each end, and each label is placed on the track its
 * row or column landed on rather than left to fall into the first one.
 */
type LabelStripProps = {
  size: number;
  theme: BoardThemeTokens;
  flipped: boolean;
  /** The board's rim, as a fraction of its width; zero on a board drawn on the lines. */
  inset: number;
  /** A board on the hexagon lattice, whose rows and columns do not span the box. */
  lattice: boolean;
  /** And which shape is cut out of that lattice: the whole rhombus, a hexagon, or a star. */
  shape: LatticeShape;
};

function ColumnLabels({ size, theme, flipped, inset, lattice, shape }: LabelStripProps) {
  /*
   * A star is given no letters at all: no row of it holds the columns a strip
   * would have to follow. See `starColumnsSayNothing` in margin.ts — an empty
   * strip is the honest answer, and seventeen letters over sealed cells was
   * what it printed before.
   */
  if (lattice && shape === "star") return <div />;
  return (
    <div
      className="grid text-center text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateColumns: lattice ? latticeLabelTracks(size, "columns", shape) : labelTracks(size, inset),
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {layoutOrder(size, flipped).map((col, slot) => (
        <span key={col} className="self-end leading-none" style={{ gridColumnStart: slot + 2, paddingBottom: COORDINATE_GAP }}>
          {columnLetter(col)}
        </span>
      ))}
    </div>
  );
}

function RowLabels({ size, theme, flipped, inset, lattice, shape }: LabelStripProps) {
  return (
    <div
      /*
       * AS TALL AS THE BOARD, NEVER TALLER. `h-0 min-h-full`: the strip takes
       * its height from the row the board sets, and contributes none of its
       * own. Without it the row's height was the LARGER of the board's and the
       * strip's, and the strip's is its numbers stacked at a full line each —
       * about 16px apiece at 0.65rem. On a 240px phone preview that is taller
       * than the board from 15 rows up: Halma 16 came out 240 wide and 294
       * tall, and 4, 3, 2, 1 were printed on nothing below the board's edge.
       *
       * The numbers keep their size; only who decides the strip's height
       * changes. Squeezed, a 10px numeral in an 11px row still reads, and the
       * letters across the top were never affected — they are one line tall
       * whatever the board.
       */
      className="grid h-0 min-h-full text-right text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateRows: lattice ? latticeLabelTracks(size, "rows", shape) : labelTracks(size, inset),
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {layoutOrder(size, flipped).map((row, slot) => (
        <span key={row} className="flex items-center justify-end" style={{ gridRowStart: slot + 2, paddingRight: COORDINATE_GAP }}>
          {rowNumber(size, row)}
        </span>
      ))}
    </div>
  );
}

/**
 * THE BOARD ITSELF, WITHOUT WHAT IS PLAYED ON IT: the coordinate strips, the
 * square of wood in its frame, and the playing area inset from its rim.
 *
 * It was the outside of `Board`. The puzzles' preview on the set-up screen
 * drew a picture of its own instead — a thumbnail in a box of a different
 * size — and John, 2026-09-24: "the board should be the same colour at least
 * for the background… the inside of the board could be white because it's a
 * place where people write. But the rest of the board should look like the
 * rest of the boards", and "The effect of having the same size and look is
 * that when the user clicks at anything the board and page doesn't shift".
 * So the frame is one component: `Board` draws lines and stones inside it,
 * and `PuzzleBoardPreview` draws a grid to write in inside the same one, at
 * the same size, with the same coordinates.
 *
 * `children` is the playing area, already inset by `inset` and clipped (see
 * the note on that box below); `footer` sits under the board, in the same
 * grid, where `Board` puts its turn guide.
 */
export function BoardFrame({
  size,
  theme,
  flipped,
  inset,
  lattice,
  shape,
  coordinates,
  children,
  footer = null,
}: {
  size: number;
  theme: BoardThemeTokens;
  flipped: boolean;
  /** The board's rim, as a fraction of its width; zero on a board drawn on the lines. */
  inset: number;
  /** A board on the hexagon lattice, which carries its coordinates on its border tiles. */
  lattice: boolean;
  shape: LatticeShape;
  /** Whether the letters and numbers are shown at all. */
  coordinates: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  /*
   * A LATTICE BOARD'S COORDINATES ARE ON ITS BORDER TILES (`LatticeCoordinates`),
   * so it gets no strips and no gutter for them: the letters and numbers are
   * on the board, where John asked for them. The square boards keep theirs.
   */
  const stripsOutside = coordinates && !lattice;
  const gutter = stripsOutside ? LABEL_GUTTER : "0px";
  return (
    <div
      /*
       * ROOM FOR THE FRAME ON THE RIGHT AND BELOW. The frame is a box-shadow,
       * drawn OUTSIDE the board's box, and the grid reserved nothing for it on
       * those two sides — the labels' gutter sat on the left and above, and on
       * a 390-pixel phone the frame's right edge ended two pixels from the
       * glass while the left had twenty-six. John: "all these boards have
       * proper padding on the left, but seemed to overflow and do not have the
       * correct padding on the right". The padding is the frame's own width,
       * so the board keeps every pixel the labels leave it and the frame stays
       * on the page.
       */
      className="grid w-full"
      style={{
        gridTemplateColumns: `${gutter} minmax(0, 1fr)`,
        gridTemplateRows: `${gutter} auto`,
        paddingRight: BOARD_FRAME,
        paddingBottom: BOARD_FRAME,
        // And on the two sides the gutter would otherwise cover: with no strips there is no gutter.
        ...(stripsOutside ? {} : { paddingLeft: BOARD_FRAME, paddingTop: BOARD_FRAME }),
      }}
    >
      <div />
      {stripsOutside ? (
        <ColumnLabels size={size} theme={theme} flipped={flipped} inset={inset} lattice={lattice} shape={shape} />
      ) : (
        <div />
      )}
      {stripsOutside ? (
        <RowLabels size={size} theme={theme} flipped={flipped} inset={inset} lattice={lattice} shape={shape} />
      ) : (
        <div />
      )}
      <div
        className="relative aspect-square rounded-md"
        // Which surface is drawn, by name, for a test to read: a gradient is no way to ask.
        data-testid="board-surface"
        data-surface={theme.label}
        style={{
          background: theme.surface,
          /*
           * EVERY BOARD IS A SQUARE OF WOOD IN A FRAME, since 2026-09-22 — the
           * rhombus included. Hex's paper used to be cut to the rhombus, so
           * it was the one board on the site with no frame and no wood around
           * its shape; John: "that other strange board that looks like a
           * diamond shape that also is weird." It is a square board now with
           * the rhombus drawn on it, the way the star and the honeycomb are,
           * over the same faint lattice — see `LatticeGround`.
           */
          boxShadow: `0 0 0 ${BOARD_FRAME} ${theme.frame}, 0 18px 40px -18px rgba(0,0,0,0.65)`,
        }}
      >
        {/*
          * The playing area, inset from the board's edge by its rim.
          *
          * The grid is drawn in an SVG and the stones are laid out in a CSS
          * grid, in two separate boxes that are kept exactly over each other.
          * So the rim goes HERE, on the one box they both fill, and never on
          * either of them: inset the lines alone and every stone would sit
          * off its square. Anything that has to line up with a cell — the
          * twist arrows included — belongs inside this.
          *
          * AND IT CLIPS, because a sheared lattice is WIDER THAN ITS BOARD.
          * `HEXAGON_TRANSFORM` fits the hexagon rather than the array holding
          * it, so the array's unused corners — blocked cells, drawn by nobody
          * — hang about a fifth of a board width past each edge. A transform
          * moves no layout but it does move the SCROLL area, so on a 390px
          * phone the honeycomb made the whole document 455px wide: every page
          * it appeared on scrolled sideways and was shrunk to fit. Nothing
          * visible is lost here — the shape itself is fitted inside the box by
          * the transform, which `hexagonFit.test.ts` measures — so this clips
          * only the empty overhang. `e2e/boards-fit-a-phone.spec.ts` holds it.
          */}
          <div className="absolute overflow-hidden" style={{ inset: `${inset * 100}%` }}>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}
