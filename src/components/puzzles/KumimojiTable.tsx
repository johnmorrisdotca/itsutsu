"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type Ref } from "react";

import { BOARD_THEMES, FELTS } from "@/components/board/Board.constants";
import type { Appearance, BoardThemeTokens } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { placeOf, squareAt, type Tiles } from "@/lib/puzzles/kumimoji/grid";
import { TABLE, edgePan, fitView, keepInReach, panView, tableArea, zoomView, type View } from "@/lib/puzzles/kumimoji/tableView";

import { TABLE_BOX, TABLE_CURSOR, TABLE_PAD, TABLE_PAD_KEY, TABLE_RULING, TABLE_SQUARE, TILE, TILE_APART, TILE_CHOSEN, TILE_MISSPELT, tileLetterPx } from "./kumimoji.constants";
import { useWordStyle } from "./WordStyleContext";

/** What the solve asks of the table while a tile is dragged: pan toward the edge it is held near. */
export type TableHandle = { nudge: (clientX: number, clientY: number) => void };

const NONE: ReadonlySet<string> = new Set();

/**
 * The colour the table is drawn in: the reader's felt where they chose one,
 * else their board's wood — the one board-colour choice Gomoji's grid reads
 * too (its own `feltOrWoodTheme`, kept apart from the fingerprinted board files).
 */
export function tableTheme(appearance: Appearance): BoardThemeTokens {
  return appearance.felt !== "wood" ? FELTS[appearance.felt] : BOARD_THEMES[appearance.boardTheme];
}

/**
 * WHICH BOARD THE TABLE IS. John, 2026-09-26: the table was "a Gomoku board of
 * dots"; he wants "the Reversi board (squares) as the default, with Gomoku a
 * choice, as Gomoji offers board styles". So it reads the same choice Gomoji's
 * grid does (`useWordStyle`, kept on the account): Gomoku rules lines through
 * the squares' middles, so a tile sits on a crossing; anything else is the
 * Reversi board, ruled on the squares' edges. Gomoji's third style, Tiles, is
 * what every Kumimoji tile already is, so it reads as Reversi here.
 */
export type TableBoard = "reversi" | "gomoku";

/** The two boards a Kumimoji offers, for its picker (`WordStylePicker`). */
export const TABLE_BOARDS = [WORD_STYLES.reversi, WORD_STYLES.gomoku] as const;

/** The board lines as one repeating layer, moved with the view: on the squares' edges, or through their middles for Gomoku. */
function ruling(board: TableBoard, tile: number, x: number, y: number, line: string): CSSProperties {
  const shift = board === "gomoku" ? tile / 2 : 0;
  return {
    backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
    backgroundSize: `${tile}px ${tile}px`,
    backgroundPosition: `${x + shift}px ${y + shift}px`,
    opacity: 0.5,
  };
}

/** The pad's keys, three to a row: zoom in, up, zoom out; left, right; down. */
const PAD = [
  { key: "in", glyph: "+", label: "Zoom in" },
  { key: "up", glyph: "↑", label: "Move the view up" },
  { key: "out", glyph: "−", label: "Zoom out" },
  { key: "left", glyph: "←", label: "Move the view left" },
  null,
  { key: "right", glyph: "→", label: "Move the view right" },
  null,
  { key: "down", glyph: "↓", label: "Move the view down" },
  null,
] as const;
type PadKey = "in" | "out" | "up" | "down" | "left" | "right";

/** How far one press of the pad moves the view: a quarter of the box, and never less than two tiles. */
function padStep(tile: number, width: number, height: number): number {
  return Math.max(tile * 2, Math.round(Math.min(width, height) / 4));
}

/** The least a tile is drawn on a table nobody presses: a whole finished grid fits its box. */
const PICTURE_LEAST = 6;

