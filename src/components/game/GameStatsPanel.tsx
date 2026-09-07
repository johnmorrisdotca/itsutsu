"use client";

import { formatDuration } from "@/lib/clock/clock";
import { SEAT_DISPLAY, SEATS } from "@/lib/gomoku/gomoku.constants";
import { SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GameSession } from "./game.types";

/** The rows shown for each player, in the order a post-game glance wants them. */
const ROWS = [
  { key: "moves", label: "Moves" },
  { key: "thinkingMs", label: "Time used", time: true },
  { key: "slowestMoveMs", label: "Longest think", time: true },
  { key: "missedThreats", label: "Threats ignored" },
  { key: "blunders", label: "Losing moves" },
  { key: "hintsUsed", label: "Hints used" },
] as const;

/**
 * How the game actually went.
 *
 * "Threats ignored" counts moves played while the analysis had already called
 * the position forcing, and "losing moves" the ones that made a win
 * unstoppable — both narrow, countable things rather than a judgement on how
 * well someone played.
 */
export function GameStatsPanel({ session }: { session: GameSession }) {
  const { stats } = session;
  /*
   * The sum of both players' thinking time rather than the wall clock. It is
   * derived from state the game already holds, so it needs no ticking timer
   * to stay current, and it is the more honest number anyway: it measures the
   * game, not how long the tab happened to be open.
   */
  const totalThinking =
    stats.bySeat.one.thinkingMs + stats.bySeat.two.thinkingMs;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle kanji={GAME_COPY.stats.kanji}>
        {GAME_COPY.stats.label}
      </SectionTitle>

      <p className="text-xs text-muted">
        {session.state.moves.length} moves · {formatDuration(totalThinking)} at
        the board
      </p>

      <table className="w-full text-sm" data-testid="game-stats">
        <thead>
          <tr className="text-left text-[0.7rem] tracking-wide text-muted uppercase">
            <th className="pb-1 font-medium">&nbsp;</th>
            {Object.values(SEATS).map((seat) => (
              <th key={seat} className="pb-1 text-right font-medium">
                {session.names[seat].trim() || SEAT_DISPLAY[seat].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-t border-rule">
              <td className="py-1 text-muted">{row.label}</td>
              {Object.values(SEATS).map((seat) => {
                const value = stats.bySeat[seat][row.key];
                return (
                  <td key={seat} className="py-1 text-right font-mono tabular-nums">
                    {"time" in row && row.time
                      ? formatDuration(value)
                      : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
