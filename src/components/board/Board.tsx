"use client";

import { indexOf, lastMove, pointOf } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { columnLetter, pointName, rowNumber } from "@/lib/gomoku/notation";
import type { Cell } from "@/lib/gomoku/gomoku.types";
import { BOARD_SURFACE_CLASS, LABEL_GUTTER } from "./Board.constants";
import { BoardLines } from "./BoardLines";
import { Intersection } from "./Intersection";
import type { BoardProps } from "./board.types";

function cellDescription(cell: Cell): string {
  return cell === null ? "empty" : `${STONE_DISPLAY[cell].label} stone`;
}

function ColumnLabels({ size }: { size: number }) {
  return (
    <div
      className="grid text-center text-xs text-zinc-500 select-none"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: size }, (_, col) => (
        <span key={col} className="self-end leading-none pb-1">
          {columnLetter(col)}
        </span>
      ))}
    </div>
  );
}

function RowLabels({ size }: { size: number }) {
  return (
    <div
      className="grid text-right text-xs text-zinc-500 select-none"
      style={{ gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
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

/**
 * The playing surface: coordinate gutters, the wooden board with its lines,
 * and one button per intersection laid over the lines.
 */
export function Board({ state, onPlay }: BoardProps) {
  const { size } = state.settings;
  const last = lastMove(state);
  const lastIndex = last === null ? -1 : indexOf(size, last);
  const winningIndices = new Set(
    state.winningLine.map((point) => indexOf(size, point)),
  );
  const ghost = state.status === GAME_STATUS.playing ? state.toPlay : null;

  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: `${LABEL_GUTTER} minmax(0, 1fr)`,
        gridTemplateRows: `${LABEL_GUTTER} auto`,
      }}
    >
      <div />
      <ColumnLabels size={size} />
      <RowLabels size={size} />
      <div
        className={`relative aspect-square rounded-sm shadow-lg ${BOARD_SURFACE_CLASS}`}
      >
        <BoardLines size={size} />
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
                onPlay={onPlay}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
