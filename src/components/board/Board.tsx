"use client";

import { useMemo } from "react";

import {
  canTwist,
  forbiddenPoints,
  inMovePhase,
  indexOf,
  lastMove,
  legalPoints,
  pieceMoves,
  pointOf,
  resolvePlacement,
} from "@/lib/gomoku/engine";
import {
  BLOCKED,
  GAME_STATUS,
  PLACEMENTS,
  STONE_DISPLAY,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import { columnLetter, pointName, rowNumber } from "@/lib/gomoku/notation";
import type { Cell, GameState } from "@/lib/gomoku/gomoku.types";
import { BOARD_THEMES, LABEL_GUTTER, STONE_SETS } from "./Board.constants";
import { BoardLines } from "./BoardLines";
import { Intersection } from "./Intersection";
import { TwistControls } from "./TwistControls";
import type { BoardMark, BoardProps, BoardThemeTokens } from "./board.types";

function cellDescription(cell: Cell, forbidden: boolean): string {
  if (cell === BLOCKED) return "blocked";
  if (cell === null) return forbidden ? "forbidden" : "empty";
  return `${STONE_DISPLAY[cell].label} stone`;
}

function ColumnLabels({ size, theme }: { size: number; theme: BoardThemeTokens }) {
  return (
    <div
      className="grid text-center text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: size }, (_, col) => (
        <span key={col} className="self-end pb-1 leading-none">
          {columnLetter(col)}
        </span>
      ))}
    </div>
  );
}

function RowLabels({ size, theme }: { size: number; theme: BoardThemeTokens }) {
  return (
    <div
      className="grid text-right text-[0.65rem] font-medium select-none"
      style={{
        gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        color: theme.coordinate,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: size }, (_, row) => (
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
export function Board({
  state,
  appearance,
  marks = [],
  readOnly = false,
  onPlay,
  onTwist,
  selected = null,
}: BoardProps) {
  const { size } = state.settings;
  const spec = VARIANT_SPECS[state.settings.variant];
  const theme = BOARD_THEMES[appearance.boardTheme];
  const stones = STONE_SETS[appearance.stoneSet];

  const last = lastMove(state);
  const lastIndex = last === null ? -1 : indexOf(size, last);
  const winningIndices = new Set(
    state.winningLine.map((point) => indexOf(size, point)),
  );
  const numbers = numberByIndex(state, appearance.showMoveNumbers);
  const live = !readOnly && state.status === GAME_STATUS.playing;
  const ghost = live ? state.toPlay : null;

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

  const gutter = appearance.showCoordinates ? LABEL_GUTTER : "0px";

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
        <ColumnLabels size={size} theme={theme} />
      ) : (
        <div />
      )}
      {appearance.showCoordinates ? (
        <RowLabels size={size} theme={theme} />
      ) : (
        <div />
      )}
      <div
        className="relative aspect-square rounded-md"
        style={{
          background: theme.surface,
          boxShadow: `0 0 0 0.4rem ${theme.frame}, 0 18px 40px -18px rgba(0,0,0,0.65)`,
        }}
      >
        <BoardLines size={size} theme={theme} quadrantSize={spec.quadrantSize} />
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {state.board.map((cell, index) => {
            const point = pointOf(size, index);
            const landing = dropping && live ? resolvePlacement(state, point) : point;
            const landingIndex = indexOf(size, landing);
            const playable = legal === null || legal.has(index);
            // In a drop game any empty cell of a column with room plays that column.
            const routed = dropping && cell === null && legal !== null && legal.has(landingIndex);
            const ownPiece = sliding && cell === state.toPlay;
            const target = destinations.has(index);
            return (
              <Intersection
                key={index}
                point={point}
                cell={cell}
                label={`${pointName(size, point)}, ${cellDescription(cell, forbidden.has(index))}`}
                isLast={index === lastIndex}
                isWinning={winningIndices.has(index)}
                ghost={playable || target ? ghost : null}
                clickable={routed || ownPiece || target}
                moveNumber={numbers.get(index) ?? null}
                mark={overlays.get(index) ?? null}
                stones={stones}
                winningColour={theme.winning}
                readOnly={readOnly}
                onPlay={onPlay}
              />
            );
          })}
        </div>
        {twisting && spec.quadrantSize !== null ? (
          <TwistControls size={size} quadrantSize={spec.quadrantSize} onTwist={onTwist} />
        ) : null}
      </div>
    </div>
  );
}
