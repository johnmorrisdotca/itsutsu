"use client";

import { memo, useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { BoardFrame } from "@/components/board/BoardFrame";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { geometryOf, isFree } from "@johnmorrisdotca/jarajara";
import { layoutExtent, layoutFor } from "@johnmorrisdotca/jarajara";
import { EMPTY_SLOT, faceOf } from "@johnmorrisdotca/jarajara";

import { MahjongFaceSymbols, MahjongTileFace, faceSymbolId, faceWords } from "./MahjongTileFace";
import { MAHJONG_DOUBLE_TAP_MS, MAHJONG_DRAG_FROM_PX, MAHJONG_TILE } from "./mahjong.constants";

/** The face a taken tile is drawn as: it is hidden, and gets its own face back by an attribute when it is given back. */
const FIRST_FACE = "a";

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
 * The widest the board is drawn: never taller than most of the window, so a tall layout (the Torii) is narrowed to fit
 * rather than scrolled past. A layout looked at through the zoom (`TsunagiViewport`) takes this as its box's width
 * (`maxWidth`) and is zoomed from there, so the zoom is a multiple of what is seen, not of a box the board does not fill.
 */
export function mahjongMaxWidth(size: number): string {
  const box = mahjongViewBox(size);
  return `calc(78vh * ${(box.width / box.height).toFixed(3)})`;
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

type TileSlot = { x: number; y: number; z: number };

/**
 * ONE TILE of the layout. Drawn again only when its own marks change (it is `memo`), which is why everything it is given
 * is a plain value or a function that stays the same: choosing a tile redraws that tile and the ones it lights, not the table.
 *
 * A TILE IS NEVER TAKEN OUT OF THE PAGE. The Palace's 576 tiles are some ten thousand elements once every face is drawn,
 * and the browser works its style out again for ALL of them whenever one is added or removed (about 65 milliseconds on a
 * phone's processor, every move), but not for an attribute that changes. So a tile that is taken is hidden (`display`),
 * keeping what it was, and brought back by Undo or a shuffle the same way; and its marks are the attributes of one ring
 * over the face rather than rings that come and go. Nor does a tile gain or lose `data-testid`: the page's stylesheet has
 * `:has([data-testid=…])` rules, and a change of that attribute anywhere under them styles everything under them again.
 */
const MahjongTile = memo(function MahjongTile({
  index,
  slot,
  layers,
  code,
  present,
  prefix,
  free,
  chosen,
  hinted,
  found,
  showFree,
  readOnly,
  lifted,
  onPress,
  onClick,
  onEnter,
  onLeave,
  onKey,
}: {
  index: number;
  slot: TileSlot;
  layers: number;
  code: string;
  present: boolean;
  prefix: string;
  free: boolean;
  chosen: boolean;
  hinted: boolean;
  found: "free" | "held" | null;
  showFree: boolean;
  readOnly: boolean;
  lifted: boolean;
  onPress: (slot: number, event: ReactPointerEvent) => void;
  onClick: (slot: number, at: number) => void;
  onEnter: (slot: number, pointerType: string) => void;
  onLeave: (pointerType: string) => void;
  onKey: (slot: number, at: number) => void;
}) {
  const at = faceAt(slot, layers);
  const face = faceOf(code);
  const { faceWidth: w, faceHeight: h, depth } = MAHJONG_TILE;
  /* What lies over the face: the wash of a blocked tile or of a free match, and one ring, the chosen's before the hint's before Find's. */
  const wash = found === "free" ? MAHJONG_TILE.foundWash : showFree && !free ? MAHJONG_TILE.blockedWash : "none";
  const ring = chosen ? MAHJONG_TILE.chosenRing : hinted ? MAHJONG_TILE.hinted : found !== null ? MAHJONG_TILE.found : "none";
  const held = !chosen && !hinted && found === "held";
  const inset = held ? 1.5 : 1;
  const marked = wash !== "none" || ring !== "none";
  return (
    <g
      transform={`translate(${at.x} ${at.y})`}
      display={present ? undefined : "none"}
      style={{ transformBox: "fill-box", opacity: lifted ? 0.35 : 1, cursor: readOnly ? undefined : free ? "pointer" : "not-allowed" }}
      data-slot={present ? index : undefined}
      data-face={present ? code : undefined}
      data-free={present ? (free ? "true" : "false") : undefined}
      data-chosen={present && chosen ? "true" : undefined}
      data-hinted={present && hinted ? "true" : undefined}
      data-found={present ? (found ?? undefined) : undefined}
      data-testid="mahjong-tile"
      role={present && !readOnly ? "button" : undefined}
      tabIndex={present && !readOnly && free ? 0 : undefined}
      aria-label={present && face !== null ? `${faceWords(face)}${free ? "" : ", blocked"}` : undefined}
      aria-pressed={present && !readOnly ? chosen : undefined}
      onPointerDown={(event) => onPress(index, event)}
      onPointerEnter={(event) => onEnter(index, event.pointerType)}
      onPointerLeave={(event) => onLeave(event.pointerType)}
      onClick={(event) => onClick(index, event.timeStamp)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onKey(index, event.timeStamp);
      }}
    >
      {/* A raised tile's shadow on what lies under it: the higher, the darker, so the layers read at a glance. */}
      {slot.z > 0 ? <rect x={-depth * 2} y={depth * 2} width={w} height={h} rx={4} pointerEvents="none" fill={MAHJONG_TILE.shadow} opacity={Math.min(0.5, 0.18 + slot.z * 0.06)} /> : null}
      <rect x={-depth} y={depth} width={w} height={h} rx={3} fill={MAHJONG_TILE.side} stroke={MAHJONG_TILE.sideEdge} strokeWidth={0.8} />
      <rect x={0} y={0} width={w} height={h} rx={3} fill={chosen ? MAHJONG_TILE.chosen : MAHJONG_TILE.face} stroke={MAHJONG_TILE.rim} strokeWidth={0.8} />
      <use href={`#${faceSymbolId(prefix, code)}`} width={w} height={h} />
      <rect
        x={inset}
        y={inset}
        width={w - 2 * inset}
        height={h - 2 * inset}
        rx={2.5}
        display={marked ? undefined : "none"}
        fill={wash}
        stroke={ring}
        strokeWidth={held ? 1.8 : 2.6}
        strokeDasharray={held ? "3 2.4" : undefined}
        pointerEvents="none"
      />
    </g>
  );
});

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
  capped = true,
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
  /**
   * Never taller than most of the window (the default; `mahjongMaxWidth`). A board looked at through the zoom
   * (`TsunagiViewport`) is as wide as the zoom makes it and its box carries the cap instead, so it is not capped here.
   */
  capped?: boolean;
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
  /* The latest of the handlers below, which the tiles reach through functions that never change. */
  const latest = useRef<{ tapped: (slot: number, at: number) => void; pressed: (slot: number, event: ReactPointerEvent) => void; onPoint?: (slot: number | null) => void; readOnly: boolean } | null>(null);
  const handlers = useMemo(
    () => ({
      press: (slot: number, event: ReactPointerEvent) => latest.current?.pressed(slot, event),
      click: (slot: number, at: number) => {
        if (!swallow.current) latest.current?.tapped(slot, at);
      },
      enter: (slot: number, pointerType: string) => {
        if (latest.current?.readOnly === false && pointerType === "mouse") latest.current.onPoint?.(slot);
      },
      leave: (pointerType: string) => {
        if (latest.current?.readOnly === false && pointerType === "mouse") latest.current.onPoint?.(null);
      },
      key: (slot: number, at: number) => latest.current?.tapped(slot, at),
    }),
    [],
  );

  const free = useMemo(() => (geometry === null ? [] : [...cells].map((_, slot) => isFree(geometry, cells, slot))), [geometry, cells]);
  const hintedSet = useMemo(() => new Set(hinted), [hinted]);
  const foundFree = useMemo(() => new Set(found?.free ?? []), [found]);
  const foundHeld = useMemo(() => new Set(found?.blocked ?? []), [found]);
  /* Far to near: layer by layer, back row first, right to left along a row. */
  const order = useMemo(() => (layout === null ? [] : layout.slots.map((slot, index) => ({ slot, index })).sort((a, b) => a.slot.z - b.slot.z || a.slot.y - b.slot.y || b.slot.x - a.slot.x)), [layout]);

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

  /*
   * The tiles' handlers are the same functions for the life of the board and call the latest of the ones above, so a
   * tile whose own marks have not changed is not drawn again when another is chosen: the Palace has 576, and drawing
   * them all for every tap was most of what a tap cost.
   */
  // Before the next press can come, so a second tap straight after the first sees the tiles the first freed.
  useLayoutEffect(() => {
    latest.current = { tapped, pressed, onPoint, readOnly };
  });

  if (layout === null) return null;

  // As many rows of square cells as the layout's height takes, a fraction included, so the wood fits the tiles all round.
  const rows = (layout.size * box.height) / box.width;
  return (
    // Never taller than most of the window: a tall layout (the Torii) is narrowed to fit rather than scrolled past.
    <div className={`${PLAY_SURFACE} relative mx-auto w-full`} style={capped ? { maxWidth: mahjongMaxWidth(size) } : undefined} data-testid="mahjong-board-frame">
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
            const present = code !== undefined && code !== EMPTY_SLOT;
            // A tile taken stays on the page, hidden, so Undo shows it again by an attribute alone (`MahjongTile`).
            return (
              <MahjongTile
                key={index}
                index={index}
                slot={slot}
                layers={layers}
                code={present ? code : FIRST_FACE}
                present={present}
                prefix={prefix}
                free={free[index]!}
                chosen={present && chosen === index}
                hinted={present && hintedSet.has(index)}
                found={!present ? null : foundFree.has(index) ? "free" : foundHeld.has(index) ? "held" : null}
                showFree={showFree}
                readOnly={readOnly}
                lifted={dragging?.slot === index}
                onPress={handlers.press}
                onClick={handlers.click}
                onEnter={handlers.enter}
                onLeave={handlers.leave}
                onKey={handlers.key}
              />
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
