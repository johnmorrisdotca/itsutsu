"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

import { boardModel, JIRAI_STYLE } from "@johnmorrisdotca/jirai/draw";
import type { Board, Game } from "@johnmorrisdotca/jirai";

import { activeCells } from "@johnmorrisdotca/jirai";

import { jiraiGameOf, jiraiRecipeOf, OUTSIDE, type JiraiMove, type JiraiRecipe } from "@/lib/puzzles/jirai/board";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { packageLanguage } from "./mazeWords";
import { PuzzleBoard } from "./PuzzleBoard";

/** How long a finger is held on a square for it to mean a flag, as Jirai's own board takes it. */
const HOLD_MS = 450;

/**
 * What a code shows, drawn by Jirai: its game, with the clues of the squares the code has uncovered and nothing of
 * the rest (`boardModel` never gives a covered clue). The mines are not needed to draw what is on the board.
 */
function viewOf(recipe: JiraiRecipe, code: string): Game {
  const clues = [...code].map((character) => (character >= "0" && character <= "8" ? Number(character) : 0));
  const board: Board = { settings: recipe.settings, mines: clues.map(() => false), clues, first: recipe.first, attempt: 0 };
  return jiraiGameOf(recipe, board, code);
}

/**
 * JIRAI'S BOARD: Jirai's own drawing (`boardModel`, `JIRAI_STYLE`) in the wood every
 * board has (`PuzzleBoard`), and a press on a square read as a move.
 *
 * A tap uncovers a square, or, on an uncovered number, uncovers the squares round
 * it (a chord). With Flag on (`flagging`), a tap flags instead. A finger held on a
 * square flags it, and so does a right click; the keyboard has Enter to uncover
 * and Space or F to flag, the arrows to move. Nothing needs hover. Squares are
 * buttons, so a reader's tools can name them ("row 3, column 5: 2").
 *
 * It draws what it is handed and reports a move: `JiraiSolve` decides what a
 * move does to the board.
 */
export function JiraiBoard({
  size,
  givens,
  code,
  flagging = false,
  wrong,
  hint = null,
  readOnly = false,
  label,
  onMove,
}: {
  size: number;
  givens: string;
  code: string;
  flagging?: boolean;
  /** The flags Show marked wrong. */
  wrong?: ReadonlySet<number>;
  hint?: number | null;
  readOnly?: boolean;
  label: string;
  onMove?: (move: JiraiMove) => void;
}) {
  const say = useSpeaker();
  const language = packageLanguage(say.locale);
  const recipe = useMemo(() => jiraiRecipeOf(size, givens), [size, givens]);
  const model = useMemo(() => (recipe === null ? null : boardModel(viewOf(recipe, code), { pieces: "flags", hint, language })), [recipe, code, hint, language]);
  const [cursor, setCursor] = useState<number | null>(null);
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  if (recipe === null || model === null) return null;
  const first = activeCells(recipe.settings)[0]!;
  const at = cursor ?? first;
  const hex = recipe.settings.grid === "hex";

  const cellOf = (target: EventTarget | null): number | null => {
    const found = target instanceof Element ? target.closest("[data-cell]") : null;
    return found === null ? null : Number(found.getAttribute("data-cell"));
  };
  const reveal = (cell: number): JiraiMove => ({ kind: code[cell] !== "." && code[cell] !== "f" && code[cell] !== OUTSIDE ? "chord" : "reveal", cell });
  const stop = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    held.current = false;
    stop();
    const cell = cellOf(event.target);
    if (readOnly || cell === null || event.pointerType === "mouse") return;
    origin.current = { x: event.clientX, y: event.clientY };
    timer.current = setTimeout(() => {
      held.current = true;
      onMove?.({ kind: "flag", cell });
    }, HOLD_MS);
  };
  const moved = (event: PointerEvent<HTMLDivElement>) => {
    if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 8) stop();
  };
  const click = (event: MouseEvent<HTMLDivElement>) => {
    const cell = cellOf(event.target);
    const wasHeld = held.current;
    held.current = false;
    if (readOnly || cell === null || wasHeld) return;
    setCursor(cell);
    onMove?.(flagging ? { kind: "flag", cell } : reveal(cell));
  };
  const aside = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    stop();
    const cell = cellOf(event.target);
    if (readOnly || cell === null || held.current) return;
    setCursor(cell);
    onMove?.({ kind: "flag", cell });
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const cell = cellOf(event.target);
    if (readOnly || cell === null || event.metaKey || event.ctrlKey || event.altKey) return;
    const width = recipe.settings.width;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -width, ArrowDown: width }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      // The next square that is on the board, in that direction, staying in its row for a step sideways.
      let next = cell + step;
      while (next >= 0 && next < code.length && code[next] === OUTSIDE && !(Math.abs(step) === 1 && Math.floor(next / width) !== Math.floor(cell / width))) next += step;
      const sideways = Math.abs(step) === 1;
      if (next >= 0 && next < code.length && code[next] !== OUTSIDE && (!sideways || Math.floor(next / width) === Math.floor(cell / width))) {
        setCursor(next);
        requestAnimationFrame(() => (event.currentTarget.querySelector(`[data-cell="${next}"]`) as HTMLElement | null)?.focus());
      }
    } else if (event.key === " " || event.key.toLowerCase() === "f") {
      event.preventDefault();
      onMove?.({ kind: "flag", cell });
    } else if (event.key === "Enter") {
      event.preventDefault();
      onMove?.(reveal(cell));
    }
  };

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="jirai" data-size={size} data-read-only={readOnly ? "true" : "false"}>
      <PuzzleBoard size={size} coordinates={false}>
        <style>{JIRAI_STYLE}</style>
        <div className="jr-root flex h-full w-full items-center justify-center" data-material="ivory" data-grid={recipe.settings.grid} data-shape={recipe.settings.shape ?? "rectangle"}>
          <div
            className="jr-board"
            role="group"
            aria-label={label}
            style={{ aspectRatio: `${model.width} / ${model.height}`, minWidth: 0, width: hex ? "100%" : "100%", touchAction: "manipulation" }}
            onPointerDown={down}
            onPointerMove={moved}
            onPointerUp={stop}
            onPointerCancel={stop}
            onClick={click}
            onContextMenu={aside}
            onKeyDown={key}
            data-testid="jirai-board"
          >
            {model.cells.map((cell) => {
              const marked = wrong?.has(cell.cell) === true;
              return (
                <button
                  key={cell.cell}
                  type="button"
                  className="jr-cell"
                  data-cell={cell.cell}
                  data-testid="jirai-cell"
                  data-kind={marked ? "wrong" : cell.kind}
                  data-hint={String(cell.hint)}
                  data-number={cell.kind === "open" ? cell.text : ""}
                  aria-label={marked ? say.say("pgrid.jirai.wrongFlag", { where: cell.label.split(":")[0]! }) : cell.label}
                  tabIndex={readOnly ? -1 : cell.cell === at ? 0 : -1}
                  disabled={readOnly}
                  style={{ left: `${(cell.x / model.width) * 100}%`, top: `${(cell.y / model.height) * 100}%`, width: `${(cell.width / model.width) * 100}%`, height: `${(cell.height / model.height) * 100}%` }}
                >
                  {marked ? "×" : cell.text}
                </button>
              );
            })}
          </div>
        </div>
      </PuzzleBoard>
    </div>
  );
}
