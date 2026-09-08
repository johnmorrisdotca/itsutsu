import Link from "next/link";

import { recordPath } from "@/lib/gomoku/slugs";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchPlayer } from "@/lib/rating/players";

export const metadata = { title: "Player" };

/**
 * One player's profile: rating and tier, the record overall and by game, and
 * the last few games. Everything comes from the games table and the player's
 * row; nothing here is stored twice.
 */
export default async function PlayerPage({ params }: PageProps<"/players/[name]">) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const [player, record] = await Promise.all([fetchPlayer(decoded), fetchPlayerRecord(decoded)]);
  if (player === null && record.games === 0) notFound();

  const tier = player === null ? null : TIER_DISPLAY[player.tier];

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-4xl flex-col gap-6">
        <SiteHeader />
        <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="player-profile">
          <h1 className="text-lg font-semibold">{player?.name ?? decoded}</h1>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Rating</dt>
              <dd className="font-mono text-lg tabular-nums" data-testid="player-rating">
                {player?.rating ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Tier</dt>
              <dd>
                {tier === null ? "Unrated" : tier.label}{" "}
                {tier !== null ? <span className="font-mincho text-muted">{tier.kanji}</span> : null}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Record</dt>
              <dd className="font-mono tabular-nums" data-testid="player-record">
                {record.wins}W · {record.losses}L · {record.draws}D
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Games</dt>
              <dd className="font-mono tabular-nums">{record.games}</dd>
            </div>
          </dl>
          {tier !== null ? <p className="text-xs text-muted">{tier.note}</p> : null}
        </section>

        {record.byVariant.length > 0 ? (
          <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
            <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">By game</h2>
            <table className="w-full text-sm" data-testid="player-by-variant">
              <tbody>
                {record.byVariant.map((row) => (
                  <tr key={row.variant} className="border-t border-rule">
                    <td className="py-1.5 pr-3">{variantLabel(row.variant)}</td>
                    <td className="py-1.5 pr-3 font-mono tabular-nums">
                      {row.wins}W · {row.losses}L · {row.draws}D
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {record.recent.length > 0 ? (
          <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
            <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Recent games</h2>
            <ul className="flex flex-col divide-y divide-rule text-sm">
              {record.recent.map((game) => (
                <li key={game.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span>
                    {variantLabel(game.variant)} · vs {game.opponent || "anonymous"}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-xs tabular-nums">{game.outcome}</span>
                    <Link href={recordPath(game.id)} className="text-xs underline-offset-2 hover:underline">
                      replay
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
