"use client";

import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { BoardFrame } from "@/components/board/BoardFrame";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { geometryOf, isFree } from "@johnmorrisdotca/jarajara";
import { layoutExtent, layoutFor } from "@johnmorrisdotca/jarajara";
import { EMPTY_SLOT, faceOf } from "@johnmorrisdotca/jarajara";

import { MahjongFaceSymbols, MahjongTileFace, faceSymbolId, faceWords } from "./MahjongTileFace";
import { MAHJONG_DOUBLE_TAP_MS, MAHJONG_DRAG_FROM_PX, MAHJONG_TILE } from "./mahjong.constants";

/** The rim of wood round the layout, as a share of the board's width. */
const RIM = 0.025;

/** Where a slot's tile face is drawn, in the board's units: raised up and right by its layer. */
function faceAt(slot: { x: number; y: number; z: number }, layers: number): { x: number; y: number } {
  const { halfX, halfY, depth } = MAHJONG_TILE;
  return { x: depth + slot.x * halfX + slot.z * depth, y: (layers - slot.z) * depth + slot.y * halfY };
}

/** The board's own width and height in its units, room left for the thickness below and the layers above. */
export function mahjongViewBox(size: number): { width: number; height: number } {
  const layout = layoutFor(size);
  if (layout === null) return { width: 1, height: 1 };
  const { width, height, layers } = layoutExtent(layout);
  return { width: width * MAHJONG_TILE.halfX + (layers + 1) * MAHJONG_TILE.depth, height: height * MAHJONG_TILE.halfY + (layers + 1) * MAHJONG_TILE.depth };
}

/**
 * The board's width to height as drawn, wood and frame included, for a box
 * that shows it whole (`TsunagiViewport`, which the Turtle is zoomed in).
 */
export function mahjongAspect(size: number): string {
  const box = mahjongViewBox(size);
  // The wood's rim is a share of its width all round, and the frame a few pixels more.
  const tall = (1 - 2 * RIM) * (box.height / box.width) + 2 * RIM + 0.03;
  return `1 / ${tall.toFixed(3)}`;
}

/**
 * THE LAYOUT, ON THE READER'S OWN WOOD (`BoardFrame`): every tile drawn as a
 * raised ivory block, its thickness showing below and to the left, each layer
 * lifted a step up and to the right so the stacks read at a glance. Drawn far
 * to near — lower layers first, then from the back row forward and from the
 * right leftward — so every tile's sides are covered by the tiles in front of
 * it, as they would be on a table.
 *
 * A tile is pressed, or dragged onto another, by mouse and finger alike
 * (pointer events); a double-tap asks for it to be taken with its match. A
 * blocked tile shakes and stays. With `showFree`, every blocked tile is washed
 * darker so the free ones stand out. `readOnly` draws the same board to look
 * at: the set-up's preview and a finished solve's page.
 *
 * `found` is Find (`useMahjongFind`): the tiles matching the one pointed at or
 * chosen, a solid ring on a match that could be taken with it now and a dashed
 * ring on a held one, in a colour of its own. `onPoint` says which free tile a
 * mouse is over, so Find can answer before anything is pressed.
 */
