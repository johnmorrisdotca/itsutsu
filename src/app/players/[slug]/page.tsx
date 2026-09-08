import Link from "next/link";

import { recordPath } from "@/lib/gomoku/slugs";
import { notFound } from "next/navigation";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { fetchTimeGiftRecord } from "@/lib/history/timeGifts";
import { LegacyElsewherePanel, LegacyOwnPage } from "@/components/players/LegacyRecord";
import { findLegacyPlayer, findLinkedLegacies } from "@/lib/legacy/legacyPlayers.data";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { findMemberByName } from "@/lib/auth/members";
import { fetchPlayer } from "@/lib/rating/players";
import { playerKey, playerKeysFromSlug, playerPath } from "@/lib/rating/playerKey";

export const metadata = { title: "Player" };

export default async function PlayerPage({ params }: PageProps<"/players/[slug]">) {
  const { slug } = await params;

  const legacyBySlug = findLegacyPlayer(slug);
  if (legacyBySlug !== null && legacyBySlug.kind !== "elsewhere") {
    return <LegacyOwnPage legacy={legacyBySlug} />;
  }

  /*
   * The address holds a folded name with hyphens for spaces, and folding
   * cannot be undone: "anne-marie" is either one hyphenated name or two
   * words. So both readings are looked for, and whichever finds somebody is
   * the player this address means.
   */
  const looked = await Promise.all(
    playerKeysFromSlug(slug).map(async (key) => {
      const [player, record, member] = await Promise.all([
        fetchPlayer(key),
        fetchPlayerRecord(key),
        findMemberByName(key),
      ]);
      return { key, player, record, member };
    }),
  );
  const found =
    looked.find((one) => one.player !== null || one.record.games > 0 || one.member !== null) ?? looked[0];
  const { key: decoded, player, record, member } = found;
  const gifts = await fetchTimeGiftRecord(decoded);
  // A member has a page from the day they join, before they have finished a
  // game: every list that prints their name links to it, and a link that
  // leads nowhere is worse than no page.
  const hasLiveData = player !== null || record.games > 0 || member !== null;
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
        <h1 className="text-lg font-semibold">{player?.name ?? member?.name ?? decoded}</h1>
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
        {record.games === 0 ? (
          <p className="text-xs text-muted" data-testid="player-no-games">
            No finished games yet. A rating appears after the first one against another member.
          </p>
        ) : null}
      </section>

      {gifts.gaveIn > 0 || gifts.receivedIn > 0 ? (
        <p className="text-xs text-muted" data-testid="time-gifts">
          With the clock: {gifts.gaveIn > 0 ? `gave the other side more time in ${gifts.gaveIn} game${gifts.gaveIn === 1 ? "" : "s"}` : "never needed to give time"}
          {gifts.receivedIn > 0
            ? `; was given time in ${gifts.receivedIn}, and went on to win ${gifts.wonAfterReceiving} and lose ${gifts.lostAfterReceiving} of those`
            : ""}
          .
        </p>
      ) : null}
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

      {linked.map((legacy) => (
        <LegacyElsewherePanel key={legacy.slug} legacy={legacy} />
      ))}
  </Page>
  );
}
