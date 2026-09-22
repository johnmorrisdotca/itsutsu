"use client";

import { useMemo, useState } from "react";

import { canTwist, forbiddenPoints, inMovePhase, indexOf, legalPoints, pieceMoves, pointOf, resolvePlacement, campOf } from "@/lib/gomoku/engine";
import { lastMove } from "@/lib/gomoku/rules/record";
import { turnChoices } from "@/lib/gomoku/rules/choices";
import {
  BOARD_GRIDS,
  GAME_STATUS,
  PLACEMENTS,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import { columnLetter, rowNumber } from "@/lib/gomoku/notation";
import type { GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";
import {
  BOARD_THEMES,
  GUIDE_COLOURS,
  LABEL_GUTTER,
  BOARD_FRAME,
  COORDINATE_GAP,
  latticeFitFor,
  SQUARE_GUIDES,
  STONE_SETS,
} from "./Board.constants";
import { gridFor } from "./appearance";
import { BoardLines } from "./BoardLines";
import { layoutOrder } from "./flip";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { Intersection } from "./Intersection";
import { LatticeCoordinates } from "./LatticeCoordinates";
import { LatticeGround } from "./LatticeGround";
import { labelTracks, latticeLabelTracks, playingAreaInset, type LatticeShape } from "./margin";
import { squareLabel } from "./squareLabel";
import { squareGuide, turnGuide } from "./turnGuide";
import { TurnGuideNote } from "./TurnGuideNote";
import { TwistControls } from "./TwistControls";
import type { BoardMark, BoardProps, BoardThemeTokens } from "./board.types";

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
      className="grid text-right text-[0.65rem] font-medium select-none"
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

/** Move number for each occupied intersection, when numbers are being shown. */
function numberByIndex(state: GameState, show: boolean): Map<number, number> {
  const numbers = new Map<number, number>();
  if (!show) return numbers;
  state.moves.forEach((move, index) => {
    numbers.set(indexOf(state.settings.size, move), index + 1);
  });
  return numbers;
}

function markByIndex(
  size: number,
  marks: readonly BoardMark[],
): Map<number, BoardMark> {
  const byIndex = new Map<number, BoardMark>();
  for (const mark of marks) byIndex.set(indexOf(size, mark), mark);
  return byIndex;
}

/**
 * The playing surface: coordinate gutters, the board with its lines, and one
 * button per intersection laid over them.
 */
/**
 * WHICH FIT THIS BOARD'S LATTICE TAKES, and it is one of three.
 *
 * The rhombus is the whole array, so it takes the array's fit. The other two
 * are shapes cut OUT of an array — a hexagon in a (2R+1) square, a hexagram in
 * a (4R+1) one — and fitting the array would leave either of them floating in
 * a frame of cells nobody draws. John, on the honeycomb: "Why is there such a
 * border around 13x13? If that's the largest, it shoud fill the page."
 *
 * The star was the same fault twice as bad — 51% of its board's width and 58%
 * of its height, which is under a third of the wood — and it is the shape that
 * made the fit general, because it is TALLER than it is wide and every other
 * shape here is not. See `latticeFit`.
 */
function latticeShape(spec: { hexagon: boolean; chineseCheckers: boolean }): LatticeShape {
  if (spec.hexagon) return "hexagon";
  if (spec.chineseCheckers) return "star";
  return "rhombus";
}

function latticeTransform(size: number, shape: LatticeShape): string {
  return latticeFitFor(shape, size).transform;
}

export function Board({
  state,
  appearance,
  marks = [],
  readOnly = false,
  onPlay,
  onTwist,
  selected = null,
  footprintFor,
  placing = null,
  viewer = null,
}: BoardProps) {
  const [hovered, setHovered] = useState<Point | null>(null);
  const { size } = state.settings;
  const spec = VARIANT_SPECS[state.settings.variant];
  const theme = BOARD_THEMES[appearance.boardTheme];
  const stones = STONE_SETS[appearance.stoneSet];
  // In the squares or on the crossings: the game's own custom, from its spec, unless the reader chose one look for all.
  const cells = gridFor(appearance, spec) === BOARD_GRIDS.cells;

  const last = lastMove(state);
  const lastIndex = last === null ? -1 : indexOf(size, last);
  const winningIndices = new Set(
    state.winningLine.map((point) => indexOf(size, point)),
  );
  const numbers = numberByIndex(state, appearance.showMoveNumbers);
  const kings = new Set(state.kings.map((point) => indexOf(size, point)));
  const live = !readOnly && state.status === GAME_STATUS.playing;
  const ghost = live ? (spec.singleColour ? "black" : (placing ?? state.toPlay)) : null;

  /*
   * What the rules allow right now, asked of the engine once per position.
   * Forbidden points are drawn as a rule of the game, under any advice marks,
   * and everything outside the opening's reach is simply not offered.
   */
  const legal = useMemo(
    () => (live ? new Set(legalPoints(state).map((point) => indexOf(size, point))) : null),
    [live, size, state],
  );
  const forbidden = useMemo(
    () => (live ? new Set(forbiddenPoints(state).map((point) => indexOf(size, point))) : new Set<number>()),
    [live, size, state],
  );
  /*
   * The sliding games: once every piece is down, the mover's own stones are
   * the things to click, and the picked-up piece shows where it may go.
   */
  const sliding = live && inMovePhase(state);
  const destinations = useMemo(
    () =>
      sliding && selected !== null
        ? new Set(pieceMoves(state, selected).map((point) => indexOf(size, point)))
        : new Set<number>(),
    [selected, size, sliding, state],
  );
  /*
   * The turn guide: on the player's own turn, the few things they may do,
   * marked, and the rest dimmed — see turnGuide.ts. Read from the engine's
   * answer once per position, and only on a board being played, so a replay,
   * an embed or somebody else's turn draws exactly as before.
   */
  const guide = useMemo(() => (live ? turnGuide(state, turnChoices(state)) : null), [live, state]);
  const guideColours = theme.dark ? GUIDE_COLOURS.dark : GUIDE_COLOURS.light;
  const overlays = markByIndex(size, [
    ...Array.from(forbidden, (index) => ({ ...pointOf(size, index), kind: "forbidden" as const })),
    ...Array.from(destinations, (index) => ({ ...pointOf(size, index), kind: "target" as const })),
    ...(sliding && selected !== null ? [{ ...selected, kind: "selected" as const }] : []),
    ...marks,
  ]);
  const twisting = live && onTwist !== undefined && canTwist(state) && spec.quadrantSize !== null;
  const dropping = spec.placement === PLACEMENTS.drop;
  /*
   * Any board on the hexagon lattice takes the same shear — HEX_LATTICE in
   * Board.constants.ts — or its six neighbours do not sit at one distance.
   * Hex's rhombus and Chinese Checkers' star both stand on it, even though
   * only Hex is actually a rhombus.
   */
  const hexSkew = spec.connects || spec.chineseCheckers || spec.hexagon;
  /* Which shape is cut out of the sheared array — the one word both the fit and the strips read. */
  const shape = latticeShape(spec);
  /*
   * The rim of bare surface around the playing area — see margin.ts. A board
   * on the lines already leaves half a cell, so this is what a board in the
   * squares needs to read as the same kind of object rather than a crop.
   *
   * Not the rhombus: a rhombus is the board there, cut to its own shape, and
   * a rectangular margin inside a shape the paper does not have would be a
   * border round nothing. It keeps its clip.
   */
  const inset = playingAreaInset(size, cells && !spec.connects);

  /*
   * The piece games: the piece in hand hangs under the pointer with its
   * corner on the hovered point, cell colours and all, and a click lays it
   * there. Where it does not fit, nothing is shown and nothing happens.
   */
  const footprint = useMemo(() => {
    if (!live || footprintFor === undefined) return new Map<number, Stone>();
    const cells = new Map<number, Stone>();
    // Every empty point is a possible corner, so a click anywhere can be a lay.
    if (hovered !== null) {
      for (const cell of footprintFor(hovered) ?? []) cells.set(indexOf(size, cell), cell.stone);
    }
    return cells;
  }, [footprintFor, hovered, live, size]);
  const piecing = live && footprintFor !== undefined && spec.queue !== null;

  /*
   * A LATTICE BOARD'S COORDINATES ARE ON ITS BORDER TILES (`LatticeCoordinates`),
   * so it gets no strips and no gutter for them: the letters and numbers are
   * on the board, where John asked for them. The square boards keep theirs.
   */
  const stripsOutside = appearance.showCoordinates && !hexSkew;
  const gutter = stripsOutside ? LABEL_GUTTER : "0px";
  /*
   * The reader's own view of the board and nothing else: the same cells in the
   * opposite order, with the gutters turned to match. No move, coordinate or
   * piece of game state knows about it.
   */
  const flipped = appearance.flipped ?? boardStartsFlipped(state.settings, viewer);

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
        <ColumnLabels size={size} theme={theme} flipped={flipped} inset={inset} lattice={hexSkew} shape={shape} />
      ) : (
        <div />
      )}
      {stripsOutside ? (
        <RowLabels size={size} theme={theme} flipped={flipped} inset={inset} lattice={hexSkew} shape={shape} />
      ) : (
        <div />
      )}
      <div
        className="relative aspect-square rounded-md"
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
          {/*
            * The connection game is played on a rhombus ruled as a triangular
            * lattice, with the stones on the crossings. A hexagon lattice is a
            * square grid with every row slid half a cell along and the rows
            * packed closer, so that is exactly what this does — shear the
            * grid, fit it back into the square the board already occupies,
            * and undo the shear on each cell so the stones stay round. The
            * lines take the same transform in BoardLines, which is what keeps
            * a stone on its crossing.
            */}
          {/*
            * THE WOOD IS MARKED ALL THE WAY ACROSS on a lattice board, under
            * whatever the game draws: the star's holes, the honeycomb's
            * cells, Hex's lines. Two kinds of board on this site and no more —
            * the go-style square and this — which is what John asked for.
            */}
          {hexSkew ? (
            <LatticeGround size={size} theme={theme} fit={latticeFitFor(shape, size)} />
          ) : null}
          <BoardLines
            size={size}
            theme={theme}
            quadrantSize={spec.quadrantSize}
            cells={cells}
            checkered={spec.checkers}
            lattice={hexSkew ? { shape, board: state.board, transform: latticeTransform(size, shape) } : null}
          />
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              /*
                THE SHAPE'S OWN FIT. A hexagon is the middle two thirds of the
                rhombus the whole array shears into, so fitting the array would
                leave it floating in its own frame — see `latticeFit`.
              */
              ...(hexSkew
                ? { transform: latticeTransform(size, shape), transformOrigin: "top left" }
                : {}),
            }}
          >
            {layoutOrder(state.board.length, flipped).map((index) => {
              const cell = state.board[index];
              const point = pointOf(size, index);
              const landing = dropping && live ? resolvePlacement(state, point) : point;
              const landingIndex = indexOf(size, landing);
              const playable = legal === null || legal.has(index);
              // In a drop game any empty cell of a column with room plays that column.
              const routed = dropping && cell === null && legal !== null && legal.has(landingIndex);
              const guided = squareGuide(guide, index, cell);
              // A piece the guide holds back is not offered: it cannot be picked up at all this turn.
              const ownPiece = sliding && cell === state.toPlay && guided !== SQUARE_GUIDES.unavailable;
              const target = destinations.has(index);
              const inFootprint = footprint.has(index);
              // In a piece game a corner can be laid wherever the piece fits.
              const cornerFits = piecing && cell === null && footprintFor?.(point) !== null && !legal?.has(index);
              return (
                <Intersection
                  key={index}
                  point={point}
                  cell={cell}
                  label={squareLabel(size, point, cell, {
                    forbidden: forbidden.has(index),
                    king: spec.checkers && kings.has(index),
                  })}
                  isLast={index === lastIndex}
                  isWinning={winningIndices.has(index)}
                  ghost={(playable || target) && !piecing ? ghost : null}
                  ghostStone={inFootprint ? (footprint.get(index) ?? null) : null}
                  clickable={routed || ownPiece || target || (piecing && (cornerFits || playable))}
                  onHover={piecing ? setHovered : undefined}
                  moveNumber={numbers.get(index) ?? null}
                  mark={overlays.get(index) ?? null}
                  unslant={hexSkew}
                  /*
                    A camp is tinted on the CELL: a square on a square board,
                    and on the lattice the hexagon tile itself (`BoardLines`),
                    because a square painted over a hexagon spills onto its
                    neighbours — the "painting issue" John saw on the star.
                  */
                  camp={spec.camps ? campOf(size, point) : null}
                  isKing={spec.checkers ? kings.has(index) : false}
                  hideBlocked={spec.chineseCheckers || spec.hexagon}
                  guide={guided}
                  guideColours={guideColours}
                  stones={stones}
                  winningColour={theme.winning}
                  readOnly={readOnly}
                  onPlay={onPlay}
                />
              );
            })}
          </div>
          {hexSkew && appearance.showCoordinates ? (
            <LatticeCoordinates shape={shape} size={size} fit={latticeFitFor(shape, size)} theme={theme} flipped={flipped} />
          ) : null}
          {twisting && spec.quadrantSize !== null ? (
            <TwistControls size={size} quadrantSize={spec.quadrantSize} onTwist={onTwist} flipped={flipped} />
          ) : null}
        </div>
      </div>
      {live ? <TurnGuideNote guide={guide} size={size} /> : null}
    </div>
  );
}
