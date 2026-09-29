"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SeatColours } from "@/lib/pieces/seatColours";

/**
 * The colour each side of the game on this page chose for its pieces, for the
 * things that draw a side's piece beside the board rather than on it — whose
 * turn it is, the players' names — so they show the stone the board shows.
 * Empty where nobody chose, which draws everything as it always was.
 */
const StoneColours = createContext<SeatColours>({});

export function StoneColoursProvider({ colours, children }: { colours: SeatColours; children: ReactNode }) {
  return <StoneColours.Provider value={colours}>{children}</StoneColours.Provider>;
}

export function useStoneColours(): SeatColours {
  return useContext(StoneColours);
}
