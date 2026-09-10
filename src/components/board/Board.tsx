"use client";

import { useMemo, useState } from "react";

import { canTwist, forbiddenPoints, inMovePhase, indexOf, legalPoints, pieceMoves, pointOf, resolvePlacement, campOf, STAR_RADIUS, starCampOf } from "@/lib/gomoku/engine";
import { lastMove } from "@/lib/gomoku/rules/record";
import {
  BLOCKED,
  GAME_STATUS,
  HOT,
  WORM,
  PLACEMENTS,
  STONE_DISPLAY,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import { columnLetter, pointName, rowNumber } from "@/lib/gomoku/notation";
import type { Cell, GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";
import { BOARD_THEMES, LABEL_GUTTER, STONE_SETS } from "./Board.constants";
import { BoardLines } from "./BoardLines";
import { layoutOrder } from "./flip";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { Intersection } from "./Intersection";
import { TwistControls } from "./TwistControls";
import type { BoardMark, BoardProps, BoardThemeTokens } from "./board.types";

function cellDescription(cell: Cell, forbidden: boolean): string {
  if (cell === BLOCKED) return "blocked";
  if (cell === HOT) return "hotspot";
  if (cell === WORM) return "wormhole";
  if (cell === null) return forbidden ? "forbidden" : "empty";
  return `${STONE_DISPLAY[cell].label} stone`;
}

function ColumnLabels({ size, theme, flipped }: { size: number; theme: BoardThemeTokens; flipped: boolean }) {
  return (
    <div
      className="grid text-center text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {layoutOrder(size, flipped).map((col) => (
        <span key={col} className="self-end pb-1 leading-none">
          {columnLetter(col)}
        </span>
      ))}
    </div>
  );
}

function RowLabels({ size, theme, flipped }: { size: number; theme: BoardThemeTokens; flipped: boolean }) {
  return (
    <div
      className="grid text-right text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {layoutOrder(size, flipped).map((row) => (
        <span key={row} className="flex items-center justify-end pr-1.5">
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
/** Half a cell per row, in degrees: the slant that turns a square grid into a hexagon lattice. */
const SLANT = (Math.atan(0.5) * 180) / Math.PI;

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
  // Othello and the drop games are played in the squares; the rest on the lines.
  const cells =
    appearance.grid === "cells" ||
    (appearance.grid === "auto" &&
      (spec.flips || spec.camps || spec.connects || spec.checkers || spec.placement !== PLACEMENTS.free));

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
  const overlays = markByIndex(size, [
    ...Array.from(forbidden, (index) => ({ ...pointOf(size, index), kind: "forbidden" as const })),
    ...Array.from(destinations, (index) => ({ ...pointOf(size, index), kind: "target" as const })),
    ...(sliding && selected !== null ? [{ ...selected, kind: "selected" as const }] : []),
    ...marks,
  ]);
  const twisting = live && onTwist !== undefined && canTwist(state) && spec.quadrantSize !== null;
  const dropping = spec.placement === PLACEMENTS.drop;
  // A rhombus of hexagons, drawn as a slanted square grid: Hex's own board shape.
  const rhombus = spec.connects;
  /*
   * Any board on the same hex lattice needs the same skew to read as hexagons
   * rather than a sheared square grid — Hex's rhombus and Chinese Checkers'
   * star both stand on it, even though only Hex is actually a rhombus.
   */
  const hexSkew = spec.connects || spec.chineseCheckers;

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
        <ColumnLabels size={size} theme={theme} flipped={flipped} />
      ) : (
        <div />
      )}
      {appearance.showCoordinates ? (
        <RowLabels size={size} theme={theme} flipped={flipped} />
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
            ? // A little wider than the rhombus itself, so a stone on an edge is not shaved.
              { clipPath: "polygon(-2% 14%, 69% 14%, 102% 86%, 31% 86%)" }
            : { boxShadow: `0 0 0 0.4rem ${theme.frame}, 0 18px 40px -18px rgba(0,0,0,0.65)` }),
        }}
      >
        {/*
          * The connection game is played on a rhombus of hexagons. A hexagon
          * lattice is a square grid with every row shifted half a cell, so
          * that is exactly what this does — skew the grid, squeeze it back
          * into the square the board already occupies, and undo both on each
          * cell so the stones stay round.
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
            ...(hexSkew ? { transform: `translateY(16.667%) skewX(${SLANT}deg) scale(${1 / 1.5})`, transformOrigin: "top left" } : {}),
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
            const ownPiece = sliding && cell === state.toPlay;
            const target = destinations.has(index);
            const inFootprint = footprint.has(index);
            // In a piece game a corner can be laid wherever the piece fits.
            const cornerFits = piecing && cell === null && footprintFor?.(point) !== null && !legal?.has(index);
            return (
              <Intersection
                key={index}
                point={point}
                cell={cell}
                label={`${pointName(size, point)}, ${cellDescription(cell, forbidden.has(index))}`}
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
  );
}
