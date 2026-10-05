"use client";

import { isGameSolved, isGameStuck, jumpAt, legalJumps, pegCount, restart as restartGame, undo as undoJump, type Game } from "@johnmorrisdotca/tobiishi";
import { boundsOf, draw, pointOf, THEMES } from "@johnmorrisdotca/tobiishi/draw";
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type Ref } from "react";

import { tobiishiChallengeOf, tobiishiPackOf, tobiishiRefOfCode } from "@/lib/puzzles/tobiishi/levels";
import { encodeJumps, replayJumps } from "@/lib/puzzles/tobiishi/way";

import { PuzzleBoard } from "./PuzzleBoard";
import { PACKAGE_TRAY_OFF } from "./tobiishi.constants";

/** What the board says of the run after anything that changes it: a jump, an undo, a restart. */
export type TobiishiReading = {
  /** Jumps made so far. */
  jumps: number;
  /** Pegs left on the board. */
  pegs: number;
  /** One peg is left, in the goal hole. */
  solved: boolean;
  /** No jump is left and the board is not solved. */
  stuck: boolean;
  /** The run as the site keeps it (`way.ts`). */
  way: string;
  undoable: boolean;
};

/** The press each button under the board makes. */
export type TobiishiHandle = { undo: () => void; restart: () => void };

/** The side of the wood the board is laid out for: a peg board has no rows to letter, so only its rim depends on it. */
const FRAME_SIDE = 9;

/** How far a pointer must travel from a peg before it is dragging it and no longer tapping it, in pixels. */
const DRAG_SLOP = 8;

/** A hole's drawn radius and the one a drop is forgiven within, in the package's own units (`draw`: a hole is 24 across its radius). */
const HOLE_RADIUS = 24;
const DROP_REACH = 32;

function readingOf(game: Game): TobiishiReading {
  return { jumps: game.history.length, pegs: pegCount(game), solved: isGameSolved(game), stuck: isGameStuck(game), way: encodeJumps(game), undoable: game.history.length > 0 };
}

/**
 * THE TOBIISHI BOARD: the package's engine and drawing (`@johnmorrisdotca/tobiishi`),
 * on white paper in the wood every puzzle's board has (`PuzzleBoard`), played the way
 * every board here is: a tap on a peg and then on a hole, or a drag from one to the
 * other, with a finger or a mouse (pointer events), or the keyboard. The package draws
 * the board and its pegs as one picture; the holes are buttons laid over it, so the
 * pictures and the presses cannot disagree about where a hole is.
 *
 * A peg may jump only over a peg into an empty hole straight beyond, and the engine says
 * which (`legalJumps`): the holes the chosen peg can reach are ringed. A jump the engine
 * refuses leaves the board as it was.
 *
 * `way` is the run the level was kept with: replayed from the level's own starting
 * position, and where it is not a run of legal jumps there (an old or altered code) it is
 * ignored, so a wrong run is never played on.
 */
