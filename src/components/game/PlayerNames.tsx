"use client";

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
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle kanji="対局者">Players</SectionTitle>
      {Object.values(SEATS).map((seat) => {
        const stone = colourOf(session.state.seats, seat);
        return (
          <label key={seat} className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm text-ink-soft">
              <span
                aria-hidden="true"
                className={`size-2.5 rounded-full ${
                  stone === "black"
                    ? "bg-ink"
                    : "border border-rule-strong bg-ivory"
                }`}
              />
              {SEAT_DISPLAY[seat].label}
              <span className="text-xs text-muted">
                {STONE_DISPLAY[stone].kanji}
              </span>
            </span>
            <PlayerNameInput
              className={INPUT_CLASS}
              value={session.names[seat]}
              placeholder={SEAT_DISPLAY[seat].label}
              onChange={(name) => actions.setName(seat, name)}
            />
          </label>
        );
      })}
    </section>
  );
}
