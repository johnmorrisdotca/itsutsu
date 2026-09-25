"use client";

import { useMemo, useState } from "react";

import { canTwist, forbiddenPoints, inMovePhase, indexOf, legalPoints, pieceMoves, pointOf, resolvePlacement, campOf } from "@/lib/gomoku/engine";
import { goBoardMarks } from "./goMarks";
import { lastMove } from "@/lib/gomoku/rules/record";
import { turnChoices } from "@/lib/gomoku/rules/choices";
import {
  BOARD_GRIDS,
  GAME_STATUS,
  PLACEMENTS,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import type { GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";
import {
  GUIDE_COLOURS,
  latticeFitFor,
  SQUARE_GUIDES,
  STONE_SETS,
} from "./Board.constants";
import { boardThemeFor, gridFor } from "./appearance";
import { BoardLines } from "./BoardLines";
import { layoutOrder } from "./flip";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { Intersection } from "./Intersection";
import { LatticeCoordinates } from "./LatticeCoordinates";
import { LatticeGround } from "./LatticeGround";
import { BoardFrame } from "./BoardFrame";
import { playingAreaInset, type LatticeShape } from "./margin";
import { squareLabel } from "./squareLabel";
import { squareGuide, turnGuide } from "./turnGuide";
import { TurnGuideNote } from "./TurnGuideNote";
import { TwistControls } from "./TwistControls";
import type { BoardMark, BoardProps } from "./board.types";

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
  // Wood, or the felt of a Reversi board (`boardThemeFor`).
  const theme = boardThemeFor(appearance, spec);
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
  // Go: the points the rules forbid, and the last liberty of a group in atari — see `goMarks.ts`.
  const goMarks = useMemo(() => (live && spec.go && legal !== null ? goBoardMarks(state, legal) : []), [legal, live, spec.go, state]);
  const overlays = markByIndex(size, [
    ...goMarks,
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
   * The reader's own view of the board and nothing else: the same cells in the
   * opposite order, with the gutters turned to match. No move, coordinate or
   * piece of game state knows about it.
   */
  const flipped = appearance.flipped ?? boardStartsFlipped(state.settings, viewer);

  return (
    <BoardFrame
      size={size}
      theme={theme}
      flipped={flipped}
      inset={inset}
      lattice={hexSkew}
      shape={shape}
      coordinates={appearance.showCoordinates}
      footer={live ? <TurnGuideNote guide={guide} size={size} /> : null}
    >
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
    </BoardFrame>
  );
}