export function MahjongBoard({
  size,
  cells,
  theme,
  chosen = null,
  hinted = [],
  found = null,
  showFree = false,
  readOnly = false,
  onTap,
  onPair,
  onDouble,
  onBlocked,
  onPoint,
}: {
  size: number;
  cells: string;
  theme: BoardThemeTokens;
  chosen?: number | null;
  hinted?: readonly number[];
  found?: { free: readonly number[]; blocked: readonly number[] } | null;
  showFree?: boolean;
  readOnly?: boolean;
  onTap?: (slot: number) => void;
  /** A tile dragged and let go on another. */
  onPair?: (from: number, to: number) => void;
  onDouble?: (slot: number) => void;
  onBlocked?: (slot: number) => void;
  /** The tile a mouse is over, or null when it leaves one. */
  onPoint?: (slot: number | null) => void;
}) {
  const prefix = `mj${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const layout = layoutFor(size);
  const geometry = layout === null ? null : geometryOf(layout);
  const box = mahjongViewBox(size);
  const layers = layout === null ? 1 : layoutExtent(layout).layers;
  const svg = useRef<SVGSVGElement>(null);
  const lastTap = useRef<{ slot: number; at: number } | null>(null);
  const [dragging, setDragging] = useState<{ slot: number; x: number; y: number } | null>(null);
  const swallow = useRef(false);

  const free = geometry === null ? [] : [...cells].map((_, slot) => isFree(geometry, cells, slot));
  /* Far to near: layer by layer, back row first, right to left along a row. */
  const order = layout === null ? [] : layout.slots.map((slot, index) => ({ slot, index })).sort((a, b) => a.slot.z - b.slot.z || a.slot.y - b.slot.y || b.slot.x - a.slot.x);

  if (layout === null) return null;

  const shake = (slot: number) => {
    onBlocked?.(slot);
    const node = svg.current?.querySelector(`[data-slot="${slot}"]`);
    const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (node instanceof SVGGElement && !still && typeof node.animate === "function") {
      node.animate([{ transform: "translateX(0)" }, { transform: "translateX(-2.5px)" }, { transform: "translateX(2.5px)" }, { transform: "translateX(-1.5px)" }, { transform: "translateX(0)" }], { duration: 260 });
    }
  };

  /* `at` is the press's own time stamp, so two presses on one tile close together are a double-tap. */
  const tapped = (slot: number, at: number) => {
    if (readOnly) return;
    if (!free[slot]) {
      shake(slot);
      return;
    }
    const now = at;
    const before = lastTap.current;
    lastTap.current = { slot, at: now };
    if (before !== null && before.slot === slot && now - before.at < MAHJONG_DOUBLE_TAP_MS && onDouble !== undefined) {
      lastTap.current = null;
      onDouble(slot);
      return;
    }
    onTap?.(slot);
  };

  /* A press on a free tile that moves becomes a drag: the tile follows the pointer and is let go on another. */
  const pressed = (slot: number, event: ReactPointerEvent) => {
    if (readOnly || event.button !== 0 || !free[slot]) return;
    const id = event.pointerId;
    const from = { x: event.clientX, y: event.clientY };
    let moving = false;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      if (!moving && Math.hypot(e.clientX - from.x, e.clientY - from.y) > MAHJONG_DRAG_FROM_PX) moving = true;
      if (moving) {
        e.preventDefault();
        setDragging({ slot, x: e.clientX, y: e.clientY });
      }
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (!moving) return;
      setDragging(null);
      swallow.current = true;
      window.setTimeout(() => (swallow.current = false), 0);
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-slot]")?.getAttribute("data-slot");
      const to = under === null || under === undefined ? null : Number(under);
      if (to !== null && to !== slot) {
        if (!free[to]) shake(to);
        else onPair?.(slot, to);
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  // As many rows of square cells as the layout's height takes, a fraction included, so the wood fits the tiles all round.
  const rows = (layout.size * box.height) / box.width;
  const { faceWidth: w, faceHeight: h, depth } = MAHJONG_TILE;
  return (
    // Never taller than most of the window: a tall layout (the Torii) is narrowed to fit rather than scrolled past.
    <div className={`${PLAY_SURFACE} relative mx-auto w-full`} style={{ maxWidth: `calc(78vh * ${(box.width / box.height).toFixed(3)})` }} data-testid="mahjong-board-frame">
      <BoardFrame size={layout.size} rows={rows} theme={theme} flipped={false} inset={RIM} lattice={false} shape="rhombus" coordinates={false}>
        <svg
          ref={svg}
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full touch-none select-none"
          role="group"
          aria-label={`Mahjong layout, ${cells.replaceAll(EMPTY_SLOT, "").length} tiles left`}
          data-testid="mahjong-board"
          data-size={size}
          data-cells={cells}
          data-show-free={showFree ? "true" : "false"}
        >
          <MahjongFaceSymbols prefix={prefix} />
          {order.map(({ slot, index }) => {
            const code = cells[index];
            if (code === undefined || code === EMPTY_SLOT) return null;
            const at = faceAt(slot, layers);
            const isChosen = chosen === index;
            const isHinted = hinted.includes(index);
            const foundFree = found?.free.includes(index) ?? false;
            const foundHeld = !foundFree && (found?.blocked.includes(index) ?? false);
            const face = faceOf(code);
            const lifted = dragging?.slot === index;
            return (
              <g
                key={index}
                transform={`translate(${at.x} ${at.y})`}
                style={{ transformBox: "fill-box", opacity: lifted ? 0.35 : 1, cursor: readOnly ? undefined : free[index] ? "pointer" : "not-allowed" }}
                data-slot={index}
                data-face={code}
                data-free={free[index] ? "true" : "false"}
                data-chosen={isChosen ? "true" : undefined}
                data-hinted={isHinted ? "true" : undefined}
                data-found={foundFree ? "free" : foundHeld ? "held" : undefined}
                data-testid="mahjong-tile"
                role={readOnly ? undefined : "button"}
                tabIndex={readOnly || !free[index] ? undefined : 0}
                aria-label={face === null ? undefined : `${faceWords(face)}${free[index] ? "" : ", blocked"}`}
                aria-pressed={readOnly ? undefined : isChosen}
                onPointerDown={(event) => pressed(index, event)}
                onPointerEnter={(event) => {
                  if (!readOnly && event.pointerType === "mouse") onPoint?.(index);
                }}
                onPointerLeave={(event) => {
                  if (!readOnly && event.pointerType === "mouse") onPoint?.(null);
                }}
                onClick={(event) => {
                  if (swallow.current) return;
                  tapped(index, event.timeStamp);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  tapped(index, event.timeStamp);
                }}
              >
                {/* A raised tile's shadow on what lies under it: the higher, the darker, so the layers read at a glance. */}
                {slot.z > 0 ? <rect x={-depth * 2} y={depth * 2} width={w} height={h} rx={4} pointerEvents="none" fill={MAHJONG_TILE.shadow} opacity={Math.min(0.5, 0.18 + slot.z * 0.06)} /> : null}
                <rect x={-depth} y={depth} width={w} height={h} rx={3} fill={MAHJONG_TILE.side} stroke={MAHJONG_TILE.sideEdge} strokeWidth={0.8} />
                <rect x={0} y={0} width={w} height={h} rx={3} fill={isChosen ? MAHJONG_TILE.chosen : MAHJONG_TILE.face} stroke={MAHJONG_TILE.rim} strokeWidth={0.8} />
                <use href={`#${faceSymbolId(prefix, code)}`} width={w} height={h} />
                {showFree && !free[index] ? <rect x={0} y={0} width={w} height={h} rx={3} fill={MAHJONG_TILE.blockedWash} /> : null}
                {foundFree ? <rect x={1} y={1} width={w - 2} height={h - 2} rx={2.5} fill={MAHJONG_TILE.foundWash} stroke={MAHJONG_TILE.found} strokeWidth={2.6} /> : null}
                {foundHeld ? <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={2.5} fill="none" stroke={MAHJONG_TILE.found} strokeWidth={1.8} strokeDasharray="3 2.4" /> : null}
                {isHinted ? <rect x={1} y={1} width={w - 2} height={h - 2} rx={2.5} fill="none" stroke={MAHJONG_TILE.hinted} strokeWidth={2.6} /> : null}
                {isChosen ? <rect x={1} y={1} width={w - 2} height={h - 2} rx={2.5} fill="none" stroke={MAHJONG_TILE.chosenRing} strokeWidth={2.6} /> : null}
              </g>
            );
          })}
        </svg>
      </BoardFrame>
      {dragging !== null ? (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" style={{ left: dragging.x, top: dragging.y }} data-testid="mahjong-ghost">
          <MahjongTileFace code={cells[dragging.slot] ?? ""} className="h-12" />
        </div>
      ) : null}
    </div>
  );
}
