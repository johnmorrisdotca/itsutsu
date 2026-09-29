"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import type { PieceColour } from "@/lib/pieces/pieceColours";
import { tableColoursFrom, tableMarbles, type TableColours } from "@/lib/pieces/tableColours";

import { PARTY_MARBLES } from "./party.constants";
import type { PartyMarble } from "./party.types";

/**
 * THE MARBLES AT THIS TABLE: the party colours, with each place's own chosen
 * colour over its default (`tableColours.ts`). Everything at a table that
 * draws a player's colour — a marble in its hole, a chip beside a name, a
 * claimed box, a laid block, a home tinted — reads its marble here, so one
 * choice reaches all of them. Outside a table (a card on My games, a rules
 * picture) nothing is chosen and the table colours stand.
 */
type TableColoursValue = {
  colours: TableColours;
  /** How a place changes its colour at this table, or null where nothing here may change one. */
  choose: ((seat: number, colour: PieceColour | null) => void) | null;
};

const TableColoursContext = createContext<TableColoursValue>({ colours: [], choose: null });

export function PartyColoursProvider({
  colours,
  choose = null,
  children,
}: {
  colours: TableColours;
  choose?: TableColoursValue["choose"];
  children: ReactNode;
}) {
  const value = useMemo(() => ({ colours, choose }), [colours, choose]);
  return <TableColoursContext.Provider value={value}>{children}</TableColoursContext.Provider>;
}

/** Every place's marble, as this table shows it. */
export function usePartyMarbles(): readonly PartyMarble[] {
  const { colours } = useContext(TableColoursContext);
  return useMemo(() => tableMarbles(PARTY_MARBLES, colours), [colours]);
}

/** This table's colours and how a place changes its own (`PartySeatColour`). */
export function usePartyTable(): TableColoursValue {
  return useContext(TableColoursContext);
}

/**
 * A pass-and-play table's colours, for everything inside it: the table's own
 * game component, its set-up and its board. Kept in this browser under the
 * table's own name (`useTableColours`).
 */
export function PartyColoursTable({ tableKey, children }: { tableKey: string; children: ReactNode }) {
  const { colours, choose } = useTableColours(`itsutsu.partyColours.${tableKey}`);
  return (
    <PartyColoursProvider colours={colours} choose={choose}>
      {children}
    </PartyColoursProvider>
  );
}

const EVENT = "itsutsu:partyColours";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(changed: () => void): () => void {
  window.addEventListener(EVENT, changed);
  window.addEventListener("storage", changed);
  return () => {
    window.removeEventListener(EVENT, changed);
    window.removeEventListener("storage", changed);
  };
}

/**
 * A pass-and-play table's colours, kept in this browser under the table's
 * name, so the places keep their colours from one game
 * to the next at the same table — as the names are kept — and a table that
 * refuses storage simply draws the party colours.
 */
function useTableColours(storageKey: string): { colours: TableColours; choose: (seat: number, colour: PieceColour | null) => void } {
  const key = storageKey;
  const stored = useSyncExternalStore(subscribe, () => read(key), () => null);
  const colours = useMemo<TableColours>(() => {
    try {
      return tableColoursFrom(stored === null ? [] : JSON.parse(stored), PARTY_MARBLES.length);
    } catch {
      return tableColoursFrom([], PARTY_MARBLES.length);
    }
  }, [stored]);
  const choose = useCallback(
    (seat: number, colour: PieceColour | null) => {
      const next = colours.map((each, at) => (at === seat ? colour : each));
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Not remembered; nothing else changes.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [colours, key],
  );
  return { colours, choose };
}
