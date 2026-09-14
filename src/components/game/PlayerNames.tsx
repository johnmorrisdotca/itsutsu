"use client";

import { useId } from "react";

import { SEAT_DISPLAY, SEATS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Seat } from "@/lib/gomoku/gomoku.types";
import { INPUT_CLASS } from "@/components/ui/ui.constants";
import { SectionTitle } from "@/components/ui/Controls";
import { PlayerNameInput } from "./PlayerNameInput";
import type { GamePanelProps } from "./game.types";

/** The colour a seat is holding at this moment, which a swap can change. */
function colourOf(seats: Record<string, Seat>, seat: Seat) {
  return seats.black === seat ? "black" : "white";
}

export function PlayerNames({ session, actions }: GamePanelProps) {
  const ids = useId();
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle kanji="対局者">Players</SectionTitle>
      {Object.values(SEATS).map((seat) => {
        const stone = colourOf(session.state.seats, seat);
        const inputId = `${ids}-${seat}-name`;
        const stoneId = `${ids}-${seat}-stone`;
        return (
          /*
            The box is NAMED by its seat and DESCRIBED by the stone that seat
            is holding. Both used to sit inside one label, so the name was
            "Player 1 黒". The row keeps its three pieces in the same flex
            line — the label now points at the box by id instead of wrapping
            it, which is what lets the kanji stay beside the name while being
            no part of it. See `Field` in Controls.tsx for the rule.
          */
          <div key={seat} className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm text-ink-soft">
              <span
                aria-hidden="true"
                className={`size-2.5 rounded-full ${
                  stone === "black"
                    ? "bg-ink"
                    : "border border-rule-strong bg-ivory"
                }`}
              />
              <label htmlFor={inputId}>{SEAT_DISPLAY[seat].label}</label>
              <span id={stoneId} className="text-xs text-muted">
                {STONE_DISPLAY[stone].kanji}
              </span>
            </span>
            <PlayerNameInput
              id={inputId}
              describedBy={stoneId}
              className={INPUT_CLASS}
              value={session.names[seat]}
              placeholder={SEAT_DISPLAY[seat].label}
              onChange={(name) => actions.setName(seat, name)}
            />
          </div>
        );
      })}
    </section>
  );
}
