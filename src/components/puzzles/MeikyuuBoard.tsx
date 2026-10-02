"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import type { MeikyuuMount } from "@johnmorrisdotca/meikyuu/play";

import { loadMeikyuuPackage, MEIKYUU_LOOK } from "@/lib/puzzles/meikyuu/browser";
import { decodeWay, encodeCells } from "@/lib/puzzles/meikyuu/steps";

import { drawAgain } from "./meikyuuReplay";
import { PuzzleBoard } from "./PuzzleBoard";

/** What the board says of the line after anything that changes it: a stroke, an undo, a restart, a key press. */
export type MeikyuuReading = {
  /** Cells in the line now. */
  cells: number;
  /** Strokes drawn: what a person would call moves. */
  strokes: number;
  keys: number;
  keysOf: number;
  /** The line reaches the goal with every key picked up. */
  solved: boolean;
  /** The line as the site keeps it (`way.ts`); null while a stroke is being drawn, when the line is not yet anything to keep. */
  way: string | null;
  undoable: boolean;
  clearable: boolean;
};

/** The press each button under the board makes on the package's board. */
export type MeikyuuHandle = { undo: () => void; restart: () => void; fit: () => void; zoomIn: () => void; zoomOut: () => void };

/** The padding the board's paper gets inside the wood: none, the package draws its own margin. */
const INSET_SIZE = 9;

/**
 * THE MEIKYUU BOARD: the package's own playable board (`mountMeikyuu`), in the wood every board has
 * (`PuzzleBoard`), with the buttons left to the page (`controls: false`) so they are the site's own.
 *
 * A maze is drawn through by a finger or the mouse: press the start and drag, and the line follows the
 * corridors, cannot pass a wall and shortens when drawn back. A big maze is zoomed with a pinch or the wheel
 * and moved with two fingers. All of that is the package's and is not redone here; this carries what the
 * site adds: the maze a level is, the line a kept run was left with, what the line says after each change
 * (`onChange`), and the buttons' presses (`handle`).
 *
 * The board is made in the browser only: its parts are fetched when it first shows (`loadMeikyuuPackage`),
 * and until they arrive the frame stands empty, so nothing moves.
 *
 * `way` is the line the run was kept with. It is drawn on again as a finger draws it (`drawAgain`), and
 * if the board does not end up with that line (a kept code that is not a way through this maze) it is
 * cleared, so a wrong line is never played on. The keys a run had picked up and then drawn back from are not kept,
 * only the line, so they are to be picked up again.
 */
export function MeikyuuBoard({
  code,
  way = "",
  locked = false,
  onChange,
  handle,
}: {
  /** The maze, as a level's recipe (`square:12x9:wilson:to-goal:48213`). */
  code: string;
  /** The line to start with. */
  way?: string;
  /** Looked at and not drawn on: a finished level. */
  locked?: boolean;
  onChange?: (reading: MeikyuuReading) => void;
  handle?: Ref<MeikyuuHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mount = useRef<MeikyuuMount | null>(null);
  const told = useRef(onChange);
  useEffect(() => {
    told.current = onChange;
  });
  useImperativeHandle(handle, () => ({
    undo: () => mount.current?.undo(),
    restart: () => mount.current?.restart(),
    fit: () => mount.current?.fit(),
    zoomIn: () => mount.current?.zoomIn(),
    zoomOut: () => mount.current?.zoomOut(),
  }));

  /* The start line is read once, as the board is made: a later change of it is not a new line to draw. */
  const startWay = useRef(way);

  useEffect(() => {
    let live = true;
    let watch: MutationObserver | null = null;
    const element = host.current;
    if (element === null) return;
    void loadMeikyuuPackage().then(({ play }) => {
      if (!live) return;
      const board = play.mountMeikyuu(element, { recipe: code, board: MEIKYUU_LOOK, controls: false, hints: false, tap: true, language: "en" });
      if (board === null) return;
      mount.current = board;
      const read = (): void => {
        const game = board.mazeGame();
        if (game === null) return;
        told.current?.({
          cells: game.path.length,
          strokes: game.strokes,
          keys: game.collected.length,
          keysOf: game.maze.keys.length,
          solved: game.solved,
          way: game.drawing ? null : encodeCells(game.maze, game.path),
          undoable: game.undo.length > 0,
          clearable: game.path.length > 0 || game.strokes > 0,
        });
      };
      // The board writes its state onto its element at every change (`data-cells`, `data-moves`, `data-solved`): that is the one place that hears every change, a key press and an undo included.
      watch = new MutationObserver(read);
      watch.observe(element, { attributes: true, attributeFilter: ["data-cells", "data-moves", "data-solved", "data-keys"] });
      const game = board.mazeGame();
      const cells = game === null || startWay.current === "" ? null : decodeWay(game.maze, startWay.current);
      if (game !== null && cells !== null && cells.length > 1) {
        drawAgain(element, game.maze, cells);
        // A line the board did not take whole is not played on: cleared, whatever part of it was drawn.
        const taken = board.mazeGame()?.path ?? [];
        if (taken.length !== cells.length || taken.some((cell, at) => cell !== cells[at])) board.restart();
      }
      read();
    });
    return () => {
      live = false;
      watch?.disconnect();
      mount.current?.destroy();
      mount.current = null;
    };
  }, [code]);

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="meikyuu" data-locked={locked ? "true" : "false"} data-wallpaper-focus>
      {/* A maze has no rows and columns to letter, so the wood is bare: the paper inside it is the package's own. */}
      <PuzzleBoard size={INSET_SIZE} coordinates={false}>
        <div
          ref={host}
          className={`h-full w-full ${locked ? "pointer-events-none" : ""} [&_.mk-banner]:hidden [&_.mk-box]:rounded-none [&_.mk-wrap]:h-full`}
          data-testid="meikyuu-board"
        />
      </PuzzleBoard>
    </div>
  );
}
