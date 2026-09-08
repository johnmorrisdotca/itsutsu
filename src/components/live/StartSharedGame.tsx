"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { seatPath } from "@/lib/gomoku/slugs";
import { Button, Field, SectionTitle, Select, Toggle } from "@/components/ui/Controls";
import { GAME_COPY } from "@/components/game/game.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import {
  MOVE_TIME_OPTIONS,
  SHARED_OPENINGS,
  TIMEOUT_PENALTIES,
  type TimeoutPenalty,
} from "@/lib/history/gameSettingsSchema";
import type { CreatedGame } from "@/lib/history/liveGame.types";
import { describeRules } from "./rulesSummary";

/**
 * Starts a game that lives on the server and can be played from two devices.
 *
 * The creator lands on their own seat link, holding both — the other seat's
 * link is theirs to hand over, which is what stands in for an invitation when
 * there is nobody to send an email to.
 */
export function StartSharedGame({ settings }: { settings: GameSettings }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveTimeMs, setMoveTimeMs] = useState<number | null>(null);
  const [clockMode, setClockMode] = useState<"move" | "game">("move");
  const [rated, setRated] = useState(true);
  const [timeoutPenalty, setTimeoutPenalty] = useState<TimeoutPenalty>("turn");
  const [allowResign, setAllowResign] = useState(true);
  const [open, setOpen] = useState(false);
  // Swap openings move colours between players, which a seat link cannot follow.
  const sharedOpening = SHARED_OPENINGS.includes(settings.opening)
    ? settings.opening
    : OPENING_RULES.free;

  async function start() {
    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: settings.size,
          variant: settings.variant,
          obstacles: settings.obstacles,
          opening: sharedOpening,
          handicap: settings.handicap.stone === null ? null : settings.handicap,
          moveTimeMs,
          timeoutPenalty,
          clockMode,
          rated,
          allowResign,
          open,
        }),
      });

      if (!response.ok) throw new Error("The game could not be started.");

      const created = (await response.json()) as CreatedGame;
      router.push(seatPath(settings.variant, created.id, created.blackToken));
    } catch {
      setError("Could not start a shared game. Try again.");
      setStarting(false);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle kanji="通信対局">Play apart</SectionTitle>
      <p className="text-xs text-muted">
        The board here is a local game and stays in this browser. A shared game
        gets its own address and a QR code for each player, so you can take
        turns from two devices.
      </p>
      <p className="text-xs text-ink-soft" data-testid="shared-rules-summary">
        {describeRules({ ...settings, opening: sharedOpening })}
        {sharedOpening !== settings.opening ? ` ${GAME_COPY.sharedOpeningNote}` : ""}
      </p>
      <Field label={GAME_COPY.moveTime.label} hint={GAME_COPY.moveTimeHint}>
        <Select
          value={moveTimeMs === null ? "none" : String(moveTimeMs)}
          onChange={(event) =>
            setMoveTimeMs(event.target.value === "none" ? null : Number(event.target.value))
          }
          data-testid="shared-move-time"
        >
          {MOVE_TIME_OPTIONS.map((option) => (
            <option key={option ?? "none"} value={option === null ? "none" : option}>
              {describeMoveTime(option)}
            </option>
          ))}
        </Select>
      </Field>
      {moveTimeMs !== null ? (
        <Field label="Clock" hint={clockMode === "game" ? "One budget each for the whole game; it counts down and never resets." : "The limit is for each move and starts again every turn."}>
          <Select value={clockMode} onChange={(event) => setClockMode(event.target.value as "move" | "game")} data-testid="shared-clock-mode">
            <option value="move">Time is per move</option>
            <option value="game">Time is for the whole game</option>
          </Select>
        </Field>
      ) : null}
      {moveTimeMs !== null && clockMode === "move" ? (
        <Field label={GAME_COPY.penalty.label} hint={GAME_COPY.penaltyHint}>
          <Select
            value={timeoutPenalty}
            onChange={(event) => setTimeoutPenalty(event.target.value as TimeoutPenalty)}
            data-testid="shared-penalty"
          >
            {TIMEOUT_PENALTIES.map((option) => (
              <option key={option} value={option}>
                {option === "turn" ? GAME_COPY.penaltyTurn : option === "game" ? GAME_COPY.penaltyGame : GAME_COPY.penaltyStrict}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Ratings" hint="A friendly game is filed like any other, but moves nobody's rating.">
        <Select value={rated ? "rated" : "friendly"} onChange={(event) => setRated(event.target.value === "rated")} data-testid="shared-rated">
          <option value="rated">Game will affect ratings</option>
          <option value="friendly">Game will NOT affect ratings</option>
        </Select>
      </Field>
      <Toggle
        label={GAME_COPY.allowResign.label}
        hint={GAME_COPY.allowResignHint}
        checked={allowResign}
        onChange={setAllowResign}
      />
      <Toggle
        label={GAME_COPY.openSeat.label}
        hint={GAME_COPY.openSeatHint}
        checked={open}
        onChange={setOpen}
      />
      <Button onClick={start} disabled={starting} data-testid="start-shared-game">
        {starting ? "Starting…" : "Start a shared game"}
      </Button>
      {error !== null ? (
        <p className="text-xs text-shu">{error}</p>
      ) : null}
    </section>
  );
}
