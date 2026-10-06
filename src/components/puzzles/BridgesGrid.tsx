"use client";

import { memo, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import { cellFacts } from "@/lib/puzzles/cellLabel";
import type { BridgesBoard } from "@/lib/puzzles/bridges/bridges.types";
import { bridgesAt, otherEnd, spanToward } from "@/lib/puzzles/bridges/code";
import { centredBaseline } from "@/lib/ui/svgText";

import { PuzzleBoard } from "./PuzzleBoard";
import { BRIDGES_LOOK } from "./puzzles.constants";

const NO_SPANS: ReadonlySet<number> = new Set();

/** How far a finger must go from its island, in cells, before a press is a drag toward the next island that way. */
const DRAG_FROM = 0.5;

/**
 * THE BRIDGES BOARD: white paper inside the wood every board has
 * (`PuzzleBoard`), faintly ruled, with the islands as ringed numbers on the
 * cells and the bridges drawn between them — one stroke or two.
 *
 * It knows the rules only as far as drawing them: an island that has its
 * number is filled solid with its number in white, and carries a tick (two
 * cues, never colour alone); one that has more than its number is ringed in
 * vermilion and dashed. A press, a tap or a drag is reported to
 * `BridgesSolve`, which decides what it means.
 *
 * A tap is a press and a lift on one island. A drag is a press on an island
 * and a finger that goes half a cell or more one way: it aims at the next
 * island that way, drawn dashed while held, and the lift lays the bridge. Both
 * are pointer events captured on the press (a finger and a mouse alike, and
 * `touch-action: none` so a finger drawing a bridge never scrolls the page),
 * as Tsunagi's board draws its lines. Each island is also a button, so a
 * keyboard reaches it; a mouse's click on one is the pointer's already.
 */
export function BridgesGrid({
  board,
  counts,
  chosen = null,
  wrong = NO_SPANS,
  done,
  readOnly = false,
  onTap,
  onDrag,
}: {
  board: BridgesBoard;
  counts: readonly number[];
  /** The island tapped first, waiting for its partner. */
  chosen?: number | null;
  /** The spans Show marked wrong (`useHints`). */
  wrong?: ReadonlySet<number>;
  done: boolean;
  /** Drawn only, never pressed: a preview, or a solve's page. */
  readOnly?: boolean;
  onTap?: (island: number) => void;
  onDrag?: (from: number, to: number) => void;
}) {
  const say = useSpeaker();
  const { size, islands, spans } = board;
  const theme = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];
  const live = !readOnly && !done;
  const pressing = useRef<{ pointer: number; island: number } | null>(null);
  const [aim, setAim] = useState<{ from: number; span: number } | null>(null);

  const place = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * size, y: ((event.clientY - box.top) / box.height) * size };
  };
  const islandUnder = (event: PointerEvent<HTMLDivElement>): number => {
    const { x, y } = place(event);
    const row = Math.floor(y);
    const col = Math.floor(x);
    if (row < 0 || col < 0 || row >= size || col >= size) return -1;
    return board.islandAt[row * size + col]!;
  };
  /** The span a held finger is aiming along, from how far and which way it has gone from its island. */
  const aimed = (event: PointerEvent<HTMLDivElement>, from: number): number | null => {
    const { x, y } = place(event);
    const dx = x - (islands[from]!.col + 0.5);
    const dy = y - (islands[from]!.row + 0.5);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_FROM) return null;
    return Math.abs(dx) >= Math.abs(dy) ? spanToward(board, from, 0, dx > 0 ? 1 : -1) : spanToward(board, from, dy > 0 ? 1 : -1, 0);
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (!live || pressing.current !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pressing.current = { pointer: event.pointerId, island: islandUnder(event) };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const held = pressing.current;
    if (held === null || held.pointer !== event.pointerId || held.island === -1) return;
    const span = aimed(event, held.island);
    if (span !== (aim?.span ?? null)) setAim(span === null ? null : { from: held.island, span });
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const held = pressing.current;
    if (held === null || held.pointer !== event.pointerId) return;
    pressing.current = null;
    setAim(null);
    if (event.type === "pointercancel") return;
    if (held.island === -1) {
      // A press on water: a tap there lets go of the island chosen.
      if (islandUnder(event) === -1) onTap?.(-1);
      return;
    }
    const span = aimed(event, held.island);
    if (span !== null) onDrag?.(held.island, otherEnd(board, span, held.island));
    else if (islandUnder(event) === held.island) onTap?.(held.island);
  };
  /* A keyboard's press on an island's button; a pointer's click is already a tap above (its `detail` counts the clicks). */
  const keyed = (event: MouseEvent<HTMLButtonElement>, island: number) => {
    if (event.detail === 0 && live) onTap?.(island);
  };

  const centre = (island: number) => ({ x: islands[island]!.col + 0.5, y: islands[island]!.row + 0.5 });
  const r = BRIDGES_LOOK.island;
  /** The stroke or two of a span, from the edge of one island's ring to the other's. */
  const strokes = (span: number, count: number) => {
    const { a, b, across } = spans[span]!;
    const from = centre(a);
    const to = centre(b);
    const offsets = count === 2 ? [-BRIDGES_LOOK.double, BRIDGES_LOOK.double] : [0];
    return offsets.map((offset) =>
      across
        ? { x1: from.x + r, y1: from.y + offset, x2: to.x - r, y2: to.y + offset }
        : { x1: from.x + offset, y1: from.y + r, x2: to.x + offset, y2: to.y - r },
    );
  };

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-size={size} data-done={done ? "true" : "false"}>
      <PuzzleBoard size={size}>
        <div
          className={`relative h-full w-full ${live ? "cursor-pointer" : ""}`}
          style={{ touchAction: "none", background: BRIDGES_LOOK.paper }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid="bridges-board"
          data-aim={aim === null ? undefined : aim.span}
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <Rules size={size} line={theme.line} />
            {spans.map((span, at) => {
              const count = counts[at] ?? 0;
              if (count === 0) return null;
              const bad = wrong.has(at);
              return (
                <g key={at} stroke={bad ? BRIDGES_LOOK.wrong : BRIDGES_LOOK.ink} strokeWidth={BRIDGES_LOOK.stroke} strokeLinecap="round" strokeDasharray={bad ? "0.18 0.1" : undefined} data-testid="bridges-bridge" data-span={at} data-count={count} data-across={span.across ? "true" : "false"} data-wrong={bad ? "true" : undefined}>
                  {strokes(at, count).map((line, k) => (
                    <line key={k} {...line} />
                  ))}
                </g>
              );
            })}
            {/* The bridge a drag would lay, as a path that is always there and has its line or none: a node added to the page here would restyle all of it at every step of a drag (`shadedPath`, in the Picture logic code, says why). */}
            <path
              d={aim === null ? "" : aimPath(strokes(aim.span, 1)[0]!)}
              fill="none"
              stroke={BRIDGES_LOOK.chosen}
              strokeWidth={BRIDGES_LOOK.stroke}
              strokeDasharray="0.15 0.12"
              strokeLinecap="round"
              data-testid="bridges-aim"
            />
            {islands.map((island, at) => {
              const has = bridgesAt(board, counts, at);
              const full = has === island.count;
              const over = has > island.count;
              const { x, y } = centre(at);
              return (
                <g key={at}>
                  {chosen === at ? <circle cx={x} cy={y} r={r + 0.09} fill="none" stroke={BRIDGES_LOOK.chosen} strokeWidth={0.08} /> : null}
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={full ? BRIDGES_LOOK.ink : BRIDGES_LOOK.paper}
                    stroke={over ? BRIDGES_LOOK.wrong : BRIDGES_LOOK.ink}
                    strokeWidth={over ? 0.08 : 0.05}
                    strokeDasharray={over ? "0.14 0.08" : undefined}
                  />
                  <text x={x} y={centredBaseline(y, 0.48)} fontSize={0.48} fontWeight={600} textAnchor="middle" fill={full ? BRIDGES_LOOK.paper : over ? BRIDGES_LOOK.wrong : BRIDGES_LOOK.ink}>
                    {island.count}
                  </text>
                  {full ? (
                    <g data-testid="bridges-tick">
                      <circle cx={x + 0.27} cy={y - 0.27} r={0.14} fill={BRIDGES_LOOK.paper} stroke={BRIDGES_LOOK.ink} strokeWidth={0.03} />
                      <path d={`M ${x + 0.2} ${y - 0.27} l 0.05 0.06 l 0.1 -0.12`} fill="none" stroke={BRIDGES_LOOK.chosen} strokeWidth={0.04} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  ) : null}
                </g>
              );
            })}
          </svg>
          {islands.map((island, at) => {
            const has = bridgesAt(board, counts, at);
            const state = has === island.count ? "full" : has > island.count ? "over" : "open";
            return (
              <button
                key={at}
                type="button"
                tabIndex={live ? 0 : -1}
                disabled={!live}
                onClick={(event) => keyed(event, at)}
                className="absolute rounded-full outline-none focus-visible:ring-2 focus-visible:ring-moss"
                style={{ left: `${(island.col / size) * 100}%`, top: `${(island.row / size) * 100}%`, width: `${100 / size}%`, height: `${100 / size}%` }}
                aria-label={islandLabel(say, island, has, state)}
                aria-pressed={chosen === at}
                data-testid="bridges-island"
                data-island={at}
                data-cell={island.cell}
                data-count={island.count}
                data-has={has}
                data-state={state}
                data-chosen={chosen === at ? "true" : undefined}
              />
            );
          })}
        </div>
      </PuzzleBoard>
    </div>
  );
}

