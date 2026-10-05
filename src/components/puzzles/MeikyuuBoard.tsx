"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import type { MeikyuuMount } from "@johnmorrisdotca/meikyuu/play";

import { loadMeikyuuPackage, MEIKYUU_LOOK } from "@/lib/puzzles/meikyuu/browser";
import { MEIKYUU_TALL_RATIO } from "@/lib/puzzles/meikyuu/sizes";
import { MEIKYUU_GUTTER_LEAST } from "@/lib/puzzles/meikyuu/turn";
import { encodeCells } from "@/lib/puzzles/meikyuu/steps";
import { stoneOptionOf, type StoneLimit } from "@/lib/puzzles/meikyuu/stones";

import { useEdgePan } from "./meikyuuEdgeStore";
import { MeikyuuFrame } from "./MeikyuuFrame";
import { MeikyuuSlot, useStand } from "./MeikyuuStand";

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
  /** The line as the site keeps it (`way.ts`), the steps alone: what is handed in. Null while a stroke is being drawn, when the line is not yet anything to keep. */
  way: string | null;
  /** The run as the site keeps it half way: the line and, after a `~`, the stones laid (`stones.ts`, the package's `encodeRun`). Null while a stroke is being drawn. */
  run: string | null;
  /** Stones laid now, and how many more may be (null for no limit). */
  stones: number;
  stonesLeft: number | null;
  /** Whether the Stone mode is on: a tap lays a stone or takes one up and nothing draws. */
  stoneMode: boolean;
  undoable: boolean;
  clearable: boolean;
};