/**
 * THE TABLE A KUMIMOJI IS BUILT ON: no board, no edge, no coordinates. John,
 * 2026-09-26: "there is no board in the real world game." What is drawn is the
 * tiles' own extent and two empty squares all round (`tableArea`), on the
 * player's board colour, and it fits itself to the screen as the grid grows
 * (`fitView`) — never drawing a tile smaller than a thumb, past which it pans.
 *
 * Pinch or wheel to zoom, drag the empty table to pan, all confined to this
 * box (`touch-action: none` here and nowhere else, so the page itself never
 * zooms); Fit snaps back to the whole crossword and follows it again. The view
 * is this component's alone: the tiles are where the game put them.
 *
 * Read-only, it is a picture of a grid — the finished puzzle, the set-up
 * preview, the catalogue's screenshot — fitted to its box and pressed by nobody.
 */
export function KumimojiTable({
  tiles,
  theme,
  misspelt = NONE,
  apart = NONE,
  chosen = null,
  cursor = null,
  readOnly = false,
  onSquare,
  onTileDown,
  boxClass = TABLE_BOX,
  handle,
}: {
  tiles: Tiles;
  theme: BoardThemeTokens;
  misspelt?: ReadonlySet<string>;
  apart?: ReadonlySet<string>;
  /** The tile chosen to move, by its square. */
  chosen?: string | null;
  /** The square a typed letter goes to, and which way the typing runs. */
  cursor?: { square: string; across: boolean } | null;
  readOnly?: boolean;
  /** A tap on a square, with a tile on it or not. */
  onSquare?: (square: string) => void;
  /** A press on a tile, which may become a drag. */
  onTileDown?: (square: string, letter: string, event: ReactPointerEvent) => void;
  boxClass?: string;
  handle?: Ref<TableHandle>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const board: TableBoard = useWordStyle().style === WORD_STYLES.gomoku ? "gomoku" : "reversi";
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fitted, setFitted] = useState(true);
  const [free, setFree] = useState<View | null>(null);

  useEffect(() => {
    const element = box.current;
    if (element === null) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const watcher = new ResizeObserver(measure);
    watcher.observe(element);
    return () => watcher.disconnect();
  }, []);

  const area = useMemo(() => tableArea(tiles, cursor === null ? [] : [cursor.square]), [tiles, cursor]);
  const view = useMemo(() => {
    if (size.width === 0) return null;
    if (fitted || free === null) return fitView(area, size.width, size.height, readOnly ? PICTURE_LEAST : TABLE.tileLeast);
    return keepInReach(free, area, size.width, size.height);
  }, [area, size, fitted, free, readOnly]);
  const shown = useRef(view);
  useEffect(() => {
    shown.current = view;
  });

  /** A gesture's change to the view: from here on the player's own, until Fit. */
  const change = useCallback((next: (view: View) => View) => {
    const now = shown.current;
    if (now === null) return;
    setFree(next(now));
    setFitted(false);
  }, []);

  /*
   * A dragged tile held near an edge pans the table that way — once it has
   * stayed there a moment (`TABLE.edgeDwellMs`), so a tile brought up from the
   * tray, which has to cross the bottom edge to get in, does not scroll the
   * table out from under the square it is going to.
   */
  const edgeSince = useRef<number | null>(null);
  const edgeLast = useRef(0);
  useImperativeHandle(
    handle,
    () => ({
      nudge: (clientX, clientY) => {
        const element = box.current;
        if (element === null) return;
        const rect = element.getBoundingClientRect();
        const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        const { dx, dy } = inside ? edgePan(clientX - rect.left, clientY - rect.top, rect.width, rect.height) : { dx: 0, dy: 0 };
        if (dx === 0 && dy === 0) {
          edgeSince.current = null;
          return;
        }
        const now = performance.now();
        // A nudge a moment after the last is the same hold; a longer gap is a new drag, whose dwell starts again.
        if (edgeSince.current === null || now - edgeLast.current > 100) edgeSince.current = now;
        edgeLast.current = now;
        if (now - edgeSince.current >= TABLE.edgeDwellMs) change((view) => panView(view, dx, dy));
      },
    }),
    [change],
  );

  /* Pinch and pan, on the empty table: every pointer down on it, tracked on the window until it is lifted. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const travel = useRef(0);
  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    // A new gesture: whatever the last one was, this press is a tap until it moves.
    if (pointers.current.size === 0) {
      moved.current = false;
      travel.current = 0;
    }
    if (readOnly || (event.target instanceof Element && event.target.closest("[data-tile], button[data-fit], [data-pad]") !== null)) return;
    const rect = box.current!.getBoundingClientRect();
    const at = (e: PointerEvent | ReactPointerEvent) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const id = event.pointerId;
    pointers.current.set(id, at(event));
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id || !pointers.current.has(id)) return;
      const before = [...pointers.current.values()];
      const was = pointers.current.get(id)!;
      const now = at(e);
      pointers.current.set(id, now);
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
        const [a0, b0] = before as [{ x: number; y: number }, { x: number; y: number }];
        const span = Math.hypot(a.x - b.x, a.y - b.y);
        const span0 = Math.hypot(a0.x - b0.x, a0.y - b0.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
        moved.current = true;
        change((view) => panView(zoomView(view, span0 > 0 ? span / span0 : 1, mid.x, mid.y), mid.x - mid0.x, mid.y - mid0.y));
        return;
      }
      // One pointer: a pan, once it has gone far enough not to be a shaky tap.
      travel.current += Math.hypot(now.x - was.x, now.y - was.y);
      if (travel.current < 4) return;
      moved.current = true;
      change((view) => panView(view, now.x - was.x, now.y - was.y));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      pointers.current.delete(id);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* The wheel, or a trackpad's pinch (a wheel with Ctrl held), zooms about the pointer; never the page. */
  useEffect(() => {
    const element = box.current;
    if (element === null || readOnly) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
      change((view) => zoomView(view, factor, event.clientX - rect.left, event.clientY - rect.top));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [readOnly, change]);

  /* The pad: a pan by a step, or a zoom about the middle of the box, as the wheel zooms about the pointer. */
  const press = (key: PadKey) => {
    const step = padStep(shown.current?.tile ?? TABLE.tileLeast, size.width, size.height);
    const moves: Record<PadKey, (view: View) => View> = {
      in: (view) => zoomView(view, 1.25, size.width / 2, size.height / 2),
      out: (view) => zoomView(view, 0.8, size.width / 2, size.height / 2),
      up: (view) => panView(view, 0, step),
      down: (view) => panView(view, 0, -step),
      left: (view) => panView(view, step, 0),
      right: (view) => panView(view, -step, 0),
    };
    change(moves[key]);
  };

  const squares = useMemo(() => {
    const all: string[] = [];
    for (let row = area.top; row < area.top + area.rows; row += 1) for (let col = area.left; col < area.left + area.cols; col += 1) all.push(squareAt(row, col));
    return all;
  }, [area]);

  return (
    <div
      ref={box}
      className={boxClass}
      style={{ background: theme.surface }}
      onPointerDown={down}
      // A pan that ends over a square is not a tap on it.
      onClickCapture={(event) => {
        if (moved.current && pointers.current.size === 0 && !(event.target instanceof Element && event.target.closest("button[data-fit], [data-pad]"))) {
          moved.current = false;
          event.stopPropagation();
        }
      }}
      data-testid="kumimoji-table"
      data-fitted={fitted ? "true" : "false"}
      data-tile-px={view?.tile ?? 0}
      data-cols={area.cols}
      data-rows={area.rows}
      data-board={board}
    >
      {view === null ? null : (
        <>
          <div className={TABLE_RULING} style={ruling(board, view.tile, view.x, view.y, theme.line)} data-testid="kumimoji-ruling" />
          {/* The tiles' extent and its margin: drawn as nothing, since the board is everywhere, and kept for the catalogue's picture of it. */}
          <div
            className="pointer-events-none absolute"
            style={{ left: view.x + area.left * view.tile, top: view.y + area.top * view.tile, width: area.cols * view.tile, height: area.rows * view.tile }}
            data-testid="kumimoji-area"
          />
          {squares.map((square) => {
            const { row, col } = placeOf(square);
            const letter = tiles.get(square);
            const place = { left: view.x + col * view.tile, top: view.y + row * view.tile, width: view.tile, height: view.tile };
            const typing = cursor !== null && cursor.square === square;
            if (letter === undefined) {
              if (readOnly) return null;
              return (
                <button
                  key={square}
                  type="button"
                  tabIndex={-1}
                  className={TABLE_SQUARE}
                  style={place}
                  onClick={() => onSquare?.(square)}
                  data-square={square}
                  data-testid="kumimoji-square"
                  aria-label={`empty square${typing ? `, typing ${cursor!.across ? "across" : "down"}` : ""}`}
                >
                  {typing ? (
                    <span className={`${TABLE_CURSOR} flex size-[88%] items-center justify-center text-ink/60`} style={{ fontSize: view.tile * 0.4 }}>
                      {cursor!.across ? "→" : "↓"}
                    </span>
                  ) : null}
                </button>
              );
            }
            const mark = misspelt.has(square) ? "misspelt" : apart.has(square) ? "apart" : "ok";
            const look = `${TILE} ${mark === "misspelt" ? TILE_MISSPELT : mark === "apart" ? TILE_APART : ""} ${chosen === square ? TILE_CHOSEN : ""} ${typing ? "outline-2 outline-offset-1 outline-moss" : ""}`;
            const face = { width: view.tile * 0.92, height: view.tile * 0.92, fontSize: tileLetterPx(view.tile) };
            /*
             * A table nobody presses still says where each tile stands. The last
             * tile of a game finishes it, and the table turns read-only in the
             * same moment: a tile that lost its square then read as never laid,
             * to anything asking where it went (the browser test did, about one
             * run in fifteen on the production build).
             */
            return readOnly ? (
              <div key={square} className="absolute flex items-center justify-center" style={place} data-testid="kumimoji-tile" data-square={square} data-letter={letter} data-mark={mark}>
                <span className={look} style={face}>
                  {letter}
                </span>
              </div>
            ) : (
              <button
                key={square}
                type="button"
                className="absolute flex touch-none items-center justify-center outline-none"
                style={place}
                onClick={() => onSquare?.(square)}
                onPointerDown={(event) => onTileDown?.(square, letter, event)}
                data-square={square}
                data-tile="true"
                data-testid="kumimoji-tile"
                data-letter={letter}
                data-mark={mark}
                data-chosen={chosen === square ? "true" : undefined}
                aria-label={`${letter.toUpperCase()}${mark === "misspelt" ? ", in a line that is not a word" : mark === "apart" ? ", not joined to the rest" : ""}${chosen === square ? ", chosen" : ""}`}
              >
                <span className={look} style={face}>
                  {letter}
                </span>
              </button>
            );
          })}
        </>
      )}
      {readOnly ? null : (
        <button
          type="button"
          className={`${BUTTON_BASE} ${BUTTON_QUIET} absolute top-2 right-2 z-10 min-h-9 px-3 py-1 text-xs shadow-sm`}
          onClick={() => setFitted(true)}
          aria-pressed={fitted}
          data-fit="true"
          data-testid="kumimoji-fit"
        >
          Fit <span className="font-mincho opacity-70">全体</span>
        </button>
      )}
      {readOnly ? null : (
        /*
         * THE PAD, under Fit. John, 2026-09-26: "the mouse wheel zooms the table
         * nicely, but there are no controls on the page". Buttons, so a finger
         * and a keyboard both reach them; a press is a gesture like any other,
         * so the view is the player's own until Fit.
         */
        <div className={TABLE_PAD} role="group" aria-label="Move and zoom the table" data-pad="true" data-testid="kumimoji-pad">
          {PAD.map((each, at) =>
            each === null ? (
              <span key={at} aria-hidden="true" />
            ) : (
              <button key={each.key} type="button" className={TABLE_PAD_KEY} onClick={() => press(each.key)} aria-label={each.label} title={each.label} data-testid={`kumimoji-pad-${each.key}`}>
                {each.glyph}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
