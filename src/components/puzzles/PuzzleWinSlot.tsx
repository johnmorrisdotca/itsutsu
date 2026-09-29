"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * WHERE A PUZZLE'S WIN COVER GOES: the board's own cell, marked by the solve
 * screen, found by the card at the end.
 *
 * The two ends of the cover live apart. `SolveDone` knows the result — solved
 * or not, the time, the XP when it arrives, the way on — and `SolvePaused` owns
 * the place over the board, where Pause's cover already goes. Held above every
 * kind's solve (`PuzzlePlay`), this joins them: the board's cell registers
 * itself here (`WinSlot`), and the card at the end draws its cover into it
 * (`useWinSlot`, through a portal). No solve screen passes anything, and a
 * word puzzle whose board becomes its replay at the end marks the replay's cell
 * the same way.
 *
 * With no provider above — a page that draws a solve some other way — there
 * is no slot, and the card at the end is all there is, as before.
 */
const WinSlotContext = createContext<{ slot: HTMLElement | null; mark: (node: HTMLElement | null) => void } | null>(null);

export function WinSlotProvider({ children }: { children: ReactNode }) {
  const [slot, mark] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ slot, mark }), [slot]);
  return <WinSlotContext.Provider value={value}>{children}</WinSlotContext.Provider>;
}

/** The element the cover is drawn into, once a board has marked one. */
export function useWinSlot(): HTMLElement | null {
  return useContext(WinSlotContext)?.slot ?? null;
}

/**
 * A board with room for its win cover: the board and the slot share one grid
 * cell, and the slot draws nothing of its own (`contents`), so the cover drawn
 * into it lies exactly over the board.
 */
export function WinStack({ children, hidden = false }: { children: ReactNode; /** Paused: the board stays where it is and only stops being drawn. */ hidden?: boolean }) {
  const context = useContext(WinSlotContext);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)]">
      <div className={`col-start-1 row-start-1 min-w-0 ${hidden ? "invisible" : ""}`} aria-hidden={hidden || undefined} data-wallpaper-board>
        {children}
      </div>
      <div ref={context?.mark} className="contents" data-testid="win-slot" />
    </div>
  );
}
