"use client";

import { useMemo, useState } from "react";

import { canTwist, forbiddenPoints, inMovePhase, indexOf, legalPoints, pieceMoves, pointOf, resolvePlacement, campOf, STAR_RADIUS, starCampOf } from "@/lib/gomoku/engine";
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
  LATTICE_TRANSFORM,
  RHOMBUS_CLIP,
  SQUARE_GUIDES,
  STONE_SETS,
} from "./Board.constants";
import { gridFor } from "./appearance";
import { BoardLines } from "./BoardLines";
import { layoutOrder } from "./flip";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { Intersection } from "./Intersection";
import { labelTracks, latticeLabelTracks, playingAreaInset } from "./margin";
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
};

function ColumnLabels({ size, theme, flipped, inset, lattice }: LabelStripProps) {
  return (
    <div
      className="grid text-center text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateColumns: lattice ? latticeLabelTracks(size, "columns") : labelTracks(size, inset),
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {layoutOrder(size, flipped).map((col, slot) => (
        <span key={col} className="self-end pb-1 leading-none" style={{ gridColumnStart: slot + 2 }}>
          {columnLetter(col)}
        </span>
      ))}
    </div>
  );
}

function RowLabels({ size, theme, flipped, inset, lattice }: LabelStripProps) {
  return (
    <div
      className="grid text-right text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateRows: lattice ? latticeLabelTracks(size, "rows") : labelTracks(size, inset),
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {layoutOrder(size, flipped).map((row, slot) => (
        <span key={row} className="flex items-center justify-end pr-1.5" style={{ gridRowStart: slot + 2 }}>
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
  // A rhombus, ruled as a triangular lattice: Hex's own board shape.
  const rhombus = spec.connects;
  /*
   * Any board on the hexagon lattice takes the same shear — HEX_LATTICE in
   * Board.constants.ts — or its six neighbours do not sit at one distance.
   * Hex's rhombus and Chinese Checkers' star both stand on it, even though
   * only Hex is actually a rhombus.
   */
  const hexSkew = spec.connects || spec.chineseCheckers;
  /*
   * The rim of bare surface around the playing area — see margin.ts. A board
   * on the lines already leaves half a cell, so this is what a board in the
   * squares needs to read as the same kind of object rather than a crop.
   *
   * Not the rhombus: a rhombus is the board there, cut to its own shape, and
   * a rectangular margin inside a shape the paper does not have would be a
   * border round nothing. It keeps its clip.
   */
  const inset = playingAreaInset(size, cells && !rhombus);

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

  const gutter = appearance.showCoordinates ? LABEL_GUTTER : "0px";
  /*
   * The reader's own view of the board and nothing else: the same cells in the
   * opposite order, with the gutters turned to match. No move, coordinate or
   * piece of game state knows about it.
   */
  const flipped = appearance.flipped ?? boardStartsFlipped(state.settings, viewer);

  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: `${gutter} minmax(0, 1fr)`,
        gridTemplateRows: `${gutter} auto`,
      }}
    >
      <div />
      {appearance.showCoordinates ? (
        <ColumnLabels size={size} theme={theme} flipped={flipped} inset={inset} lattice={hexSkew} />
      ) : (
        <div />
      )}
      {appearance.showCoordinates ? (
        <RowLabels size={size} theme={theme} flipped={flipped} inset={inset} lattice={hexSkew} />
      ) : (
        <div />
      )}
      <div
        className="relative aspect-square rounded-md"
        style={{
          background: theme.surface,
          // A rhombus is the board here, not a square with one drawn on it, so
          // the paper is cut to the same shape the grid is slanted into.
          ...(rhombus
            ? { clipPath: RHOMBUS_CLIP }
            : { boxShadow: `0 0 0 0.4rem ${theme.frame}, 0 18px 40px -18px rgba(0,0,0,0.65)` }),
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
          */}
          <div className="absolute" style={{ inset: `${inset * 100}%` }}>
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
          <BoardLines
            size={size}
            theme={theme}
            quadrantSize={spec.quadrantSize}
            cells={cells}
            rhombus={rhombus}
            checkered={spec.checkers}
            hidden={spec.chineseCheckers}
          />
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              ...(hexSkew ? { transform: LATTICE_TRANSFORM, transformOrigin: "top left" } : {}),
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
                  camp={spec.camps ? campOf(size, point) : spec.chineseCheckers ? starCampOf(STAR_RADIUS, point) : null}
                  isKing={spec.checkers ? kings.has(index) : false}
                  hideBlocked={spec.chineseCheckers}
                  hole={spec.chineseCheckers && cell === null}
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
          {twisting && spec.quadrantSize !== null ? (
            <TwistControls size={size} quadrantSize={spec.quadrantSize} onTwist={onTwist} flipped={flipped} />
          ) : null}
        </div>
      </div>
      {live ? <TurnGuideNote guide={guide} size={size} /> : null}
    </div>
  );
}