/** The press each button under the board makes on the package's board. */
export type MeikyuuHandle = {
  undo: () => void;
  restart: () => void;
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Whether every one-finger drag moves the view and draws nothing (Move); with an argument, turn that on or off. */
  pan: (on?: boolean) => boolean;
  /** Whether the Stone mode is on (a tap lays a stone beside the line, or takes one up, and nothing draws); with an argument, turn it on or off. */
  stoneMode: (on?: boolean) => boolean;
};

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
 * `way` is the run it was kept with, the line and the stones laid beside it (`run`, the package's `encodeRun`). The
 * board takes it back whole (`restore`), and a kept code that is not a run of this maze leaves the board as it was
 * made, so a wrong line is never played on. The keys a run had picked up and then drawn back from are not kept, only
 * the line, so they are to be picked up again.
 *
 * STONES (the package's, 2.1): a marble laid beside the line, which the line may not enter (`meikyuu/stones.ts`
 * says how many and how far). `stones` is the limit the reader has chosen, limited (the package's few, by the size)
 * or none; the Stone control is the page's own (`MeikyuuHandle.stoneMode`) and a finger held on a cell lays one too.
 */
export function MeikyuuBoard({
  code,
  tall = false,
  way = "",
  locked = false,
  stones = "limited",
  onChange,
  handle,
}: {
  /** The maze, as a level's recipe (`square:12x9:wilson:to-goal:48213`). */
  code: string;
  /** A tall level (two columns to three rows): its wood is that shape, upright or on its side as the reader's room and choice say (`useStand`). */
  tall?: boolean;
  /** The line to start with. */
  way?: string;
  /** Looked at and not drawn on: a finished level. */
  locked?: boolean;
  /** How many stones may lie at once: a few by the maze's size (`limited`), or as many as the reader likes. */
  stones?: StoneLimit;
  onChange?: (reading: MeikyuuReading) => void;
  handle?: Ref<MeikyuuHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mount = useRef<MeikyuuMount | null>(null);
  const { column, stand, turned } = useStand(tall);
  /* How it stands now, for the board to be made with whenever the package arrives; a turn after that is told to it (below), never a new board. */
  const turnedNow = useRef(turned);
  useEffect(() => {
    turnedNow.current = turned;
  });
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
    pan: (on) => mount.current?.pan(on) ?? false,
    stoneMode: (on) => mount.current?.stoneMode(on) ?? false,
  }));
  /* The stones' limit, for the board to be made with whenever the package arrives; a change after that is told to it, never a new board. */
  const stonesNow = useRef(stones);
  useEffect(() => {
    stonesNow.current = stones;
    mount.current?.set({ stones: stoneOptionOf(stones) });
  }, [stones]);
  /* A line drawn to the edge slides the view along, unless this device has said not (`useEdgePan`); read as the board is made and told when it changes. */
  const { edgePan } = useEdgePan();
  const edgeNow = useRef(edgePan);
  useEffect(() => {
    edgeNow.current = edgePan;
    mount.current?.edgePan(edgePan);
  }, [edgePan]);
  /* How much more of the page than the least the board has been asked to leave beside it (Zoom out widens the gutters a step at a time): the wood narrows by as much on each side, so the page shows beside it and can be scrolled by. */
  const [extra, setExtra] = useState(0);

  /* The start line is read once, as the board is made: a later change of it is not a new line to draw. */
  const startWay = useRef(way);

  useEffect(() => {
    let live = true;
    let watch: MutationObserver | null = null;
    const element = host.current;
    if (element === null) return;
    void loadMeikyuuPackage().then(({ play }) => {
      if (!live) return;
      // A tall maze is played in its own box (`ratio`), stood up or lying as the site has decided (`meikyuu/turn.ts`) and not as the package would (`auto`); the page leaves its room itself (`reserve` 0), as the wood is sized to the window.
      const shape = tall ? { ratio: MEIKYUU_TALL_RATIO, orientation: turnedNow.current ? ("landscape" as const) : ("portrait" as const), reserve: 0 } : {};
      const board = play.mountMeikyuu(element, { recipe: code, board: MEIKYUU_LOOK, controls: false, hints: false, tap: true, language: "en", edgePan: edgeNow.current, stones: stoneOptionOf(stonesNow.current), ...shape });
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
          run: game.drawing ? null : board.run(),
          stones: game.stones.length,
          stonesLeft: board.stonesLeft(),
          stoneMode: board.stoneMode(),
          undoable: game.undo.length > 0,
          clearable: game.path.length > 0 || game.strokes > 0 || game.stones.length > 0,
        });
      };
      // The board writes its state onto its element at every change (`data-cells`, `data-moves`, `data-solved`): that is the one place that hears every change, a key press and an undo included.
      watch = new MutationObserver(() => {
        read();
        setExtra(Math.max(0, Math.round(Number(element.dataset.gutter ?? MEIKYUU_GUTTER_LEAST) - MEIKYUU_GUTTER_LEAST)));
      });
      watch.observe(element, { attributes: true, attributeFilter: ["data-cells", "data-moves", "data-solved", "data-keys", "data-gutter", "data-stones", "data-stone-mode", "data-stones-left"] });
      // A kept run is taken back whole; one that is not a run of this maze leaves the board as it was made (`restore` answers false and changes nothing).
      if (startWay.current !== "") board.restore(startWay.current);
      read();
    });
    return () => {
      live = false;
      watch?.disconnect();
      mount.current?.destroy();
      mount.current = null;
    };
  }, [code, tall]);

  // The wood changes shape with the way up; the board inside it is told, so its box follows.
  useEffect(() => {
    if (tall) mount.current?.orientation(turned ? "landscape" : "portrait");
  }, [tall, turned]);

  return (
    <div ref={column} className="w-full select-none" data-testid="puzzle-grid" data-kind="meikyuu" data-locked={locked ? "true" : "false"} data-stand={stand} data-wallpaper-focus={stand === "square" ? "" : undefined}>
      {/* A maze has no rows and columns to letter, so the wood is bare: the paper inside it is the package's own. */}
      <div style={extra === 0 ? undefined : { paddingInline: extra }} data-testid="meikyuu-gutter" data-extra={extra}>
        <MeikyuuSlot stand={stand}>
          <MeikyuuFrame size={INSET_SIZE} stand={stand}>
            <div
              ref={host}
              className={`h-full w-full ${locked ? "pointer-events-none" : ""} [&_.mk-banner]:hidden [&_.mk-box]:rounded-none [&_.mk-wrap]:h-full`}
              data-testid="meikyuu-board"
            />
          </MeikyuuFrame>
        </MeikyuuSlot>
      </div>
    </div>
  );
}
