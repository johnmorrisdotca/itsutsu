import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";

import type { GridVerdict, Tiles } from "./grid.ts";
import { boardModel } from "./ui/board.ts";
import { mountKumimoji, type KumimojiTableOptions } from "./ui/mount.ts";

const TILE: CSSProperties = {
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  background: "#f3e6c8",
  color: "#2a2118",
  fontWeight: 700,
  boxShadow: "0 2px 0 rgba(0,0,0,.35)",
};

export type KumimojiBoardProps = {
  tiles: Tiles;
  /** From `judgeWithWords`: marks the runs that are not words and the tiles apart. Without it, no marks. */
  verdict?: GridVerdict | null;
  /** What to print on a tile: `words.glyphOf` for the language played. */
  glyphOf?: (tile: string) => string;
  /** A square pressed, empty or not. Without it the board is only a picture. */
  onSquare?: (square: string) => void;
  /** A square to ring, such as the one holding a tile picked up. */
  held?: string | null;
  /** The side of a square in pixels. */
  square?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "onClick">;

/**
 * A KUMIMOJI TABLE, AS A REACT COMPONENT: the tiles of a grid with a margin
 * of empty squares round them, a run that is not a word ringed red and a tile
 * apart from the crossword faded, and a press on any square reported by its
 * key (`squareAt(row, col)`). It draws; what a press does is yours to decide
 * with `placeFromHand`, `moveOnTable` and the rest.
 */
export function KumimojiBoard({ tiles, verdict = null, glyphOf, onSquare, held = null, square = 36, style, ...element }: KumimojiBoardProps) {
  const model = boardModel(tiles, verdict, glyphOf);
  return (
    <div role="grid" style={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(${model.cols}, ${square}px)`, width: "max-content", ...style }} {...element}>
      {model.squares.map((cell) => {
        const ring = cell.square === held ? "0 0 0 3px #ffcf3f" : cell.mark === "misspelt" ? "0 0 0 3px #d9534f inset" : undefined;
        const look: CSSProperties =
          cell.tile === null
            ? { width: square, height: square, borderRadius: 5, background: "rgba(127,127,127,.18)", boxShadow: ring }
            : { ...TILE, width: square, height: square, fontSize: square * 0.55, background: cell.wild ? "#f6d27a" : TILE.background, opacity: cell.mark === "apart" ? 0.6 : 1, boxShadow: ring ?? TILE.boxShadow };
        return (
          <button
            key={cell.square}
            type="button"
            data-square={cell.square}
            aria-label={cell.tile === null ? "Empty square" : cell.glyph}
            onClick={onSquare === undefined ? undefined : () => onSquare(cell.square)}
            style={{ border: 0, padding: 0, cursor: onSquare === undefined ? "default" : "pointer", ...look }}
          >
            {cell.glyph.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export type KumimojiTableProps = KumimojiTableOptions & Omit<HTMLAttributes<HTMLDivElement>, keyof KumimojiTableOptions>;

/**
 * A whole game alone, as a React component: the plain-DOM table
 * (`mountKumimoji`) mounted into this component's element once the browser
 * has it. Options are read when it mounts; give it a new `key` to start over
 * with different ones.
 */
export function KumimojiTable({ language, hand, level, gameLength, diagonals, seed, onFinish, ...element }: KumimojiTableProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(onFinish);
  useEffect(() => {
    latest.current = onFinish;
  });
  useEffect(() => {
    const target = host.current;
    if (target === null) return;
    const table = mountKumimoji(target, { language, hand, level, gameLength, diagonals, seed, onFinish: (result) => latest.current?.(result) });
    return () => table.destroy();
    // Mounted once per key, as documented above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={host} {...element} />;
}
