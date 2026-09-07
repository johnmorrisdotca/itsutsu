"use client";

import { indexOf, lastMove, pointOf } from "@/lib/gomoku/engine";
import { BLOCKED, GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { columnLetter, pointName, rowNumber } from "@/lib/gomoku/notation";
import type { Cell, GameState } from "@/lib/gomoku/gomoku.types";
import { BOARD_THEMES, LABEL_GUTTER, STONE_SETS } from "./Board.constants";
import { BoardLines } from "./BoardLines";
import { Intersection } from "./Intersection";
import type { BoardMark, BoardProps, BoardThemeTokens } from "./board.types";

function cellDescription(cell: Cell): string {
  if (cell === BLOCKED) return "blocked";
  return cell === null ? "empty" : `${STONE_DISPLAY[cell].label} stone`;
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
}: BoardProps) {
  const { size } = state.settings;
  const theme = BOARD_THEMES[appearance.boardTheme];
  const stones = STONE_SETS[appearance.stoneSet];

  const last = lastMove(state);
  const lastIndex = last === null ? -1 : indexOf(size, last);
  const winningIndices = new Set(
    state.winningLine.map((point) => indexOf(size, point)),
  );
  const numbers = numberByIndex(state, appearance.showMoveNumbers);
  const overlays = markByIndex(size, marks);
  const ghost =
    !readOnly && state.status === GAME_STATUS.playing ? state.toPlay : null;

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
        <BoardLines size={size} theme={theme} />
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {state.board.map((cell, index) => {
            const point = pointOf(size, index);
            return (
              <Intersection
                key={index}
                point={point}
                cell={cell}
                label={`${pointName(size, point)}, ${cellDescription(cell)}`}
                isLast={index === lastIndex}
                isWinning={winningIndices.has(index)}
                ghost={ghost}
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
      </div>
    </div>
  );
}
