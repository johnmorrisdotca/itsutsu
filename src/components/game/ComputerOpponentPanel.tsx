"use client";

import { useState } from "react";

import { BOT_PROFILES, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { SEAT_DISPLAY, SEATS } from "@/lib/gomoku/gomoku.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { Seat } from "@/lib/gomoku/gomoku.types";
import type { GamePanelProps } from "./game.types";
import { useComputerOpponent } from "./useComputerOpponent";
import { SECTION_TITLE } from "@/components/ui/ui.constants";

/**
 * Sit a computer player at the practice board.
 *
 * It thinks in THIS browser — see `botWorker.ts`. Nothing is sent anywhere, no
 * function is billed, and the move takes as long as it is worth taking rather
 * than the 250 ms a paid request allows. Every grade below is therefore the
 * strength it is meant to be, which on the server the top two are not: measured
 * over forty-four games, Meijin played 国手's move 94% of the time, because
 * neither reached the depth they differ by before the clock stopped them.
 *
 * Offered here and not in a live match. A live game's result stands on a ladder,
 * and a move chosen on the opponent's own machine is a move they could have
 * chosen badly on purpose. `botSeed.ts` is what a checked version would rest on.
 */
export function ComputerOpponentPanel({ session, actions }: GamePanelProps) {
  const [seat, setSeat] = useState<Seat | null>(null);
  const [tier, setTier] = useState<BotTier>(BOT_TIER_LIST[1] ?? BOT_TIER_LIST[0]!);
  const { thinking, failed } = useComputerOpponent({ session, actions, seat, tier });
  const hydrated = useHydrated();

  return (
    <div className="flex flex-col gap-3" data-testid="computer-opponent" {...readyMark(hydrated)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={SECTION_TITLE}>Computer opponent</h2>
        {thinking ? (
          <span className="text-xs text-muted" data-testid="computer-thinking">
            thinking…
          </span>
        ) : null}
      </div>

      {/*
        The label BESIDE the control, never wrapped around it.
        A <label> that wraps a <select> takes every option into its own text, so
        this one read "Plays as Nobody — two people Player 1 Player 2" — and
        `getByLabel(/Player 1/)` then matched this dropdown instead of the
        player-name field beside the board. Five practice specs failed on CI
        trying to type into a <select>, which reads as a broken form rather than
        as a label that got greedy. htmlFor keeps the name to the words meant.
      */}
      <div className="flex flex-col gap-1 text-xs text-muted">
        <label htmlFor="computer-seat">Plays as</label>
        <select
          id="computer-seat"
          className="rounded-lg border border-rule bg-transparent px-2 py-1 text-sm text-ink"
          value={seat ?? ""}
          /*
           * Disabled until React is attached. The select is server-rendered, so
           * it is a real control before anything is listening — and a choice
           * made in that window is silently dropped, which reads as the
           * computer simply refusing to play.
           */
          disabled={!hydrated}
          onChange={(event) => setSeat(event.target.value === "" ? null : (event.target.value as Seat))}
          data-testid="computer-seat"
        >
          <option value="">Nobody — two people</option>
          <option value={SEATS.one}>{SEAT_DISPLAY[SEATS.one].label}</option>
          <option value={SEATS.two}>{SEAT_DISPLAY[SEATS.two].label}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted">
        <label htmlFor="computer-tier">Strength</label>
        <select
          id="computer-tier"
          className="rounded-lg border border-rule bg-transparent px-2 py-1 text-sm text-ink"
          value={tier}
          disabled={!hydrated}
          onChange={(event) => setTier(event.target.value as BotTier)}
          data-testid="computer-tier"
        >
          {BOT_TIER_LIST.map((one) => (
            <option key={one} value={one}>
              {BOT_PROFILES[one].name} {BOT_PROFILES[one].native} — {BOT_PROFILES[one].strength}
            </option>
          ))}
        </select>
      </div>

      {failed === null ? (
        <p className="text-xs text-muted">
          Thinks on this device, so it can take seconds over a move instead of the quarter second a
          server reply allows. The game itself is still recorded, as any practice game is.
        </p>
      ) : (
        /*
         * Said out loud rather than left as a seat that has gone quiet: a
         * worker that stopped and a worker still thinking look identical from
         * here, and the player would wait for a move that is never coming.
         */
        <p className="text-xs text-shu" role="alert" data-testid="computer-failed">
          The bot stopped: {failed}. Choose “Nobody” and back again to restart it.
        </p>
      )}
    </div>
  );
}
