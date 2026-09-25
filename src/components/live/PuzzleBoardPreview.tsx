"use client";

import { useMemo } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { playingAreaInset } from "@/components/board/margin";
import { REGION_FILLS } from "@/components/puzzles/puzzles.constants";
import { shakeRegions } from "@/lib/puzzles/jigsaw/generate";
import { decodeKiller, type Cage } from "@/lib/puzzles/killer/code";
import { generateSumCages } from "@/lib/puzzles/killer/generate";
import { cageOutline } from "@/lib/puzzles/killer/outline";
import { NUMBER_PLACE_BOXES } from "@/lib/puzzles/numberPlace/boxes";
import { boxedLayout } from "@/lib/puzzles/numberPlace/layout";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { seededRandom } from "@/lib/puzzles/random";
import { BLACK, decodeBlackAndWhite, EMPTY } from "@/lib/puzzles/blackAndWhite/code";
import { generateBlackAndWhite } from "@/lib/puzzles/blackAndWhite/generate";
import { decodeTowers, TOWER_SIDES, type TowerClues } from "@/lib/puzzles/towers/code";
import { generateTowers } from "@/lib/puzzles/towers/generate";

import { SET_UP_COPY, SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "./live.constants";
import { centredBaseline } from "@/lib/ui/svgText";

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
 * Jigsaw's regions, Diagonal's two diagonals, Hidden Stones' tinted regions,
 * the ring of clues around a Towers square, Black and White's printed stones. A Towers board is two cells wider
 * than its square, as the solve draws it (`TowerRing`), and has no letters and
 * numbers along its edges: its clues stand where they would.
 *
 * A Jigsaw's and Hidden Stones' regions are a fixed example, shaken from one
 * seed: every puzzle has its own, and the caption does not promise these.
 */
export function PuzzleBoardPreview({ kind, size }: { kind: PuzzleKind; size: number }) {
  const theme = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];
  /* Towers: the clues of a real easy puzzle at this size, from a fixed seed, in a ring one cell deep around the square. */
  const clues = useMemo<TowerClues | null>(
    () => (kind === "towers" ? (decodeTowers(generateTowers(size, "easy", 7).givens, size)?.clues ?? null) : null),
    [kind, size],
  );
  /* Black and White: the printed stones of a real easy puzzle at this size, from a fixed seed. */
  const printed = useMemo<number[] | null>(
    () => (kind === "blackAndWhite" ? decodeBlackAndWhite(generateBlackAndWhite(size, "easy", 7).givens, size) : null),
    [kind, size],
  );
  const ring = clues === null ? 0 : 1;
  const span = size + 2 * ring;
  const inset = playingAreaInset(span, true);

  /* The region every cell is drawn in, or null for a plain square (More or Less). */
  const region = useMemo<number[] | null>(() => {
    if ((kind === "numberPlace" || kind === "diagonal" || kind === "sumCages") && NUMBER_PLACE_BOXES[size] !== undefined) return boxedLayout(size).region;
    if (kind === "jigsaw" || kind === "hiddenStones") return shakeRegions(size, seededRandom(size * 7919));
    return null;
  }, [kind, size]);

  /* Sum Cages: the cages of a real easy puzzle at this size, from a fixed seed — a few milliseconds, and only a picture. */
  const cages = useMemo<Cage[] | null>(
    () => (kind === "sumCages" ? (decodeKiller(generateSumCages(size, "easy", 7).givens, size)?.cages ?? null) : null),
    [kind, size],
  );
  const cageOf = new Map<number, number>();
  (cages ?? []).forEach((cage, c) => cage.cells.forEach((index) => cageOf.set(index, c)));

  const cells = Array.from({ length: size * size }, (_, index) => index);
  const heavy = 0.08;
  const light = 0.025;

  return (
    <figure className="flex flex-col items-center gap-2" data-testid="set-up-puzzle-preview" data-kind={kind} data-size={size}>
      <div className={SET_UP_PREVIEW_BOX} aria-hidden="true">
        <BoardFrame
          size={span}
          theme={theme}
          flipped={false}
          inset={inset}
          lattice={false}
          shape="rhombus"
          coordinates={ring === 0 && DEFAULT_APPEARANCE.showCoordinates}
        >
          <svg viewBox={`0 0 ${span} ${span}`} className="absolute inset-0 h-full w-full" data-testid="puzzle-preview-grid">
            {(clues === null ? [] : TOWER_SIDES).flatMap((side) =>
              clues![side].map((clue, at) => {
                if (clue === 0) return null;
                const x = side === "left" ? 0.5 : side === "right" ? span - 0.5 : at + 1.5;
                const y = side === "top" ? 0.5 : side === "bottom" ? span - 0.5 : at + 1.5;
                return (
                  <text key={`${side}-${at}`} x={x} y={centredBaseline(y, 0.5)} fontSize={0.5} fontWeight={600} textAnchor="middle" fill={theme.line}>
                    {clue}
                  </text>
                );
              }),
            )}
            <g transform={`translate(${ring} ${ring})`}>
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
            {/* The cages, dashed a little inside their cells, as the grid a puzzle is solved on draws them (`cageOutline`). */}
            {cages !== null
              ? cageOutline(size, (index) => cageOf.get(index)).map((line, at) => (
                  <line key={`cage-${at}`} {...line} stroke={theme.line} strokeWidth={0.025} strokeDasharray="0.08 0.06" />
                ))
              : null}
            {(cages ?? []).map((cage) => {
              const first = Math.min(...cage.cells);
              return (
                <text key={`sum-${first}`} x={(first % size) + 0.16} y={Math.floor(first / size) + 0.34} fontSize={0.22} fill={theme.line}>
                  {cage.sum}
                </text>
              );
            })}
            {(printed ?? []).map((stone, index) =>
              stone === EMPTY ? null : (
                <circle
                  key={`stone-${index}`}
                  cx={(index % size) + 0.5}
                  cy={Math.floor(index / size) + 0.5}
                  r={0.33}
                  fill={stone === BLACK ? theme.line : PAPER}
                  stroke={theme.line}
                  strokeWidth={0.06}
                />
              ),
            )}
            <rect x={0} y={0} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={heavy} />
            </g>
          </svg>
        </BoardFrame>
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION}>{SET_UP_COPY.previewPuzzle(PUZZLE_DISPLAY[kind].label)}</figcaption>
    </figure>
  );
}
