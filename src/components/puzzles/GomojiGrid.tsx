"use client";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { LetterMark } from "@/lib/puzzles/gomoji/code";
import type { TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

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
} from "./puzzles.constants";

/** A cell's mark: English's three, and the kana version's yellow, "the word's kana here is in this one's column". */
export type CellMark = LetterMark | "kin";

/** Right kana, not quite: the wrong size, the wrong mark, or both (the kana version's arrows). */
export type CellArrow = "" | "↓" | "↑" | "↓↑";

const MARK_WORDS: Record<CellMark, string> = { hit: "in its place", near: "in the word elsewhere", kin: "the word has another kana of its column here", miss: "not in the word" };
const ARROW_WORDS: Record<Exclude<CellArrow, "">, string> = { "↓": "wrong size", "↑": "wrong mark", "↓↑": "wrong size and mark" };

/**
 * THE GOMOJI GRID: a row for every guess the word allows, on the wood every
 * puzzle is drawn on (`PuzzleBoard`). Rows already guessed show their marks;
 * the row being typed shows its letters; the rest are empty.
 *
 * Drawn in the style the player chose (`wordStyles.ts`): Othello discs in
 * squares ruled on the wood, Gomoku stones on the crossings, or letter tiles
 * on white paper. Every style carries the same letters, marks and words.
 *
 * The row being typed is a row of places: tapping one chooses it, and the one
 * waiting for a letter carries a faint ring (`WORD_FOCUS`).
 *
 * The kana version adds a yellow (`kin`), an arrow on a stone that is the
 * right kana at the wrong size or mark, and a first row given free: the grey
 * word it opens with, which is drawn like a guess and said to be a gift.
 *
 * The board is square and the grid is not — six rows of five — so the board
 * is drawn at the number of rows and the grid sits centred across it. Nothing
 * here knows the word: it draws the rows and the marks it is handed.
 */
