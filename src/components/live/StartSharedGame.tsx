"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { Button, SectionTitle } from "@/components/ui/Controls";
import type { CreatedGame } from "@/lib/history/liveGame.types";

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
        Start a game with its own link and a QR code for each player, so you can
        take turns from different devices.
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
