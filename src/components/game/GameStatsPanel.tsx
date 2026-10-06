"use client";

import { formatDuration } from "@/lib/clock/clock";
import { SEATS } from "@/lib/gomoku/gomoku.constants";
import { seatName } from "@/lib/gomoku/seatWords";
import { SectionTitle } from "@/components/ui/Controls";
import { gameCopy } from "./game.constants";
import type { GameSession } from "./game.types";
import { TABLE_SCROLL } from "@/components/ui/ui.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/** The rows shown for each player, in the order a post-game glance wants them. */
const ROWS = [
  { key: "moves", label: "gamescreen.statMoves" },
  { key: "thinkingMs", label: "gamescreen.statTime", time: true },
  { key: "slowestMoveMs", label: "gamescreen.statLongest", time: true },
  { key: "missedThreats", label: "gamescreen.statThreats" },
  { key: "blunders", label: "gamescreen.statLosing" },
  { key: "hintsUsed", label: "gamescreen.statHints" },
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
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
        {say.say("gamescreen.statsLine", {
          moves: say.count("count.move", session.state.moves.length),
          time: formatDuration(totalThinking),
        })}
      </p>

      {/* Two player columns and a row of numbers: on a phone this is wider than the screen. */}
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm" data-testid="game-stats">
          <thead>
            <tr className="text-left text-[0.7rem] tracking-wide text-muted uppercase">
              <th className="pb-1 font-medium">&nbsp;</th>
              {Object.values(SEATS).map((seat) => (
                <th key={seat} className="pb-1 text-right font-medium">
                  {session.names[seat].trim() || seatName(say, seat)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="border-t border-rule">
                <td className="py-1 text-muted">{say.say(row.label)}</td>
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
      </div>
    </section>
  );
}
