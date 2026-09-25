"use client";

import { useMemo } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { playingAreaInset } from "@/components/board/margin";
import { REGION_FILLS } from "@/components/puzzles/puzzles.constants";
import { shakeRegions } from "@/lib/puzzles/jigsaw/generate";
import { NUMBER_PLACE_BOXES } from "@/lib/puzzles/numberPlace/boxes";
import { boxedLayout } from "@/lib/puzzles/numberPlace/layout";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { seededRandom } from "@/lib/puzzles/random";

import { SET_UP_COPY, SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "./live.constants";

/** The paper a puzzle is written on, inside the wood. */
const PAPER = "#ffffff";

/**
 * THE GRID THIS PUZZLE WOULD BE SOLVED ON, drawn before it is made: the set-up
 * screen's preview for a puzzle, as `BoardPreview` is for a game.
 *
 * It was a thumbnail — a screenshot of one 9×9, in a box of its own size,
 * that changed with nothing. John, 2026-09-24, beside Mini Reversi's wooden
 * board redrawing at every size: "Each image is supposed to change based on
 * size and type… the inside of the board could be white because it's a place
 * where people write. But the rest of the board should look like the rest of
 * the boards." So it is the same frame (`BoardFrame`), wood and coordinates
 * as every board, in the same box (`SET_UP_PREVIEW_BOX`) with the same kind of
 * caption, and only the playing area differs: white paper, ruled at the chosen
 * size, with what makes this puzzle this puzzle drawn on it — the boxes, a
 * Jigsaw's regions, Diagonal's two diagonals, Hidden Stones' tinted regions.
 *
 * A Jigsaw's and Hidden Stones' regions are a fixed example, shaken from one
 * seed: every puzzle has its own, and the caption does not promise these.
 */
export function PuzzleBoardPreview({ kind, size }: { kind: PuzzleKind; size: number }) {
  const theme = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];
  const inset = playingAreaInset(size, true);

  /* The region every cell is drawn in, or null for a plain square (More or Less). */
  const region = useMemo<number[] | null>(() => {
    if ((kind === "numberPlace" || kind === "diagonal") && NUMBER_PLACE_BOXES[size] !== undefined) return boxedLayout(size).region;
    if (kind === "jigsaw" || kind === "hiddenStones") return shakeRegions(size, seededRandom(size * 7919));
    return null;
  }, [kind, size]);

  const cells = Array.from({ length: size * size }, (_, index) => index);
  const heavy = 0.08;
  const light = 0.025;

  return (
    <figure className="flex flex-col items-center gap-2" data-testid="set-up-puzzle-preview" data-kind={kind} data-size={size}>
      <div className={SET_UP_PREVIEW_BOX} aria-hidden="true">
        <BoardFrame size={size} theme={theme} flipped={false} inset={inset} lattice={false} shape="rhombus" coordinates={DEFAULT_APPEARANCE.showCoordinates}>
          <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" data-testid="puzzle-preview-grid">
            <rect x={0} y={0} width={size} height={size} fill={PAPER} />
            {cells.map((index) => {
              const row = Math.floor(index / size);
              const col = index % size;
              const tinted = kind === "hiddenStones" && region !== null;
              const diagonal = kind === "diagonal" && (row === col || row + col === size - 1);
              if (!tinted && !diagonal) return null;
              return (
                <rect
                  key={index}
                  x={col}
                  y={row}
                  width={1}
                  height={1}
                  fill={tinted ? REGION_FILLS[region[index]! % REGION_FILLS.length] : "rgba(0,0,0,0.07)"}
                />
              );
            })}
            {/* The rules between cells: heavy where two regions meet, light everywhere else. */}
            {cells.map((index) => {
              const row = Math.floor(index / size);
              const col = index % size;
              return (
                <g key={index}>
                  {col > 0 ? (
                    <line
                      x1={col}
                      y1={row}
                      x2={col}
                      y2={row + 1}
                      stroke={theme.line}
                      strokeWidth={region !== null && region[index] !== region[index - 1] ? heavy : light}
                    />
                  ) : null}
                  {row > 0 ? (
                    <line
                      x1={col}
                      y1={row}
                      x2={col + 1}
                      y2={row}
                      stroke={theme.line}
                      strokeWidth={region !== null && region[index] !== region[index - size] ? heavy : light}
                    />
                  ) : null}
                </g>
              );
            })}
            <rect x={0} y={0} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={heavy} />
          </svg>
        </BoardFrame>
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION}>{SET_UP_COPY.previewPuzzle(PUZZLE_DISPLAY[kind].label)}</figcaption>
    </figure>
  );
}
