"use client";

import { readClock } from "@/lib/clock/clock";
import { CLOCK_URGENT_MS } from "@/lib/clock/clock.constants";
import { seatToPlay } from "@/lib/gomoku/engine";
import { GAME_STATUS, SEAT_DISPLAY, SEATS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Seat } from "@/lib/gomoku/gomoku.types";
import { SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GameSession } from "./game.types";

/**
 * Both clocks, side by side.
 *
 * The seat on move is the one highlighted, and a clock inside its last few
 * seconds turns urgent — which is the only warning a player in byoyomi gets
 * before the flag falls.
 */
export function GameClock({ session }: { session: GameSession }) {
  const active = seatToPlay(session.state);
  const running = session.state.status === GAME_STATUS.playing;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle kanji={GAME_COPY.clock.kanji}>
        {GAME_COPY.clock.label}
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(SEATS).map((seat) => (
          <ClockFace
            key={seat}
            session={session}
            seat={seat}
            active={running && seat === active}
          />
        ))}
      </div>
    </section>
  );
}

function ClockFace({
  session,
  seat,
  active,
}: {
  session: GameSession;
  seat: Seat;
  active: boolean;
}) {
  const clock = session.clocks[seat];
  const { time, byoyomi, periodsLeft } = readClock(clock);
  const stone = session.state.seats.black === seat ? "black" : "white";
  const name = session.names[seat].trim() || SEAT_DISPLAY[seat].label;

  const urgent =
    !clock.flagged &&
    (byoyomi ? clock.periodMs : clock.mainMs) <= CLOCK_URGENT_MS;

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border px-3 py-2 transition-colors ${
        clock.flagged
          ? "border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/50"
          : active
            ? "border-zinc-900 bg-white/80 dark:border-zinc-100 dark:bg-zinc-900/70"
            : "border-rule"
      }`}
      data-testid={`clock-${seat}`}
      data-active={active}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${
            stone === "black"
              ? "bg-zinc-900 dark:bg-zinc-100"
              : "border border-zinc-400 bg-white"
          }`}
        />
        <span className="truncate">{name}</span>
        <span className="font-mincho">{STONE_DISPLAY[stone].kanji}</span>
      </span>

      <span
        className={`font-mono text-2xl leading-none tabular-nums ${
          clock.flagged
            ? "text-rose-600 dark:text-rose-300"
            : urgent
              ? "text-amber-600 dark:text-amber-400"
              : ""
        }`}
      >
        {clock.flagged ? "0.0" : time}
      </span>

      {byoyomi && !clock.flagged ? (
        <span className="text-[0.65rem] text-muted">
          {GAME_COPY.byoyomi.kanji} × {periodsLeft}
        </span>
      ) : null}
      {clock.flagged ? (
        <span className="text-[0.65rem] font-semibold text-rose-600 dark:text-rose-300">
          {GAME_COPY.outOfTime}
        </span>
      ) : null}
    </div>
  );
}
