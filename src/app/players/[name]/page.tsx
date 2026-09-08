import Link from "next/link";

import { recordPath } from "@/lib/gomoku/slugs";
import { notFound } from "next/navigation";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { findLegacyPlayer } from "@/lib/legacy/legacyPlayers.data";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchPlayer } from "@/lib/rating/players";

export const metadata = { title: "Player" };

/**
 * One player's profile: rating and tier, the record overall and by game, and
 * the last few games. Everything comes from the games table and the player's
 * row; nothing here is stored twice.
 *
 * A remembered player is a second kind of page under the same address. They
 * never played here, so there is no rating and no tier to show — only the
 * record they made somewhere else, kept rather than lost when that site is.
 */
export default async function PlayerPage({ params }: PageProps<"/players/[name]">) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const legacy = findLegacyPlayer(decoded);
  if (legacy !== null) {
    return (
      <Page width="standard" gap="gap-6">
        <SiteHeader />
        <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-player">
          <span className="w-fit rounded-full border border-rule-strong bg-ivory px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
            Remembered
          </span>
          <h1 className="text-lg font-semibold">{legacy.name}</h1>
          <p className="text-sm text-muted">
            {legacy.location !== undefined ? `${legacy.location} · ` : ""}
            Played as{" "}
            {legacy.handle !== undefined ? (
              <span className="font-medium text-ink-soft">{legacy.handle}</span>
            ) : (
              <span className="font-medium text-ink-soft">{legacy.name}</span>
            )}{" "}
            on <span className="font-medium text-ink-soft">{legacy.source}</span>
            {legacy.joined !== undefined && legacy.lastActive !== undefined
              ? `, ${legacy.joined} to ${legacy.lastActive}`
              : null}
            . Never played on Itsutsu — this record is kept, not earned here.
          </p>
          {legacy.note !== undefined ? <p className="border-l-2 border-rule-strong pl-3 text-sm italic text-ink-soft">{legacy.note}</p> : null}
        </section>

        <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Summary</h2>
          <table className="w-full text-sm" data-testid="legacy-summary">
            <tbody>
              {legacy.summary.map((row) => (
                <tr key={row.class} className="border-t border-rule">
                  <td className="py-1.5 pr-3">{row.class}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums">
                    {row.record.won}W · {row.record.lost}L · {row.record.drawn}D
                  </td>
                  <td className="py-1.5 text-xs text-muted">
                    {row.record.won + row.record.lost + row.record.drawn} games
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {legacy.detail.length > 0 ? (
          <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
            <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">By game</h2>
            <table className="w-full text-sm" data-testid="legacy-detail">
              <tbody>
                {legacy.detail.map((row) => (
                  <tr key={row.game} className="border-t border-rule">
                    <td className="py-1.5 pr-3">{row.game}</td>
                    <td className="py-1.5 pr-3 font-mono tabular-nums">
                      {row.won}W · {row.lost}L · {row.drawn}D
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!legacy.detailComplete ? (
              <p className="text-xs text-muted">
                As far as was recorded — {legacy.source} may hold more than what is copied down here.
              </p>
            ) : null}
          </section>
        ) : null}
      </Page>
    );
  }

  const [player, record] = await Promise.all([fetchPlayer(decoded), fetchPlayerRecord(decoded)]);
  if (player === null && record.games === 0) notFound();

  const tier = player === null ? null : TIER_DISPLAY[player.tier];

  return (
    <Page width="standard" gap="gap-6">
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
                  <Link href={recordPath(game.variant, game.id)} className="text-xs underline-offset-2 hover:underline">
                    replay
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
  </Page>
  );
}
