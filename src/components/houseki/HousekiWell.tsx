"use client";

import { useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { BOARD_THEMES, FELTS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { BoardFrame } from "@/components/board/BoardFrame";
import { HOUSEKI_GEMS, type HousekiColour } from "@/lib/houseki/houseki.constants";

/**
 * A GEM, ONE OF THE PACKAGE'S SIX, in its own colour and with the symbol that
 * is always on it, so no colour is told from another by colour alone. Round on a
 * board of stones, a cut square on a full board of gems; a magnetic stone wears
 * a ring.
 */
export type WellGem = { id?: number; colour: HousekiColour; magnetic?: boolean; marked?: boolean; /** A special gem's mark (Gem Swap): a beam, a bomb, a burst. */ glyph?: string };

/** What else a cell can be showing: a group chosen, a hint, an effect's preview, a stone about to leave. */
export type CellState = "selected" | "hint" | "preview" | "marked" | "removing" | "impact" | "target";

export type WellCell = {
  /** The stone or gem settled there. */
  gem?: WellGem;
  /** The piece in the air. */
  active?: WellGem;
  /** Where the piece will land, drawn behind it. */
  ghost?: WellGem;
  /** A gem that is about to fall into this cell, once the board has settled. */
  falling?: WellGem;
  state?: CellState;
  /** The neighbours this gem is bonded to (Magnetic Blocks), drawn as a bar towards each. */
  bonds?: { left?: boolean; right?: boolean; up?: boolean; down?: boolean };
  /** A cell the board does not have (a shaped board's hole). */
  hole?: boolean;
};

const STATE_RING: Record<CellState, string> = {
  selected: "ring-[3px] ring-ink",
  hint: "ring-[3px] ring-moss",
  preview: "ring-[3px] ring-ink/60",
  marked: "opacity-60 ring-[3px] ring-ink/70",
  removing: "opacity-30 scale-75",
  impact: "ring-[3px] ring-red-600",
  target: "ring-[3px] ring-amber-500",
};

/** One gem, drawn to the cell it sits in. */
export function Gem({ gem, role, round = true }: { gem: WellGem; role: "settled" | "active" | "ghost" | "falling" | "mini"; round?: boolean }) {
  const look = HOUSEKI_GEMS[gem.colour];
  const style: CSSProperties = role === "ghost" || role === "falling" ? { borderColor: look.fill, color: look.fill } : { background: look.fill };
  const ring = gem.magnetic === true ? "ring-2 ring-slate-300 ring-offset-1 ring-offset-transparent" : "";
  const shape = round ? "rounded-full" : "rounded-[22%]";
  return (
    <span
      className={`absolute top-1/2 right-[7%] left-[7%] aspect-square -translate-y-1/2 flex items-center justify-center ${shape} font-semibold leading-none select-none ${ring} ${
        role === "ghost" ? "border-2 border-dashed bg-transparent opacity-60" : role === "falling" ? "border-2 border-dotted bg-transparent opacity-50" : "text-white shadow-[inset_0_-3px_4px_rgba(0,0,0,0.25),inset_0_2px_3px_rgba(255,255,255,0.3)]"
      } ${role === "active" ? "outline-2 outline-offset-1 outline-white/80" : ""} text-[length:var(--gem-font)]`}
      style={style}
      data-gem={gem.colour}
      data-role={role}
      data-id={gem.id}
      aria-hidden="true"
    >
      {look.symbol}
      {gem.magnetic === true ? <small className="absolute -top-1 -right-1 text-[0.6em] text-slate-100 drop-shadow">✧</small> : null}
      {gem.glyph === undefined ? null : <small className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/25 text-[1.15em] font-bold text-white">{gem.glyph}</small>}
    </span>
  );
}

/** The bars of a gem's bonds, from its middle to the edge it is bonded across. */
function Bonds({ bonds }: { bonds: NonNullable<WellCell["bonds"]> }) {
  const bar = "absolute z-[1] bg-white/80";
  return (
    <>
      {bonds.right === true ? <span className={`${bar} top-[42%] right-[-6%] h-[16%] w-[26%]`} aria-hidden="true" /> : null}
      {bonds.left === true ? <span className={`${bar} top-[42%] left-[-6%] h-[16%] w-[26%]`} aria-hidden="true" /> : null}
      {bonds.down === true ? <span className={`${bar} bottom-[-6%] left-[42%] h-[26%] w-[16%]`} aria-hidden="true" /> : null}
      {bonds.up === true ? <span className={`${bar} top-[-6%] left-[42%] h-[26%] w-[16%]`} aria-hidden="true" /> : null}
    </>
  );
}

/** A small gem for the queue of pieces to come. */
export function MiniGem({ colour, magnetic = false, round = true }: { colour: HousekiColour; magnetic?: boolean; round?: boolean }) {
  const look = HOUSEKI_GEMS[colour];
  return (
    <span
      className={`relative flex size-7 items-center justify-center ${round ? "rounded-full" : "rounded-[22%]"} text-sm font-semibold text-white shadow-[inset_0_-2px_3px_rgba(0,0,0,0.25)] ${magnetic ? "ring-2 ring-slate-300" : ""}`}
      style={{ background: look.fill }}
      data-gem={colour}
      data-role="mini"
      aria-hidden="true"
    >
      {look.symbol}
    </span>
  );
}

/** The wood or the felt this reader's boards are dressed in, as every table here is (`tableTheme`). */
function themeFor(appearance: Appearance) {
  return appearance.felt !== "wood" ? FELTS[appearance.felt] : BOARD_THEMES[appearance.boardTheme];
}

/** How wide a cell may be at most, so a narrow well is never a tall stripe on a wide page. */
export const CELL_MOST_REM = 3.1;

/**
 * THE PLAYING AREA OF A HOUSEKI GAME: columns by rows of square cells, in the
 * wood the reader plays on (`BoardFrame`: "every board is the same board").
 * `hidden` rows are the entry rows above a falling game's well, drawn
 * shorter, where a new piece appears. Which cell is what is the game's own,
 * given as `cells`; this only draws them, and a press on one (`onCell`) is
 * the game's to answer.
 */
export function HousekiWell({
  cols,
  rows,
  hidden = 0,
  cells,
  appearance,
  label,
  onCell,
  round = true,
  phase,
  fit = false,
  children,
}: {
  cols: number;
  rows: number;
  /** Entry rows above the well, of which each is drawn 0.42 as tall as a row of it. */
  hidden?: number;
  cells: readonly WellCell[];
  appearance: Appearance;
  /** The board's name for a screen reader, which says nothing of its cells (each says its own). */
  label: string;
  /** A press on a cell, by its place in `cells`; absent for a board that is only looked at. */
  onCell?: (index: number) => void;
  round?: boolean;
  phase?: string;
  /** Fit the well into the box it is in, whatever its shape, instead of the page's width (the set-up's preview, which keeps one box for every board). */
  fit?: boolean;
  children?: ReactNode;
}) {
  const theme = themeFor(appearance);
  const firstCell = Math.max(0, cells.findIndex((cell) => cell.hole !== true));
  const [focus, setFocus] = useState(firstCell);
  const entry = hidden * 0.42;
  const rowUnits = rows + entry;
  const cellLabel = (cell: WellCell, index: number) => {
    const row = Math.floor(index / cols) - hidden + 1;
    const column = (index % cols) + 1;
    const gem = cell.gem ?? cell.active;
    return `${gem === undefined ? "empty" : `${gem.colour} gem`}, column ${column}, row ${row}`;
  };
  /** The arrow keys move among a board of buttons, one of them in the tab order at a time (a roving focus). */
  const move = (event: ReactKeyboardEvent) => {
    const step = event.key === "ArrowLeft" ? [-1, 0] : event.key === "ArrowRight" ? [1, 0] : event.key === "ArrowUp" ? [0, -1] : event.key === "ArrowDown" ? [0, 1] : null;
    if (step === null || onCell === undefined) return;
    let column = (focus % cols) + step[0]!;
    let row = Math.floor(focus / cols) + step[1]!;
    while (column >= 0 && column < cols && row >= 0 && row < rows) {
      const next = row * cols + column;
      if (cells[next]?.hole !== true) {
        event.preventDefault();
        setFocus(next);
        (event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-cell="${next}"]`)?.focus();
        return;
      }
      column += step[0]!;
      row += step[1]!;
    }
  };
  return (
    <div
      className={`mx-auto w-full ${fit ? "" : "max-w-(--houseki-fit) [--houseki-room:14rem] md:[--houseki-room:18rem]"}`}
      style={
        {
          ...(fit ? { maxWidth: `min(100cqw, calc(100cqh * ${cols / rowUnits}))` } : { "--houseki-fit": `min(${cols * CELL_MOST_REM}rem, calc((100dvh - var(--houseki-room)) * ${cols / rowUnits}))` }),
          "--suido-ratio": cols / rowUnits,
          "--tall-reserve": "12.5rem",
        } as unknown as CSSProperties
      }
      /* A well taller than it is wide is held to what the window's height can show of it, and in just the board is as wide as its height allows (globals.css, which Suido's tall boards use too). */
      data-suido-tall={rowUnits > cols ? "" : undefined}
      data-testid="houseki-well"
      data-cols={cols}
      data-rows={rows}
      data-hidden={hidden}
      data-phase={phase}
    >
      <BoardFrame size={cols} rows={rowUnits} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false}>
        <div className="absolute inset-0" style={{ containerType: "inline-size" }}>
        <div
          role={onCell === undefined ? "img" : "group"}
          aria-label={label}
          className="absolute inset-0 grid"
          onKeyDown={onCell === undefined ? undefined : move}
          style={
            {
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `${hidden > 0 ? `repeat(${hidden}, 0.42fr) ` : ""}repeat(${rows}, minmax(0, 1fr))`,
              "--gem-font": `calc(100cqw / ${cols} * 0.48)`,
            } as CSSProperties
          }
        >
          {cells.map((cell, index) => {
            const inEntry = index < hidden * cols;
            const draw = cell.active ?? cell.gem;
            const body = (
              <>
                {cell.bonds === undefined ? null : <Bonds bonds={cell.bonds} />}
                {cell.ghost !== undefined && draw === undefined ? <Gem gem={cell.ghost} role="ghost" round={round} /> : null}
                {cell.falling !== undefined && draw === undefined ? <Gem gem={cell.falling} role="falling" round={round} /> : null}
                {draw !== undefined ? <Gem gem={draw} role={cell.active !== undefined ? "active" : "settled"} round={round} /> : null}
              </>
            );
            const base = `relative min-h-0 min-w-0 ${inEntry ? "bg-black/10" : "border border-black/10 bg-black/[0.07]"} ${cell.hole === true ? "invisible" : ""} ${
              cell.state === undefined ? "" : `${STATE_RING[cell.state]} z-10 rounded-md`
            }`;
            if (onCell === undefined || cell.hole === true) {
              return (
                <div key={index} className={base} data-cell={index} aria-label={cellLabel(cell, index)}>
                  {body}
                </div>
              );
            }
            return (
              <button
                key={index}
                type="button"
                className={`${base} cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-moss`}
                data-cell={index}
                data-state={cell.state}
                aria-label={cellLabel(cell, index)}
                tabIndex={index === focus ? 0 : -1}
                onFocus={() => setFocus(index)}
                onClick={() => onCell(index)}
              >
                {body}
              </button>
            );
          })}
          {children}
        </div>
        </div>
      </BoardFrame>
    </div>
  );
}
