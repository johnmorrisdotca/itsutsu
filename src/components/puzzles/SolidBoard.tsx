"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

import type { SolidMount } from "@johnmorrisdotca/meikyuu/3d/play";

import { loadSolidPackage, MEIKYUU_LOOK } from "@/lib/puzzles/meikyuu/browser";
import { encodeCells } from "@/lib/puzzles/meikyuu/steps";
import { stoneOptionOf, type StoneLimit } from "@/lib/puzzles/meikyuu/stones";

import { MeikyuuFrame } from "./MeikyuuFrame";
import type { MeikyuuHandle, MeikyuuReading } from "./MeikyuuBoard";

/** The padding the board's paper gets inside the wood: none, the package draws its own margin. */
const INSET_SIZE = 9;

/**
 * THE BOARD OF A MAZE OVER A SOLID: the package's own playable solid (`mountSolid`, `@johnmorrisdotca/meikyuu/3d/play`), in the wood every board has, with
 * the buttons left to the page (`controls: false`) so they are the site's own. It is `MeikyuuBoard`'s twin and says what it says: after every change a
 * `MeikyuuReading` (the line as the site keeps it, the run with its stones, whether it is solved), and takes the same presses (`MeikyuuHandle`), with two
 * of its own: `turn` and `faceMe`. The answer is a list of cells, the same however the solid is turned, so what is handed in and kept is the steps of the line
 * alone, as it is for a flat maze.
 *
 * The solid turns by itself when the end of the line being drawn nears the edge of the side in view (the package's `edgeTurn`), so a line crosses from one
 * face to the next without letting go; here it is always on. The board is made in the browser only: until the package arrives the frame stands empty.
 */
export function SolidBoard({
  code,
  way = "",
  locked = false,
  stones = "limited",
  onChange,
  handle,
}: {
  /** The maze, as a level's recipe (`cube:7:prim:48213`). */
  code: string;
  /** The run to start with: the line, and after a `~` the stones. */
  way?: string;
  /** Looked at and not drawn on: a finished level. */
  locked?: boolean;
  stones?: StoneLimit;
  onChange?: (reading: MeikyuuReading) => void;
  handle?: Ref<MeikyuuHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mount = useRef<SolidMount | null>(null);
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
    pan: (on) => mount.current?.turnMode(on) ?? false,
    stoneMode: (on) => mount.current?.stoneMode(on) ?? false,
    turn: (by) => mount.current?.turn(by),
    faceMe: () => mount.current?.faceMe(),
  }));
  const stonesNow = useRef(stones);
  useEffect(() => {
    stonesNow.current = stones;
    mount.current?.set({ stones: stoneOptionOf(stones) });
  }, [stones]);
  /* The start run is read once, as the board is made: a later change of it is not a new line to draw. */
  const startWay = useRef(way);

  useEffect(() => {
    let live = true;
    let watch: MutationObserver | null = null;
    const element = host.current;
    if (element === null) return;
    void loadSolidPackage().then(({ play }) => {
      if (!live) return;
      const board = play.mountSolid(element, { recipe: code, board: MEIKYUU_LOOK, controls: false, hints: false, tap: true, language: "en", stones: stoneOptionOf(stonesNow.current) });
      if (board === null) return;
      mount.current = board;
      const read = (): void => {
        const game = board.mazeGame();
        told.current?.({
          cells: game.path.length,
          strokes: game.strokes,
          keys: 0,
          keysOf: 0,
          solved: game.solved,
          way: game.drawing ? null : encodeCells(game.maze, game.path),
          run: game.drawing ? null : board.run(),
          stones: game.stones.length,
          stonesLeft: board.stonesLeft(),
          stoneMode: board.stoneMode(),
          undoable: game.undo.length > 0,
          clearable: game.path.length > 0 || game.strokes > 0 || game.stones.length > 0,
        });
      };
      // The board writes its state onto its element at every change, which is the one place that hears every change, a key press and an undo included.
      watch = new MutationObserver(read);
      watch.observe(element, { attributes: true, attributeFilter: ["data-cells", "data-moves", "data-solved", "data-stones", "data-stone-mode", "data-stones-left"] });
      // A kept run is taken back whole; one that is not a run of this maze leaves the board as it was made.
      if (startWay.current !== "") board.restore(startWay.current);
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
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="meikyuu" data-solid="true" data-locked={locked ? "true" : "false"} data-wallpaper-focus="">
      <MeikyuuFrame size={INSET_SIZE}>
        <div ref={host} className={`h-full w-full ${locked ? "pointer-events-none" : ""} [&_.mk-banner]:hidden [&_.mk-box]:rounded-none [&_.mk-wrap]:h-full`} data-testid="meikyuu-board" data-solid-board="true" />
      </MeikyuuFrame>
    </div>
  );
}