export function TobiishiBoard({
  code,
  way = "",
  locked = false,
  onChange,
  handle,
}: {
  /** The level, as its code (`english:centre:3`). */
  code: string;
  /** The jumps to start with, as a kept run holds them. */
  way?: string;
  /** Looked at and not played: a finished level. */
  locked?: boolean;
  onChange?: (reading: TobiishiReading) => void;
  handle?: Ref<TobiishiHandle>;
}) {
  const level = useMemo(() => {
    const named = tobiishiRefOfCode(code);
    return named === null ? null : { ref: named, start: tobiishiChallengeOf(named).game };
  }, [code]);
  const ref = level?.ref ?? null;
  const start = level?.start ?? null;
  const [game, setGame] = useState<Game | null>(() => (start === null ? null : (replayJumps(start, way) ?? start)));
  const [selected, setSelected] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const [drag, setDrag] = useState<{ x: number; y: number; over: number | null } | null>(null);
  const field = useRef<HTMLDivElement>(null);
  const holes = useRef<(HTMLButtonElement | null)[]>([]);
  const pointer = useRef<{ from: number; id: number; x: number; y: number; moved: boolean } | null>(null);
  const ignoreClick = useRef(false);
  const told = useRef(onChange);
  useEffect(() => {
    told.current = onChange;
  });

  // What the board says, after every change and once as it opens.
  useEffect(() => {
    if (game !== null) told.current?.(readingOf(game));
  }, [game]);

  useImperativeHandle(handle, () => ({
    undo: () => {
      setSelected(null);
      setGame((now) => (now === null ? now : undoJump(now)));
    },
    restart: () => {
      setSelected(null);
      setGame((now) => (now === null ? now : restartGame(now)));
    },
  }));

  if (game === null || ref === null) return null;
  const { width, height } = boundsOf(game);
  const where = (cell: number) => pointOf(game, cell);
  const reach = new Set(selected === null ? [] : legalJumps(game).filter((jump) => jump.from === selected).map((jump) => jump.to));
  const title = `${tobiishiPackOf(ref.pack).title.en} board`;
  const svg = draw(game, { material: "stone", selected, title });

  /** The jump a peg makes to a hole, if the engine allows it; selecting nothing afterwards. */
  const jump = (from: number, to: number): boolean => {
    const next = jumpAt(game, from, to);
    if (next === game) return false;
    setGame(next);
    setSelected(null);
    return true;
  };

  /** A press on a hole, by a tap or the keyboard: a peg is chosen, a hole it can reach is jumped to, anything else lets go. */
  const choose = (cell: number) => {
    if (locked) return;
    if (selected !== null && jump(selected, cell)) return;
    setSelected(game.pegs[cell] && selected !== cell ? cell : null);
  };

  /** The hole nearest a point on the board, in the package's units, if one is close enough to be meant. */
  const holeNear = (clientX: number, clientY: number): number | null => {
    const box = field.current?.getBoundingClientRect();
    if (box === undefined || box.width === 0) return null;
    const x = ((clientX - box.left) / box.width) * width;
    const y = ((clientY - box.top) / box.height) * height;
    let best: number | null = null;
    let nearest = DROP_REACH;
    game.board.cells.forEach((_, cell) => {
      const at = where(cell);
      const away = Math.hypot(at.x - x, at.y - y);
      if (away < nearest) {
        nearest = away;
        best = cell;
      }
    });
    return best;
  };

  const down = (event: PointerEvent<HTMLButtonElement>, cell: number) => {
    if (locked || !game.pegs[cell] || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer.current = { from: cell, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  };

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const held = pointer.current;
    if (held === null || held.id !== event.pointerId) return;
    if (!held.moved) {
      if (Math.hypot(event.clientX - held.x, event.clientY - held.y) < DRAG_SLOP) return;
      held.moved = true;
      // The pointer stays with the peg, wherever it goes, until it is let go.
      event.currentTarget.setPointerCapture(event.pointerId);
      setSelected(held.from);
    }
    const box = field.current?.getBoundingClientRect();
    if (box === undefined) return;
    const over = holeNear(event.clientX, event.clientY);
    setDrag({ x: ((event.clientX - box.left) / box.width) * width, y: ((event.clientY - box.top) / box.height) * height, over: over !== null && reach.has(over) ? over : null });
  };

  const up = (event: PointerEvent<HTMLButtonElement>) => {
    const held = pointer.current;
    if (held === null || held.id !== event.pointerId) return;
    pointer.current = null;
    if (!held.moved) return;
    // What follows a drag is not also a tap on the peg it started from.
    ignoreClick.current = true;
    window.setTimeout(() => {
      ignoreClick.current = false;
    }, 0);
    const over = holeNear(event.clientX, event.clientY);
    setDrag(null);
    if (over === null || !jump(held.from, over)) setSelected(held.from);
  };

  const cancel = () => {
    pointer.current = null;
    setDrag(null);
  };

  /** The arrow keys move the focus to the nearest hole that way: along a row or a column, or across a slanted line. */
  const key = (event: KeyboardEvent<HTMLButtonElement>, cell: number) => {
    if (event.key === "Escape") {
      setSelected(null);
      return;
    }
    const step = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const here = where(cell);
    let best = cell;
    let bestScore = Infinity;
    game.board.cells.forEach((_, other) => {
      if (other === cell) return;
      const at = where(other);
      const along = (at.x - here.x) * step[0]! + (at.y - here.y) * step[1]!;
      if (along <= 0) return;
      const across = Math.abs((at.x - here.x) * step[1]! - (at.y - here.y) * step[0]!);
      const score = along + 2 * across;
      if (score < bestScore) {
        bestScore = score;
        best = other;
      }
    });
    setFocus(best);
    holes.current[best]?.focus();
  };

  const ghost = drag === null ? null : (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute rounded-full shadow-md"
      style={{
        left: `${(drag.x / width) * 100}%`,
        top: `${(drag.y / height) * 100}%`,
        width: `${((HOLE_RADIUS * 1.6) / width) * 100}%`,
        aspectRatio: "1",
        transform: "translate(-50%, -50%)",
        background: THEMES.stone.peg,
        border: `2px solid ${THEMES.stone.edge}`,
      }}
      data-testid="tobiishi-ghost"
    />
  );

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="tobiishi" data-locked={locked ? "true" : "false"} data-wallpaper-focus>
      <PuzzleBoard size={FRAME_SIDE} coordinates={false}>
        {/* The board is as wide as the paper, or as tall: a wide board fills the width and a tall one the height, and the rest of the paper stands round it. */}
        <div className="surface-light flex h-full w-full items-center justify-center bg-white">
          <div
            ref={field}
            className="relative touch-none"
            style={{ aspectRatio: `${width} / ${height}`, ...(width >= height ? { width: "100%" } : { height: "100%" }) }}
            role="group"
            aria-label={title}
            data-testid="tobiishi-board"
            data-pegs={pegCount(game)}
            data-jumps={game.history.length}
            data-solved={isGameSolved(game) ? "true" : "false"}
            data-stuck={isGameStuck(game) ? "true" : "false"}
            data-selected={selected ?? ""}
          >
            <div className={`h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full ${PACKAGE_TRAY_OFF}`} dangerouslySetInnerHTML={{ __html: svg }} />
            {game.board.cells.map((cell, index) => {
              const at = where(index);
              const peg = game.pegs[index] === true;
              const goal = index === game.target;
              const legal = reach.has(index);
              return (
                <button
                  key={index}
                  ref={(node) => {
                    holes.current[index] = node;
                  }}
                  type="button"
                  disabled={locked}
                  tabIndex={index === focus ? 0 : -1}
                  className={`absolute rounded-full outline-none focus-visible:ring-4 focus-visible:ring-moss ${legal ? "ring-[3px] ring-shu" : ""} ${drag?.over === index ? "bg-shu/30" : ""}`}
                  style={{
                    left: `${((at.x - HOLE_RADIUS) / width) * 100}%`,
                    top: `${((at.y - HOLE_RADIUS) / height) * 100}%`,
                    width: `${((HOLE_RADIUS * 2) / width) * 100}%`,
                    height: `${((HOLE_RADIUS * 2) / height) * 100}%`,
                  }}
                  aria-label={`${peg ? "Peg" : "Empty hole"} ${cell.x + 1}, ${cell.y + 1}${goal ? ", goal" : ""}${legal ? ", can be jumped to" : ""}`}
                  aria-pressed={selected === index}
                  data-testid="tobiishi-hole"
                  data-cell={index}
                  data-peg={peg ? "true" : "false"}
                  data-goal={goal ? "true" : "false"}
                  data-legal={legal ? "true" : "false"}
                  onClick={() => {
                    if (ignoreClick.current) return;
                    setFocus(index);
                    choose(index);
                  }}
                  onPointerDown={(event) => down(event, index)}
                  onPointerMove={move}
                  onPointerUp={up}
                  onPointerCancel={cancel}
                  onKeyDown={(event) => key(event, index)}
                />
              );
            })}
            {ghost}
          </div>
        </div>
      </PuzzleBoard>
    </div>
  );
}
