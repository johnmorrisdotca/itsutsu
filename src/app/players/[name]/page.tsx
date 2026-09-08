import Link from "next/link";

import { recordPath } from "@/lib/gomoku/slugs";
import { notFound } from "next/navigation";
import { GameReplay } from "@/components/history/GameReplay";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { keptGameDetail, keptGameName, keptGamesFor } from "@/lib/legacy/legacyGames.data";
import { findLegacyPlayer, findLinkedLegacies } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyClassRecord, LegacyGame, LegacyGameRecord, LegacyPlayer } from "@/lib/legacy/legacyPlayers.types";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchPlayer } from "@/lib/rating/players";
import { playerKey } from "@/lib/rating/playerKey";

export const metadata = { title: "Player" };

/** One game's individual results, where the source site logged them one by one rather than only a total. */
function GameLog({ game }: { game: LegacyGameRecord }) {
  if (game.log === undefined || game.log.length === 0) return null;
  return (
    <details className="ml-0">
      <summary className="cursor-pointer text-xs text-muted underline-offset-2 hover:underline">
        {game.log.length} games, one by one
      </summary>
      <ul className="mt-1.5 flex flex-col divide-y divide-rule text-xs" data-testid="legacy-log">
        {game.log.map((entry, index) => (
          <li key={`${entry.date}-${entry.opponent}-${index}`} className="flex items-center justify-between gap-3 py-1">
            <span className="text-muted">{entry.date}</span>
            <span className="flex-1 truncate px-2">{entry.opponent}</span>
            <span className="font-mono">{entry.result}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** One class of games: its own totals, and its own by-game table when one was kept. */
function LegacyClassTable({ row }: { row: LegacyClassRecord }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <h2 className="flex items-baseline justify-between gap-3 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {row.class}
        <span className="font-mono normal-case tracking-normal text-ink-soft" data-testid="legacy-class-total">
          {row.record.won}W · {row.record.lost}L · {row.record.drawn}D
        </span>
      </h2>
      {row.detail !== undefined && row.detail.length > 0 ? (
        <>
          <table className="w-full text-sm" data-testid="legacy-detail">
            <tbody>
              {row.detail.map((game) => (
                <tr key={game.game} className="border-t border-rule">
                  <td className="py-1.5 pr-3 align-top">
                    {game.game}
                    <GameLog game={game} />
                  </td>
                  <td className="py-1.5 pr-3 align-top font-mono tabular-nums">
                    {game.won}W · {game.lost}L · {game.drawn}D
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!row.detailComplete ? (
            <p className="text-xs text-muted">As far as was recorded — the source site may hold more than what is copied down here.</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/** The games kept in full for one slug — a board a reader can step through, not just a result. */
function KeptGames({ slug }: { slug: string }) {
  const games = keptGamesFor(slug);
  if (games.length === 0) return null;
  return (
    <section className="flex flex-col gap-4" data-testid="kept-games">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">Games we have</h2>
      {games.map((game) => (
        <KeptGame key={game.id} game={game} viewedAs={slug} />
      ))}
    </section>
  );
}

function KeptGame({ game, viewedAs }: { game: LegacyGame; viewedAs: string }) {
  const isBlack = game.black === viewedAs;
  const opponentSlug = isBlack ? game.white : game.black;
  const opponentName = keptGameName(opponentSlug);
  const colour = isBlack ? "black" : "white";
  const result = game.winner === null ? "drew" : game.winner === colour ? "won" : "lost";
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <p className="text-sm text-muted">
        {game.playedAt} · {variantLabel(game.variant)}, {game.size}×{game.size} · vs{" "}
        <Link href={`/players/${opponentSlug}`} className="font-medium text-ink-soft underline-offset-2 hover:underline">
          {opponentName}
        </Link>{" "}
        · played <span className="font-medium text-ink-soft">{colour}</span> · <span className="font-medium text-ink-soft">{result}</span> ·{" "}
        {game.source}
      </p>
      <GameReplay game={keptGameDetail(game)} />
    </div>
  );
}

const LEGACY_OWN_PAGE_COPY: Record<"remembered" | "honorary", { badge: string; tail: string }> = {
  remembered: { badge: "Remembered", tail: "Never played on Itsutsu — this record is kept, not earned here." },
  honorary: { badge: "Honorary member", tail: "Never played on Itsutsu — kept here as an honorary member, in her own right." },
};

/** A legacy record with its own address — nobody here plays under this name. */
function LegacyOwnPage({ legacy }: { legacy: LegacyPlayer }) {
  const copy = legacy.kind === "elsewhere" ? null : LEGACY_OWN_PAGE_COPY[legacy.kind];
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-player">
        <span className="w-fit rounded-full border border-rule-strong bg-ivory px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
          {copy?.badge ?? "Record elsewhere"}
        </span>
        <h1 className="text-lg font-semibold">{legacy.name}</h1>
        <p className="text-sm text-muted">
          {legacy.location !== undefined ? `${legacy.location} · ` : ""}
          Played as <span className="font-medium text-ink-soft">{legacy.handle ?? legacy.name}</span> on{" "}
          <span className="font-medium text-ink-soft">{legacy.source}</span>
          {legacy.joined !== undefined && legacy.lastActive !== undefined ? `, ${legacy.joined} to ${legacy.lastActive}` : null}.{" "}
          {copy?.tail ?? "From before Itsutsu — kept alongside whatever they've since earned here."}
        </p>
        {legacy.note !== undefined ? <p className="border-l-2 border-rule-strong pl-3 text-sm italic text-ink-soft">{legacy.note}</p> : null}
      </section>
      {legacy.summary.map((row) => (
        <LegacyClassTable key={row.class} row={row} />
      ))}
      <KeptGames slug={legacy.slug} />
    </Page>
  );
}

/** A compact version of the same record, appended under a live profile it belongs beside. */
function LegacyElsewherePanel({ legacy }: { legacy: LegacyPlayer }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-elsewhere-panel">
      <span className="flex items-baseline gap-2">
        <span className="w-fit rounded-full border border-rule-strong bg-ivory px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
          Record elsewhere
        </span>
        <span className="text-sm text-muted">
          Also played as <span className="font-medium text-ink-soft">{legacy.handle ?? legacy.name}</span> on{" "}
          <span className="font-medium text-ink-soft">{legacy.source}</span>
          {legacy.joined !== undefined && legacy.lastActive !== undefined ? `, ${legacy.joined} to ${legacy.lastActive}` : null}.
        </span>
      </span>
      {legacy.note !== undefined ? <p className="border-l-2 border-rule-strong pl-3 text-sm italic text-ink-soft">{legacy.note}</p> : null}
      <table className="w-full text-sm" data-testid="legacy-summary">
        <tbody>
          {legacy.summary.map((row) => (
            <tr key={row.class} className="border-t border-rule">
              <td className="py-1.5 pr-3">{row.class}</td>
              <td className="py-1.5 pr-3 font-mono tabular-nums">
                {row.record.won}W · {row.record.lost}L · {row.record.drawn}D
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary className="cursor-pointer text-xs text-muted underline-offset-2 hover:underline">By game</summary>
        <div className="mt-2 flex flex-col gap-4">
          {legacy.summary
            .filter((row) => row.detail !== undefined && row.detail.length > 0)
            .map((row) => (
              <div key={row.class} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted">{row.class}</span>
                <table className="w-full text-sm" data-testid="legacy-detail">
                  <tbody>
                    {row.detail?.map((game) => (
                      <tr key={game.game} className="border-t border-rule">
                        <td className="py-1.5 pr-3 align-top">
                          {game.game}
                          <GameLog game={game} />
                        </td>
                        <td className="py-1.5 pr-3 align-top font-mono tabular-nums">
                          {game.won}W · {game.lost}L · {game.drawn}D
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      </details>
      <KeptGames slug={legacy.slug} />
    </section>
  );
}

/**
 * One player's profile: rating and tier, the record overall and by game, and
 * the last few games. Everything comes from the games table and the player's
 * row; nothing here is stored twice.
 *
 * A remembered or honorary player never played here at all, and gets this
 * whole address to themselves — no rating, no tier, just the record kept
 * from elsewhere. A live member who also has a record from before Itsutsu
 * gets both: their live profile, and that earlier record appended beneath it.
 */
export default async function PlayerPage({ params }: PageProps<"/players/[name]">) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const legacyBySlug = findLegacyPlayer(decoded);
  if (legacyBySlug !== null && legacyBySlug.kind !== "elsewhere") {
    return <LegacyOwnPage legacy={legacyBySlug} />;
  }

  const [player, record] = await Promise.all([fetchPlayer(decoded), fetchPlayerRecord(decoded)]);
  const hasLiveData = player !== null || record.games > 0;
  // A live account with no games yet but more than one linked record is not
  // reachable today — nothing sets linkedKey yet — so only the first would
  // show here; worth widening if that combination ever becomes real.
  const linkedByKey = findLinkedLegacies(playerKey(decoded));
  const linked = linkedByKey.length > 0 ? linkedByKey : hasLiveData || legacyBySlug === null ? [] : [legacyBySlug];

  if (!hasLiveData && linked.length === 0) notFound();
  if (!hasLiveData && linked.length > 0) return <LegacyOwnPage legacy={linked[0]} />;

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

      {linked.map((legacy) => (
        <LegacyElsewherePanel key={legacy.slug} legacy={legacy} />
      ))}
  </Page>
  );
}
