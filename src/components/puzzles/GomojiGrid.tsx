"use client";

import { BOARD_THEMES, DEFAULT_APPEARANCE, EDGE_LINE_WIDTH, FELTS, LINE_WIDTH, STAR_RADIUS } from "@/components/board/Board.constants";
import type { Appearance, BoardThemeTokens } from "@/components/board/board.types";
import { foundInPlace, type LetterMark } from "@/lib/puzzles/gomoji/code";
import { gomojiBoard } from "@/lib/puzzles/gomoji/layout";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import type { TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

import type { GridPart, WordReveal } from "./gomojiGrid.types";
import { revealAttrs } from "./wordReveal";
import { PuzzleBoard } from "./PuzzleBoard";
import {
  WORD_FOCUS,
  WORD_GRID_BOX,
  WORD_STONE,
  WORD_STONE_LOOK,
  WORD_STONE_SIZE,
  WORD_TILE,
  WORD_TILE_EMPTY,
  WORD_TILE_MARK,
  WORD_TILE_TYPED,
  wordLetterSize,
} from "./puzzles.constants";

/** A cell's mark: English's three, and the kana version's yellow, "the word's kana here is in this one's column". */
export type CellMark = LetterMark | "kin";

/** Right kana, not quite: the wrong size, the wrong mark, or both (the kana version's arrows). */
export type CellArrow = "" | "↓" | "↑" | "↓↑";

const MARK_WORDS: Record<CellMark, string> = { hit: "in its place", near: "in the word elsewhere", kin: "the word has another kana of its column here", miss: "not in the word" };
const ARROW_WORDS: Record<Exclude<CellArrow, "">, string> = { "↓": "wrong size", "↑": "wrong mark", "↓↑": "wrong size and mark" };

/**
 * The surface a GOMOJI board is drawn on. Gomoji is not a gomoku variant — it
 * has no `VariantSpec` to ask `boardThemeFor`'s `wearsFelt` about — and its
 * felt or wood choice is the one board colour picker every style of its grid
 * shares, so this reads the reader's felt choice regardless of which style
 * (Reversi, Gomoku, Tiles) the grid is drawn in. Kept local to this file
 * rather than in `components/board/appearance.ts`: that module is one of the
 * files a real game's board picture is fingerprinted against
 * (`boardArtFingerprint.ts`), and this rule has nothing to do with any of them.
 */
export function feltOrWoodTheme(appearance: Appearance): BoardThemeTokens {
  return appearance.felt !== "wood" ? FELTS[appearance.felt] : BOARD_THEMES[appearance.boardTheme];
}

/**
 * THE GOMOJI GRID: a row for every guess the word allows, on the wood every
 * puzzle is drawn on (`PuzzleBoard`). Rows already guessed show their marks;
 * the row being typed shows its letters; the rest are empty.
 *
 * Drawn in the style the player chose (`wordStyles.ts`): Reversi discs in
 * squares ruled on the wood, Gomoku stones on the crossings, or letter tiles
 * on the board's own colour. Every style carries the same letters, marks and
 * words, and every style marks its play area with a dark border (`PlayAreaBorder`).
 *
 * The row being typed is a row of places: tapping one chooses it, and the one
 * waiting for a letter carries a faint ring (`WORD_FOCUS`).
 *
 * The kana version adds a yellow (`kin`), an arrow on a stone that is the
 * right kana at the wrong size or mark, and a first row given free: the grey
 * word it opens with, which is drawn like a guess and said to be a gift.
 *
 * The board is square and the grid is not — six rows of five — so the board
 * is at least eight squares, the grid centred across it and a spare row over to
 * the top (`playPlace`). Nothing here knows the word or the level: it draws the
 * rows and the marks it is handed.
 */
export function GomojiGrid({
  size,
  rows,
  guesses = [],
  marks = [],
  typing,
  done,
  style,
  onChoose,
  arrows = [],
  free = 0,
  appearance = DEFAULT_APPEARANCE,
  parts,
  words,
  reveal = null,
}: {
  size: number;
  rows: number;
  guesses?: readonly string[];
  marks?: readonly (readonly CellMark[])[];
  typing: TypingRow;
  done: boolean;
  style: WordStyle;
  /** A tap on a place in the row being typed. */
  onChoose: (place: number) => void;
  /** Each guessed row's arrows, where a kana was right but not quite; none for English. */
  arrows?: readonly (readonly CellArrow[])[];
  /** How many of the first rows were played for the player, not by them: the kana version's grey word. */
  free?: number;
  /** The reader's board colour, chosen on the same felt patches a Reversi or Gomoku board offers (`feltOrWoodTheme`). */
  appearance?: Appearance;
  /**
   * Several words side by side on the one board, each in a play area of its
   * own with its own heavy border (a Futago's two words or a Yotsugo's quarters, `WordBoards`), in
   * place of `guesses`, `marks` and `arrows`. Left out, the board holds one word.
   */
  parts?: readonly GridPart[];
  /** How many words the puzzle hides, which decides the board's height (`gomojiBoard`): one, or with `parts` a Futago's two or a Yotsugo's four. */
  words?: WordCount;
  /** A replay step's row coming or going on the one word (`WordReveal`); several words carry theirs in `parts`. */
  reveal?: WordReveal | null;
}) {
  const tiles = style === WORD_STYLES.tiles;
  const sides: readonly GridPart[] = parts ?? [{ at: 0, guesses, marks, arrows, done, found: false, reveal }];
  const lone = parts === undefined;
  const across = size * sides.length;
  // One board for every style: as tall as the level with the most rows, the play in the middle a spare row over to the top, the words centred across on whole squares (`gomojiBoard`).
  const { cols, rows: tall, top, left } = gomojiBoard(size, words ?? (lone ? 1 : 2), rows);
  const theme = feltOrWoodTheme(appearance);
  return (
    <div className={WORD_GRID_BOX} data-testid="puzzle-grid" data-size={size} data-style={style} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={cols} rows={tall} theme={theme}>
        <div className="relative flex h-full w-full items-center justify-center">
          {tiles ? null : <GridLines cols={cols} tall={tall} size={across} rows={rows} left={left} top={top} style={style} theme={theme} />}
          {sides.map((side, at) => (
            <PlayAreaBorder key={side.at} cols={cols} tall={tall} size={size} rows={rows} left={left + at * size} top={top} style={style} theme={theme} />
          ))}
          {sides.map((side, at) => (
            <div
              key={side.at}
              className={tiles ? "absolute grid gap-[3px] p-[2px]" : "absolute grid"}
              style={{
                left: `${((left + at * size) / cols) * 100}%`,
                top: `${(top / tall) * 100}%`,
                width: `${(size / cols) * 100}%`,
                height: `${(rows / tall) * 100}%`,
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                // The letters are sized from the squares, which are this box's width over the word's letters (`WORD_LETTER`).
                containerType: "inline-size",
              }}
              {...(lone ? {} : { "data-testid": "word-part", "data-part": side.at, "data-found": side.found ? "true" : "false" })}
            >
              <PartRows side={side} size={size} rows={rows} free={free} typing={typing} style={style} onChoose={onChoose} />
            </div>
          ))}
        </div>
      </PuzzleBoard>
    </div>
  );
}

/** One word's rows on the board: its guesses marked, the row being typed while it takes one, and the rest empty. */
function PartRows({
  side,
  size,
  rows,
  free,
  typing,
  style,
  onChoose,
}: {
  side: GridPart;
  size: number;
  rows: number;
  free: number;
  typing: TypingRow;
  style: WordStyle;
  onChoose: (place: number) => void;
}) {
  const tiles = style === WORD_STYLES.tiles;
  const { guesses, done, reveal } = side;
  const letterSize = wordLetterSize(size);
  const found = foundInPlace(guesses, side.marks, size);
  return Array.from({ length: rows }, (_, row) => {
    // A row a replay step has just taken off is still drawn, leaving, until its last letter has gone.
    const leaving = reveal?.dir === "out" && reveal.row === row && guesses[row] === undefined ? (reveal.gone ?? null) : null;
    const guessed = guesses[row] ?? leaving?.guess;
    const live = guessed === undefined && row === guesses.length && !done;
    // Rows between the guesses left and the one leaving (after a long step back) are empty and never read.
    const marks = leaving ? Object.assign([...side.marks], { [row]: leaving.marks }) : side.marks;
    const arrows = leaving ? Object.assign([...(side.arrows ?? [])], { [row]: leaving.arrows }) : (side.arrows ?? []);
    const letters: ArrayLike<string> = guessed ?? (live ? typing.slots : []);
    return Array.from({ length: size }, (_, at) => {
      const letter = letters[at] ?? "";
      const mark = guessed === undefined ? null : marks[row]![at]!;
      // A letter typed where an earlier guess already found it green is drawn green at once: it cannot be anything else.
      const known = live && letter !== "" && found[at] === letter;
      const shown = mark ?? (known ? "hit" : null);
      const arrow = mark === null ? "" : (arrows[row]?.[at] ?? "");
      const label =
        letter === ""
          ? "empty"
          : `${letter.toUpperCase()}${mark === null ? "" : `, ${MARK_WORDS[mark]}`}${arrow === "" ? "" : `, ${ARROW_WORDS[arrow]}`}${row < free ? ", given free" : ""}`;
      const focused = live && typing.at === at;
      const moving = reveal?.row === row && letter !== "" ? revealAttrs(reveal.dir, at, size) : null;
      const said = {
        "data-testid": "word-tile",
        "data-row": row,
        "data-mark": mark ?? (letter === "" ? "empty" : "typed"),
        "data-arrow": arrow === "" ? undefined : arrow,
        "data-free": row < free ? "true" : undefined,
        "data-known": known ? "hit" : undefined,
        "data-focus": focused ? "true" : undefined,
        ...moving?.data,
        "aria-label": live ? `${label}, letter ${at + 1}${focused ? ", chosen" : ""}` : label,
      };
      // Inside the stone or tile, at its lower right, in its letter's colour: read with the kana, not beside it.
      const badge = arrow === "" ? null : <ArrowMark arrow={arrow} />;
      const face = tiles ? (
        <>
          {letter}
          {badge}
        </>
      ) : letter === "" ? (
        focused ? <span className={`${WORD_STONE_SIZE[style]} ${WORD_FOCUS.stoneEmpty}`} aria-hidden="true" /> : null
      ) : (
        <span
          className={`relative ${WORD_STONE} ${WORD_STONE_SIZE[style]} ${focused ? WORD_FOCUS.stoneFilled : ""}`}
          style={{ ...WORD_STONE_LOOK[shown ?? "typed"], fontSize: letterSize }}
          aria-hidden="true"
        >
          {letter}
          {badge}
        </span>
      );
      const look = tiles
        ? `relative ${WORD_TILE} ${shown !== null ? WORD_TILE_MARK[shown] : letter !== "" ? WORD_TILE_TYPED : WORD_TILE_EMPTY} ${focused ? (letter === "" ? WORD_FOCUS.tileEmpty : WORD_FOCUS.tileFilled) : ""}`
        : "relative flex items-center justify-center";
      // A place on the row being typed is a press; every other cell is only drawn.
      return live ? (
        <button key={`${row}-${at}`} type="button" tabIndex={-1} onClick={() => onChoose(at)} className={`${look} cursor-pointer`} style={tiles ? { fontSize: letterSize, ...moving?.style } : moving?.style} {...said}>
          {face}
        </button>
      ) : (
        <div key={`${row}-${at}`} className={look} style={tiles ? { fontSize: letterSize, ...moving?.style } : moving?.style} {...said}>
          {face}
        </div>
      );
    });
  });
}

/**
 * The kana version's arrow, drawn rather than typed: a thin "↑" in a text face
 * is a speck on a stone, and the arrow is half of what the stone says. Scaled
 * to the stone, bold, in the letter's colour; down for the wrong size, up for
 * the wrong mark, both side by side for both.
 */
function ArrowMark({ arrow }: { arrow: Exclude<CellArrow, ""> }) {
  const ways = arrow === "↓↑" ? (["down", "up"] as const) : arrow === "↓" ? (["down"] as const) : (["up"] as const);
  return (
    <span className="absolute right-[4%] bottom-[4%] flex h-[38%] gap-[1px]" aria-hidden="true" data-testid="word-arrow">
      {ways.map((way) => (
        <svg key={way} viewBox="0 0 10 12" className="h-full w-auto" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d={way === "up" ? "M5 11 V1.8 M1.4 5.2 L5 1.6 L8.6 5.2" : "M5 1 V10.2 M1.4 6.8 L5 10.4 L8.6 6.8"} />
        </svg>
      ))}
    </span>
  );
}

/** How faint the lines out of play are beside the ones in play. */
const OUT_OF_PLAY = 0.3;

/**
 * How much heavier a board's outer line is drawn than the grid inside it —
 * the same ratio a real board draws its edge at (`EDGE_LINE_WIDTH` over
 * `LINE_WIDTH`), carried over to the play area's own border here.
 */
const EDGE_WEIGHT = EDGE_LINE_WIDTH / LINE_WIDTH;

/**
 * The lines on the wood, in the board's own ink, over the whole board: an
 * Reversi board's squares (every cell ruled, the edge included), or a Gomoku
 * board's lines through the middle of every cell, where its stones sit on the
 * crossings. Faint everywhere, and at full ink over the places in play. Not
 * drawn for Tiles, whose letters sit on the board's plain colour with no
 * ruling under them.
 */
function GridLines({ cols, tall, size, rows, left, top, style, theme }: { cols: number; tall: number; size: number; rows: number; left: number; top: number; style: WordStyle; theme: BoardThemeTokens }) {
  const ink = theme.line;
  const reversi = style === WORD_STYLES.reversi;
  const width = reversi ? 2 : 1.25;
  const at = reversi ? 0 : 0.5;
  /* One set of lines over a rectangle of cells: `across` rows high and `down` columns wide, from (x, y). */
  const ruled = (x: number, y: number, down: number, across: number, opacity: number, key: string) => (
    <g key={key} opacity={opacity} data-testid={opacity === 1 ? "word-lines-in-play" : "word-lines-out-of-play"}>
      {Array.from({ length: reversi ? across + 1 : across }, (_, row) => y + row + at).map((line) => (
        <line key={`y${line}`} x1={x + at} y1={line} x2={x + down - at} y2={line} stroke={ink} strokeWidth={width} vectorEffect="non-scaling-stroke" />
      ))}
      {Array.from({ length: reversi ? down + 1 : down }, (_, col) => x + col + at).map((line) => (
        <line key={`x${line}`} x1={line} y1={y + at} x2={line} y2={y + across - at} stroke={ink} strokeWidth={width} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
  return (
    <svg viewBox={`0 0 ${cols} ${tall}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-testid="word-lines">
      {ruled(0, 0, cols, tall, OUT_OF_PLAY, "board")}
      {ruled(left, top, size, rows, 1, "play")}
    </svg>
  );
}

/**
 * THE PLAY AREA'S OWN DARK BORDER, in every style — Reversi's squares, Tiles'
 * letters on the board's own colour, Gomoku's crossings — as heavy as the
 * outer line of a real board of that style. John, 2026-09-25, first about the
 * Gomoku style beside a real Gomoku board, then: "Add the Border for the
 * Reversi mode as well", with Tiles' own white box given up for the board's
 * plain colour in the same finding — so the border is what marks the play
 * area out on every style now, not a box.
 *
 * IN THE GOMOKU STYLE ONLY, its four corners also carry the star-point dots a
 * real Gomoku board marks its bearings with — the first guess row's two
 * corners and the last guess row's two — so a player can see at a glance
 * where the word starts and where the guesses run out. Reversi and Tiles keep
 * no star points, because neither game's own board has one.
 */
function PlayAreaBorder({ cols, tall, size, rows, left, top, style, theme }: { cols: number; tall: number; size: number; rows: number; left: number; top: number; style: WordStyle; theme: BoardThemeTokens }) {
  const gomoku = style === WORD_STYLES.gomoku;
  // Gomoku's play area is bounded by its crossings (`at`, one short of the letter and guess counts); Reversi and Tiles by the cell edges (the counts themselves).
  const at = gomoku ? 0.5 : 0;
  const width = gomoku ? size - 1 : size;
  const height = gomoku ? rows - 1 : rows;
  // Reversi already rules every cell at this weight; Tiles rules nothing, so its border reads at the same weight a flat square style would.
  const base = lineWeightFor(style);
  const corners: readonly [number, number][] = gomoku
    ? [
        [left, top],
        [left + size - 1, top],
        [left, top + rows - 1],
        [left + size - 1, top + rows - 1],
      ]
    : [];
  return (
    <svg viewBox={`0 0 ${cols} ${tall}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-testid="word-play-area">
      <rect
        x={left + at}
        y={top + at}
        width={width}
        height={height}
        fill="none"
        stroke={theme.line}
        strokeWidth={base * EDGE_WEIGHT}
        vectorEffect="non-scaling-stroke"
        data-testid="word-play-border"
      />
      {corners.map(([col, row]) => (
        <circle key={`star-${col}-${row}`} cx={col + at} cy={row + at} r={STAR_RADIUS} fill={theme.star} data-testid="word-star-point" />
      ))}
    </svg>
  );
}

/** The line weight a style's own board rules at: Reversi's and Tiles' cell weight, or Gomoku's crossing weight. */
function lineWeightFor(style: WordStyle): number {
  return style === WORD_STYLES.gomoku ? 1.25 : 2;
}
