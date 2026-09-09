import Link from "next/link";

import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { recordPath } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import type { PlayerRecord } from "@/lib/history/playerRecord";
import type { TimeGiftRecord } from "@/lib/history/timeGifts";
import { countText, figuresOf, recordText, winRateText } from "@/lib/rating/figures";
import { playerPath } from "@/lib/rating/playerKey";

/**
 * What somebody has done here: the games by kind, the last few of them, and
 * what they have done with the clock.
 *
 * This is the Itsutsu tab of a player's page. A member who also has a record
 * from before this site gets a tab per site beside it, and the same figures
 * are worked out the same way in every one of them.
 */
export function ItsutsuRecord({ record, gifts }: { record: PlayerRecord; gifts: TimeGiftRecord }) {
  if (record.games === 0) {
    return (
      <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="player-no-games">
        No finished games yet. A rating appears after the first one against another member.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {record.byVariant.length > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <h3 className={SECTION_TITLE}>By game</h3>
          <table className="w-full text-sm" data-testid="player-by-variant">
            <thead>
              <tr className="text-left">
                <th className="pb-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">Game</th>
                <th className="pb-1.5 text-right text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
                  Played
                </th>
                <th className="pb-1.5 text-right text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
                  Won · Lost · Drawn
                </th>
                <th className="pb-1.5 text-right text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
                  Win rate
                </th>
              </tr>
            </thead>
            <tbody>
              {record.byVariant.map((row) => {
                const figures = figuresOf({ won: row.wins, lost: row.losses, drawn: row.draws });
                return (
                  <tr key={row.variant} className="border-t border-rule">
                    <td className="py-1.5 pr-3">{variantLabel(row.variant)}</td>
                    <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{countText(figures.played)}</td>
                    <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{recordText(figures)}</td>
                    <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{winRateText(figures.winRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {record.recent.length > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <h3 className={SECTION_TITLE}>Recent games</h3>
          <ul className="flex flex-col divide-y divide-rule text-sm">
            {record.recent.map((game) => (
              <li key={game.id} className="flex items-center justify-between gap-3 py-1.5">
                <span>
                  {variantLabel(game.variant)} · vs{" "}
                  {game.opponent ? (
                    <Link
                      href={playerPath(game.opponent)}
                      className="underline-offset-2 hover:underline"
                      data-testid="player-opponent"
                    >
                      {game.opponent}
                    </Link>
                  ) : (
                    "anonymous"
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums">{game.outcome}</span>
                  <Link href={recordPath(game.variant, game.id)} className="text-xs underline-offset-2 hover:underline">
                    replay
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gifts.gaveIn > 0 || gifts.receivedIn > 0 ? (
        <p className="text-xs text-muted" data-testid="time-gifts">
          With the clock:{" "}
          {gifts.gaveIn > 0
            ? `gave the other side more time in ${gifts.gaveIn} game${gifts.gaveIn === 1 ? "" : "s"}`
            : "never needed to give time"}
          {gifts.receivedIn > 0
            ? `; was given time in ${gifts.receivedIn}, and went on to win ${gifts.wonAfterReceiving} and lose ${gifts.lostAfterReceiving} of those`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}