export function GomojiGrid({
  size,
  rows,
  guesses,
  marks,
  typing,
  done,
  style,
  onChoose,
  arrows = [],
  free = 0,
}: {
  size: number;
  rows: number;
  guesses: readonly string[];
  marks: readonly (readonly CellMark[])[];
  typing: TypingRow;
  done: boolean;
  style: WordStyle;
  /** A tap on a place in the row being typed. */
  onChoose: (place: number) => void;
  /** Each guessed row's arrows, where a kana was right but not quite; none for English. */
  arrows?: readonly (readonly CellArrow[])[];
  /** How many of the first rows were played for the player, not by them: the kana version's grey word. */
  free?: number;
}) {
  const tiles = style === WORD_STYLES.tiles;
  // A board of stones is a whole board, the places in play centred on whole squares (`boardSpan`); tiles are paper.
  const span = tiles ? rows : boardSpan(size, rows);
  const left = (span - size) / 2;
  const top = tiles ? 0 : Math.floor((span - rows) / 2);
  return (
    <div className={WORD_GRID_BOX} data-testid="puzzle-grid" data-size={size} data-style={style} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={span}>
        <div className={`relative flex h-full w-full items-center justify-center ${tiles ? "bg-white" : ""}`}>
          {tiles ? null : <GridLines span={span} size={size} rows={rows} left={left} top={top} style={style} />}
          <div
            className={tiles ? "relative grid h-full gap-1 p-1" : "absolute grid"}
            style={{
              ...(tiles
                ? { width: `${(size / rows) * 100}%` }
                : { left: `${(left / span) * 100}%`, top: `${(top / span) * 100}%`, width: `${(size / span) * 100}%`, height: `${(rows / span) * 100}%` }),
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: rows }, (_, row) => {
              const guessed = guesses[row];
              const live = guessed === undefined && row === guesses.length && !done;
              const letters: ArrayLike<string> = guessed ?? (live ? typing.slots : []);
              return Array.from({ length: size }, (_, at) => {
                const letter = letters[at] ?? "";
                const mark = guessed === undefined ? null : marks[row]![at]!;
                const arrow = mark === null ? "" : (arrows[row]?.[at] ?? "");
                const label =
                  letter === ""
                    ? "empty"
                    : `${letter.toUpperCase()}${mark === null ? "" : `, ${MARK_WORDS[mark]}`}${arrow === "" ? "" : `, ${ARROW_WORDS[arrow]}`}${row < free ? ", given free" : ""}`;
                const focused = live && typing.at === at;
                const said = {
                  "data-testid": "word-tile",
                  "data-row": row,
                  "data-mark": mark ?? (letter === "" ? "empty" : "typed"),
                  "data-arrow": arrow === "" ? undefined : arrow,
                  "data-free": row < free ? "true" : undefined,
                  "data-focus": focused ? "true" : undefined,
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
                    style={WORD_STONE_LOOK[mark ?? "typed"]}
                    aria-hidden="true"
                  >
                    {letter}
                    {badge}
                  </span>
                );
                const look = tiles
                  ? `relative ${WORD_TILE} ${mark !== null ? WORD_TILE_MARK[mark] : letter !== "" ? WORD_TILE_TYPED : WORD_TILE_EMPTY} ${focused ? (letter === "" ? WORD_FOCUS.tileEmpty : WORD_FOCUS.tileFilled) : ""}`
                  : "relative flex items-center justify-center";
                // A place on the row being typed is a press; every other cell is only drawn.
                return live ? (
                  <button key={`${row}-${at}`} type="button" tabIndex={-1} onClick={() => onChoose(at)} className={`${look} cursor-pointer`} {...said}>
                    {face}
                  </button>
                ) : (
                  <div key={`${row}-${at}`} className={look} {...said}>
                    {face}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </PuzzleBoard>
    </div>
  );
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

/**
 * A WHOLE BOARD FOR A WORD: the smallest square at least as tall as the rows
 * and as wide as the word, whose spare columns split evenly either side, so the
 * places in play sit on whole squares. John, 2026-09-25, on a 3-kana board
 * ruled only where the word was: "actually show all the grid lines... the 3
 * in play should be regular dark, and the ones out of play would be lighter."
 * Five letters and six rows is a 7×7 board; four kana and seven rows, 8×8.
 */
export function boardSpan(size: number, rows: number): number {
  const span = Math.max(size, rows);
  return (span - size) % 2 === 0 ? span : span + 1;
}

/** How faint the lines out of play are beside the ones in play. */
const OUT_OF_PLAY = 0.3;

/**
 * The lines on the wood, in the board's own ink, over the whole board: an
 * Othello board's squares (every cell ruled, the edge included), or a Gomoku
 * board's lines through the middle of every cell, where its stones sit on the
 * crossings. Faint everywhere, and at full ink over the places in play.
 */
function GridLines({ span, size, rows, left, top, style }: { span: number; size: number; rows: number; left: number; top: number; style: WordStyle }) {
  const ink = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme].line;
  const othello = style === WORD_STYLES.othello;
  const width = othello ? 2 : 1.25;
  const at = othello ? 0 : 0.5;
  /* One set of lines over a rectangle of cells: `across` rows high and `down` columns wide, from (x, y). */
  const ruled = (x: number, y: number, down: number, across: number, opacity: number, key: string) => (
    <g key={key} opacity={opacity} data-testid={opacity === 1 ? "word-lines-in-play" : "word-lines-out-of-play"}>
      {Array.from({ length: othello ? across + 1 : across }, (_, row) => y + row + at).map((line) => (
        <line key={`y${line}`} x1={x + at} y1={line} x2={x + down - at} y2={line} stroke={ink} strokeWidth={width} vectorEffect="non-scaling-stroke" />
      ))}
      {Array.from({ length: othello ? down + 1 : down }, (_, col) => x + col + at).map((line) => (
        <line key={`x${line}`} x1={line} y1={y + at} x2={line} y2={y + across - at} stroke={ink} strokeWidth={width} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
  return (
    <svg viewBox={`0 0 ${span} ${span}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-testid="word-lines">
      {ruled(0, 0, span, span, OUT_OF_PLAY, "board")}
      {ruled(left, top, size, rows, 1, "play")}
    </svg>
  );
}