/** A line as a path's `d`. */
const aimPath = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => `M${x1} ${y1}L${x2} ${y2}`;

/** The paper's faint rules, as every puzzle's paper has, so a reader can count along a row: drawn once for a size, never again for a bridge laid or aimed. */
/** What a screen reader hears for an island: where it is, its number, how many bridges it has, and whether that is enough. */
function islandLabel(say: Speaker, island: { row: number; col: number; count: number }, has: number, state: "full" | "over" | "open"): string {
  const where = say.say("pgrid.cell.where", { row: String(island.row + 1), col: String(island.col + 1) });
  const head = say.say("pgrid.bridges.island", { where, count: String(island.count), bridges: say.count("pgrid.bridges.has", has) });
  return cellFacts(say, head, ...(state === "open" ? [] : [say.say(state === "full" ? "pgrid.bridges.full" : "pgrid.bridges.over")]));
}

const Rules = memo(function Rules({ size, line }: { size: number; line: string }) {
  return (
    <>
      {Array.from({ length: size - 1 }, (_, at) => (
        <g key={at} stroke={line} strokeWidth={0.02} opacity={0.3}>
          <line x1={at + 1} y1={0} x2={at + 1} y2={size} />
          <line x1={0} y1={at + 1} x2={size} y2={at + 1} />
        </g>
      ))}
    </>
  );
});
