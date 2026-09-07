"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "@/components/game/game.constants";
import { SHARED_OPENINGS } from "@/lib/history/gameSettingsSchema";
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
        }),
      });

      if (!response.ok) throw new Error("The game could not be started.");

      const created = (await response.json()) as CreatedGame;
      router.push(`/g/${created.id}?p=${created.blackToken}`);
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
      <p className="text-xs text-zinc-700 dark:text-zinc-200" data-testid="shared-rules-summary">
        {describeRules({ ...settings, opening: sharedOpening })}
        {sharedOpening !== settings.opening ? ` ${GAME_COPY.sharedOpeningNote}` : ""}
      </p>
      <Button onClick={start} disabled={starting} data-testid="start-shared-game">
        {starting ? "Starting…" : "Start a shared game"}
      </Button>
      {error !== null ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </section>
  );
}
