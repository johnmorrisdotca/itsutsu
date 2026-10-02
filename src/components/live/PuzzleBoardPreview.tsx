"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { playingAreaInset } from "@/components/board/margin";
import { StoneMark } from "@/components/board/StoneMark";
import { PUZZLE_STONE_BOX, REGION_FILLS } from "@/components/puzzles/puzzles.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { growRegions, placeStones } from "@/lib/puzzles/hiddenStones/generate";
import { shakeRegions } from "@/lib/puzzles/jigsaw/shake";
import { decodeKiller, type Cage } from "@/lib/puzzles/killer/code";
import { cageOutline } from "@/lib/puzzles/killer/outline";
import { boxedLayout, KAZU_BOXES } from "@johnmorrisdotca/kazu";
import { PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { WORDS_A_BOARD, gomojiBoard, guessesFor } from "@/lib/puzzles/gomoji/layout";
import { emptyRow } from "@/lib/puzzles/gomoji/typingRow";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import { FeltPatches } from "@/components/board/FeltPatches";
import type { Appearance, Felt, StoneSetTokens } from "@/components/board/board.types";
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
import { generateSumCages, generateTowers } from "@/lib/puzzles/kazu";
import { BridgesGrid } from "@/components/puzzles/BridgesGrid";
import { boardOf } from "@/lib/puzzles/bridges/code";
import { generateBridges } from "@/lib/puzzles/bridges/generate";
import { PictureLogicGrid } from "@/components/puzzles/PictureLogicGrid";
import { decodeClues } from "@/lib/puzzles/pictureLogic/code";
import { generatePictureLogic } from "@/lib/puzzles/pictureLogic/generate";
import { PatiencePreview } from "@/components/puzzles/PatiencePreview";
import { SolitaireTable } from "@/components/puzzles/SolitaireTable";
import { dealKlondike, dealOfSeed, deckOf, playKlondike } from "@johnmorrisdotca/toranpu/klondike";
import { MahjongBoard, mahjongViewBox } from "@/components/puzzles/MahjongBoard";
import { useMahjongFree } from "@/components/puzzles/mahjongFree";
import { generateMahjong } from "@/lib/puzzles/mahjong/generate";
import { CubePreview } from "@/components/puzzles/CubePreview";

import { SET_UP_COPY, SET_UP_PREVIEW_BOX, SET_UP_PREVIEW_CAPTION } from "./live.constants";
import { centredBaseline } from "@/lib/ui/svgText";

/* Suido's preview is made in the browser only: a board is not worth making on the server that draws the set-up page. */
const SuidoPreview = dynamic(() => import("@/components/puzzles/SuidoPreview").then((module) => module.SuidoPreview), { ssr: false });

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
 * the ring of clues around a Towers square, Black and White's printed stones, Hidden Stones' stones in every other row — the game
 * boards' own stones (`StoneMark`), in the reader's set. A Towers board is two cells wider
 * than its square, as the solve draws it (`TowerRing`), and has no letters and
 * numbers along its edges: its clues stand where they would.
 *
 * A Jigsaw's and Hidden Stones' regions are a fixed example from one seed —
 * Hidden Stones' grown from its stones, so each region holds one: every
 * puzzle has its own, and the caption does not promise these.
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
  wordCount = 1,
}: {
  kind: PuzzleKind;
  size: number;
  /**
   * How many words a Gomoji hides: a Futago's two words side by side on one board
   * (`futago.ts`), or a Yotsugo's two boards of two quarters one over the
   * other (`yotsugo.ts`), in the same box.
   */
  wordCount?: WordCount;
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
        ) : kind === "bridges" ? (
          <BridgesPreview size={size} />
        ) : kind === "suido" ? (
          <SuidoPreview size={size} level={level ?? spec.defaultLevel} />
        ) : kind === "pictureLogic" ? (
          <PictureLogicPreview size={size} level={level ?? spec.defaultLevel} />
        ) : kind === "freecell" || kind === "spider" ? (
          <PatiencePreview kind={kind} size={size} appearance={appearance} />
        ) : spec.cards === true ? (
          <SolitairePreview draw={size} appearance={appearance} />
        ) : kind === "mahjong" ? (
          <MahjongPreview size={size} appearance={appearance} />
        ) : spec.cube === true ? (
          <CubePreview size={size} level={level ?? spec.defaultLevel} appearance={appearance} />
        ) : words === undefined ? (
          <PaperGrid kind={kind} size={size} stones={STONE_SETS[appearance.stoneSet]} />
        ) : (
          <WordGridPreview layout={words} size={size} level={level ?? spec.defaultLevel} style={style} appearance={appearance} boards={wordCount} />
        )}
      </div>
      <figcaption className={SET_UP_PREVIEW_CAPTION}>
        {spec.cards === true ? SET_UP_COPY.previewCards(PUZZLE_DISPLAY[kind].label) : kind === "mahjong" ? SET_UP_COPY.previewMahjong : SET_UP_COPY.previewPuzzle(PUZZLE_DISPLAY[kind].label)}
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
  boards,
}: {
  layout: "gomoji" | "gomojiKana";
  size: number;
  level: PuzzleLevel;
  style: WordStyle;
  appearance: Appearance;
  /** One board, a Futago's two side by side, or a Yotsugo's four quarters on two boards. */
  boards: WordCount;
}) {
  const free = layout === "gomojiKana" && level !== "hard" ? 1 : 0;
  const drawn = free + guessesFor(layout, size, level, free, boards);
  /*
   * One square box for every length, level and count of words, the boards
   * fitted inside it: one word's board, a Futago's one board of two words, or
   * a Yotsugo's two boards one over the other. Each is narrowed until the
   * whole is no taller than the box is wide, so choosing any of them moves
   * nothing under the preview.
   */
  const { cols, rows: tall } = gomojiBoard(size, boards, drawn);
  const stacked = boards === 1 ? 1 : boards / WORDS_A_BOARD;
  const fit = Math.min(1, cols / (tall * stacked));
  const firsts = Array.from({ length: stacked }, (_, board) => board * WORDS_A_BOARD);
  const part = (at: number) => ({ at, guesses: [], marks: [], done: true, found: false });
  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden">
      <div
        className="flex flex-col"
        style={{ width: `${fit * 100}%` }}
        data-testid={boards === 4 ? "set-up-yotsugo-preview" : boards === 2 ? "set-up-futago-preview" : "set-up-word-preview"}
      >
        {firsts.map((first) =>
          boards === 1 ? (
            <GomojiGrid key={first} size={size} rows={drawn} guesses={[]} marks={[]} typing={emptyRow(size)} done style={style} appearance={appearance} onChoose={NOTHING} />
          ) : (
            <GomojiGrid key={first} size={size} rows={drawn} words={boards} parts={[part(first), part(first + 1)]} typing={emptyRow(size)} done style={style} appearance={appearance} onChoose={NOTHING} />
          ),
        )}
      </div>
    </div>
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

/**
 * Bridges before it is made: the islands of a real easy puzzle at this size,
 * from a fixed seed, on the board the solve draws (`BridgesGrid`), with no
 * bridge drawn and nothing to press. A millisecond, and only a picture.
 */
function BridgesPreview({ size }: { size: number }) {
  const board = useMemo(() => boardOf(generateBridges(size, "easy", 7).givens, size), [size]);
  if (board === null) return null;
  return <BridgesGrid board={board} counts={board.spans.map(() => 0)} done readOnly />;
}

/**
 * Picture logic before it is made: the clues of a real puzzle at this size and
 * level, from a fixed seed, on the board the solve draws (`PictureLogicGrid`),
 * with nothing shaded and nothing to press. A few milliseconds, and only a
 * picture: the one to uncover is kept for the solve.
 */
function PictureLogicPreview({ size, level }: { size: number; level: PuzzleLevel }) {
  const clues = useMemo(() => decodeClues(generatePictureLogic(size, level, 7).givens, size), [size, level]);
  if (clues === null) return null;
  return <PictureLogicGrid clues={clues} cells={new Array(size * size).fill(0)} done readOnly />;
}

/**
 * Solitaire before it is dealt: a real deal from a fixed seed on the table the
 * game is played on (`SolitaireTable`), in the reader's wood, the stock turned
 * once so the waste shows one card or three as the tile chosen says. Square,
 * as the table always is, in the box every board stands in; nothing on it can
 * be pressed.
 */
function SolitairePreview({ draw, appearance }: { draw: number; appearance: Appearance }) {
  const table = useMemo(() => {
    const dealt = dealKlondike(deckOf(dealOfSeed(7))!, { draw: draw === 3 ? 3 : 1, passes: Infinity });
    return playKlondike(dealt, { kind: "draw" }) ?? dealt;
  }, [draw]);
  return <SolitaireTable table={table} theme={BOARD_THEMES[appearance.boardTheme] ?? BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} readOnly />;
}

/**
 * Mahjong before it is dealt: a real deal of this layout from a fixed seed, on
 * the board the solve draws (`MahjongBoard`), the free tiles lit or not as the
 * reader has chosen, with nothing to press. Dealt once a layout and kept, since
 * the Turtle takes a moment to deal.
 */
const MAHJONG_PREVIEWS = new Map<number, string>();
function MahjongPreview({ size, appearance }: { size: number; appearance: Appearance }) {
  const showFree = useMahjongFree();
  const box = mahjongViewBox(size);
  const cells = useMemo(() => {
    if (!MAHJONG_PREVIEWS.has(size)) MAHJONG_PREVIEWS.set(size, generateMahjong(size, "easy", 7).givens);
    return MAHJONG_PREVIEWS.get(size)!;
  }, [size]);
  return (
    // A square, whatever the layout's shape, so choosing another layout never moves the page (`e2e/set-up-steady.spec.ts`).
    <div className="flex aspect-square w-full items-center justify-center" data-testid="mahjong-preview">
      <div style={{ width: `${Math.min(1, box.width / box.height) * 100}%` }}>
        <MahjongBoard size={size} cells={cells} theme={BOARD_THEMES[appearance.boardTheme]} showFree={showFree} readOnly />
      </div>
    </div>
  );
}

/** Koushi's lattice before it is made: 21 blank tiles and four holes, in the board colour chosen under it. Nothing on it can be pressed. */
function LatticePreview({ appearance }: { appearance: Appearance }) {
  const blank = Array.from({ length: LATTICE_CELLS }, (_, cell) => (isHole(cell) ? "." : ""));
  return <KoushiGrid grid={blank} marks={blank.map(() => null)} done onPress={NOTHING} onSwap={NOTHING} appearance={appearance} />;
}

/** A puzzle written on paper: the grid, ruled at this size, inside the wood every board has. */
function PaperGrid({ kind, size, stones }: { kind: PuzzleKind; size: number; stones: StoneSetTokens }) {
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

  /* Hidden Stones: stones placed as the rules allow and regions grown from them, from a fixed seed — no solver, only a picture. */
  const hidden = useMemo<{ stones: number[]; regions: number[] } | null>(() => {
    if (kind !== "hiddenStones") return null;
    const random = seededRandom(size * 7919);
    const placed = placeStones(size, random);
    return placed === null ? null : { stones: placed, regions: growRegions(size, placed, random) };
  }, [kind, size]);

  /* The region every cell is drawn in, or null for a plain square (More or Less). */
  const region = useMemo<number[] | null>(() => {
    if ((kind === "numberPlace" || kind === "diagonal" || kind === "sumCages") && KAZU_BOXES[size] !== undefined) return boxedLayout(size).region;
    if (kind === "jigsaw") return shakeRegions(size, seededRandom(size * 7919));
    if (kind === "hiddenStones") return hidden?.regions ?? null;
    return null;
  }, [kind, size, hidden]);

  /* The stones drawn on the paper, a cell and a colour each: Black and White's printed ones, and every other row's of Hidden Stones'. */
  const drawn: { index: number; black: boolean }[] = [
    ...(printed ?? []).flatMap((stone, index) => (stone === EMPTY ? [] : [{ index, black: stone === BLACK }])),
    ...(hidden?.stones ?? []).flatMap((col, row) => (row % 2 === 0 ? [{ index: row * size + col, black: true }] : [])),
  ];

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
        <rect x={0} y={0} width={size} height={size} fill="none" stroke={theme.line} strokeWidth={heavy} />
        </g>
      </svg>
      {/* The stones over the paper, cell for cell with the grid under them: the game boards' own, which are HTML and not a drawing. */}
      {drawn.length > 0 ? (
        <div
          className="pointer-events-none absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${span}, minmax(0, 1fr))` }}
          data-testid="puzzle-preview-stones"
        >
          {drawn.map(({ index, black }) => (
            <span
              key={index}
              className="flex items-center justify-center"
              style={{ gridRow: Math.floor(index / size) + ring + 1, gridColumn: (index % size) + ring + 1 }}
              data-testid="puzzle-preview-stone"
            >
              <span className={PUZZLE_STONE_BOX}>
                <StoneMark stone={black ? STONES.black : STONES.white} stones={stones} />
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </BoardFrame>
  );
}
