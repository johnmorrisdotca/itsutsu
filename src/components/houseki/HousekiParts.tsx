"use client";

import type { ReactNode } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { HousekiColour } from "@/lib/houseki/houseki.constants";

import { MiniGem } from "./HousekiWell";

/** A figure with its name: the score, the best chain, the pieces left. */
export function Stat({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  return (
    <span className="flex items-baseline gap-1.5 text-sm" data-testid={testId}>
      <span className="text-xs text-muted">{label}</span>
      <output className="font-semibold tabular-nums">{value}</output>
    </span>
  );
}

/** The row of figures over a board. */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="houseki-stats">
      {children}
    </div>
  );
}

/** How far along a goal is: its words, and a bar that says so without them. */
export function GoalBar({ text, done, total }: { text: string; done: number; total: number }) {
  return (
    <div className="flex flex-col gap-1" data-testid="houseki-goal" data-done={done} data-total={total}>
      <p className="text-sm font-medium">{text}</p>
      <progress className="h-2 w-full accent-[var(--moss)]" max={Math.max(1, total)} value={Math.min(done, total)} aria-label={text} />
    </div>
  );
}

/** The pieces that come next, as the engine has them queued, with their colours named for a screen reader. */
export function NextPieces({ label, pieces, round = true, vertical = true }: { label: string; pieces: readonly (readonly { colour: HousekiColour; magnetic?: boolean }[])[]; round?: boolean; vertical?: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid="houseki-next">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-3">
        {pieces.map((piece, index) => (
          <div
            key={index}
            className={`flex ${vertical ? "flex-col" : "flex-row flex-wrap"} gap-0.5 ${piece.length === 4 ? "w-[3.7rem] flex-row" : ""}`}
            aria-label={`${label} ${index + 1}: ${piece.map((gem) => gem.colour).join(", ")}`}
            data-testid="houseki-next-piece"
          >
            {piece.map((gem, at) => (
              <MiniGem key={at} colour={gem.colour} magnetic={gem.magnetic === true} round={round} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ONE PRESS OF A GAME'S CONTROLS. A press that is held (Left, Right, Down) starts
 * on the finger or the mouse going down and stops on its coming up, as the
 * package's input scheduler expects; any other is an ordinary press.
 */
export function ControlButton({
  label,
  testId,
  onPress,
  onHold,
  disabled = false,
  strong = false,
  hidden = false,
  title,
}: {
  label: ReactNode;
  testId: string;
  /** A press, once. */
  onPress?: () => void;
  /** A press that is held: called with true when it goes down and false when it comes up. */
  onHold?: (held: boolean) => void;
  disabled?: boolean;
  strong?: boolean;
  hidden?: boolean;
  title?: string;
}) {
  if (hidden) return null;
  const look = `${BUTTON_BASE} ${strong ? BUTTON_STRONG : BUTTON_QUIET} min-w-[3.25rem] touch-manipulation`;
  if (onHold !== undefined) {
    return (
      <button
        type="button"
        className={look}
        disabled={disabled}
        title={title}
        data-testid={testId}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          onHold(true);
        }}
        onPointerUp={() => onHold(false)}
        onPointerCancel={() => onHold(false)}
        onLostPointerCapture={() => onHold(false)}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
            event.preventDefault();
            onHold(true);
          }
        }}
        onKeyUp={(event) => {
          if (event.key === "Enter" || event.key === " ") onHold(false);
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button type="button" className={look} disabled={disabled} title={title} data-testid={testId} onClick={onPress}>
      {label}
    </button>
  );
}

/** The row of presses under a board. */
export function Controls({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label} data-testid="houseki-controls">
      {children}
    </div>
  );
}

/**
 * THE BOARD'S COLUMN, as the size chooser and just the board find it: the board
 * is the column (`data-scale-board`) and what plays it (the figures over it, the
 * presses under it) are its neighbours in the page, so that from a laptop's
 * width the neighbours stand in a column beside the board (`data-scale-stack`),
 * where a bigger board or the modal never pushes them off the foot of the
 * screen. Marked the way a puzzle's board is (`SolvePaused`).
 */
export function BoardColumn({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full min-w-0" data-testid="houseki-board" data-scale-board data-scale-stack data-bare-board>
      {children}
    </div>
  );
}
