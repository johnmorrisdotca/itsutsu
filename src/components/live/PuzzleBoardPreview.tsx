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
import { PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import { emptyRow } from "@/lib/puzzles/gomoji/typingRow";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import { FeltPatches } from "@/components/board/FeltPatches";
import type { Appearance, Felt } from "@/components/board/board.types";
import { GomojiGrid } from "@/components/puzzles/GomojiGrid";
import { KumimojiTable, tableTheme } from "@/components/puzzles/KumimojiTable";
import { TILE_PICTURE_BOX } from "@/components/puzzles/kumimoji.constants";
import { decodeGrid } from "@/lib/puzzles/kumimoji/grid";
import { KoushiGrid } from "@/components/puzzles/KoushiGrid";
import { LATTICE_CELLS, isHole } from "@/lib/puzzles/koushi/lattice";
import { useWordStyle } from "@/components/puzzles/WordStyleContext";
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
 *
 * A Gomoji is written on the board itself, not on paper, so its preview is its
 * own board with nothing typed (`GomojiGrid`), and the board's colour is chosen
 * on the patches under it, as a Reversi's is. John, 2026-09-25, at a Gomoji
 * set-up with sizes and options and no board: "Show the Preview Board too.
 * And the Board colour options."
 */
export function PuzzleBoardPreview({
  kind,
  size,
  level,
  appearance = DEFAULT_APPEARANCE,
  onFelt,
}: {
  kind: PuzzleKind;
  size: number;
  /** The level chosen, where it changes the board: a Gomoji's guesses are its rows. The kind's own level when left out. */
  level?: PuzzleLevel;
  /** The reader's board, so a puzzle drawn on the board itself shows the colour they chose. */
  appearance?: Appearance;
  /** Choosing that colour on the patches under the preview, as a game's set-up does (`BoardPreview`); none where it cannot be chosen. */
  onFelt?: (felt: Felt) => void;
}) {
  const spec = PUZZLE_SPECS[kind];
  const words = spec.wordGrid;
  // A lattice is drawn on the board as a word grid is, with the board's colour chosen under it.
  const onBoard = words !== undefined || spec.lattice === true;
  const { style } = useWordStyle();
  return (
    <figure className="flex flex-col items-center gap-2" data-testid="set-up-puzzle-preview" data-kind={kind} data-size={size}>
      <div className={SET_UP_PREVIEW_BOX} aria-hidden="true">
        {spec.tiles === true ? (
          <TilePreview size={size} appearance={appearance} />
        ) : spec.lattice === true ? (
          <LatticePreview appearance={appearance} />
        ) : words === undefined ? (
          <PaperGrid kind={kind} size={size} />
        ) : (
          <WordGridPreview layout={words} size={size} level={level ?? spec.defaultLevel} style={style} appearance={appearance} />
        )}
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION}>
        {SET_UP_COPY.previewPuzzle(PUZZLE_DISPLAY[kind].label)}
        {/* The board's colour, in the room the caption keeps, as under a Reversi's preview: only where the puzzle is drawn on the board itself. */}
        {(!onBoard && spec.tiles !== true) || onFelt === undefined ? null : (
          <span className="mt-1 block">
            <FeltPatches felt={appearance.felt} wood={appearance.boardTheme} onChoose={onFelt} />
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * A Gomoji's board as the solve will draw it (`GomojiGrid`), before a letter
 * is typed: its rows at this length and level — the kana version's free grey
 * word among them where the level gives one — in the style the reader plays
 * it in. Nothing on it can be pressed: `done` is the grid's readOnly, drawing
 * no row as the one being typed, so no place on it is a button. In the board
 * colour chosen under it, as the solve will be.
 */
function WordGridPreview({
  layout,
  size,
  level,
  style,
  appearance,
}: {
  layout: "gomoji" | "gomojiKana";
  size: number;
  level: PuzzleLevel;
  style: WordStyle;
  appearance: Appearance;
}) {
  const free = layout === "gomojiKana" && level !== "hard" ? 1 : 0;
  return (
    <GomojiGrid
      size={size}
      rows={free + guessesFor(layout, size, level, free)}
      guesses={[]}
      marks={[]}
      typing={emptyRow(size)}
      done
      style={style}
      appearance={appearance}
      onChoose={NOTHING}
    />
  );
}

const NOTHING = () => undefined;

/**
 * A Kumimoji's first hand laid out, on its table in the reader's colour: one
 * small crossword of exactly the hand's tiles, WORD and GRID for seven, and
 * SWAN and NOD beside them for eleven. An example, not the game's own tiles,
 * which are dealt from the word list the set-up screen does not load.
 */
const TILE_EXAMPLES: Record<number, string> = { 3: "cat", 7: "2g/word/2i/2d", 11: "s1g/word/a1i/nod" };

function TilePreview({ size, appearance }: { size: number; appearance: Appearance }) {
  const tiles = useMemo(() => decodeGrid(TILE_EXAMPLES[size] ?? "") ?? new Map<string, string>(), [size]);
  return <KumimojiTable tiles={tiles} theme={tableTheme(appearance)} readOnly boxClass={TILE_PICTURE_BOX} />;
}

/** Koushi's lattice before it is made: 21 blank tiles and four holes, in the board colour chosen under it. Nothing on it can be pressed. */
function LatticePreview({ appearance }: { appearance: Appearance }) {
  const blank = Array.from({ length: LATTICE_CELLS }, (_, cell) => (isHole(cell) ? "." : ""));
  return <KoushiGrid grid={blank} marks={blank.map(() => null)} done onPress={NOTHING} onSwap={NOTHING} appearance={appearance} />;
}

/** A puzzle written on paper: the grid, ruled at this size, inside the wood every board has. */
function PaperGrid({ kind, size }: { kind: PuzzleKind; size: number }) {
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
  );
}
