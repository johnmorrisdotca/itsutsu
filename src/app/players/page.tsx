import { playerPath } from "@/lib/rating/playerKey";
import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchDirectory, fetchLeaders } from "@/lib/rating/players";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { BuddyButton } from "@/components/mine/BuddyButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { ignoredEmails } from "@/lib/social/ignores";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { buddyEmails } from "@/lib/social/buddies";
import { fetchHereNow, recencyOf } from "@/lib/social/presence";
import { currentSession } from "@/lib/auth/currentSession";
import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyKind } from "@/lib/legacy/legacyPlayers.types";

export const metadata = { title: "Players" };

// The table is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const LEADERS = 50;

/** One roll of legacy players sharing a kind — "Remembered" or "Honorary members". */
function LegacyRoll({ kind, label, kanji }: { kind: LegacyKind; label: string; kanji: string }) {
  const players = LEGACY_PLAYERS.filter((legacy) => legacy.kind === kind);
  if (players.length === 0) return null;
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-rule-strong bg-ivory/60 px-3 py-2.5"
      data-testid={`legacy-roll-${kind}`}
    >
      <span className="flex items-baseline gap-2 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
        {label} <span className="font-mincho font-normal normal-case tracking-normal opacity-70">{kanji}</span>
      </span>
      <ul className="flex flex-col gap-1 text-sm">
        {players.map((legacy) => (
          <li key={legacy.slug}>
            <Link href={`/players/${legacy.slug}`} className="font-medium underline-offset-4 hover:underline">
              {legacy.name}
            </Link>
            <span className="text-muted">
              {" "}
              — never played here, but {legacy.possessive ?? "their"} record from{" "}
              {legacy.sources.map((source) => source.site).join(" and ")} is kept.
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The players, by rating. There are no accounts, so a name is a player:
 * whoever plays as a name plays for its record, which the page says plainly.
 */
export default async function PlayersPage() {
  const now = new Date();
  const [leaders, directory, me, here] = await Promise.all([
    fetchLeaders(LEADERS),
    fetchDirectory(200),
    currentSession(),
    fetchHereNow(now),
  ]);
  const buddies = me?.email ? await buddyEmails(me.email) : new Set<string>();
  const ignored = me?.email ? await ignoredEmails(me.email) : new Set<string>();
  const hereNow = here.filter((entry) => entry.recency === "now").length;

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          Players <span className="font-mincho text-sm font-normal opacity-70">対局者</span>
        </h1>
        <div className="flex flex-col gap-2 rounded-lg border border-rule bg-ivory/60 px-3 py-2" data-testid="here-now">
          <p className="text-sm">
            <span className="font-semibold">{hereNow}</span> {hereNow === 1 ? "player" : "players"} here in the last five
            minutes, <span className="font-semibold">{here.length}</span> in the last half hour.
            <span className="ml-2 text-xs text-muted">Site clock: {now.toUTCString().slice(17, 22)} UTC</span>
          </p>
          {here.length > 0 ? (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {here.map((entry) => (
                <span key={entry.email} className="flex items-center gap-1">
                  <RecencyMark recency={entry.recency} />
                  {entry.name.trim() !== "" ? (
                    <Link
                      href={playerPath(entry.name)}
                      className="underline-offset-2 hover:underline"
                      data-testid="here-name"
                    >
                      {entry.name}
                    </Link>
                  ) : (
                    entry.email
                  )}
                  {entry.localTime !== null ? <span className="text-xs text-muted">{entry.localTime} there</span> : null}
                </span>
              ))}
            </p>
          ) : null}
          <RecencyLegend />
        </div>

        <LegacyRoll kind="remembered" label="Remembered" kanji="偲ぶ" />
        <LegacyRoll kind="honorary" label="Honorary members" kanji="名誉会員" />

        <p className="text-sm text-muted">
          Everyone who has come in, most recently seen first, with the record their name has
          earned. New members are marked for two weeks; challenge one, and the game is in their
          list the moment you start it.
        </p>
        <table className="w-full text-sm" data-testid="directory">
          <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-1 pr-3">Member</th>
              <th className="py-1 pr-3">W</th>
              <th className="py-1 pr-3">L</th>
              <th className="py-1 pr-3">D</th>
              <th className="py-1 pr-3">Rating</th>
              <th className="py-1 pr-3">Joined</th>
              <th className="py-1"></th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody>
            {directory.map((entry) => (
              <tr key={entry.email} className="border-t border-rule">
                <td className="py-1.5 pr-3">
                  <span className="flex items-center gap-2">
                    <RecencyMark recency={recencyOf(new Date(entry.lastSeenAt), now)} />
                    {entry.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
                      <img src={entry.picture} alt="" className="size-5 rounded-full" referrerPolicy="no-referrer" />
                    ) : null}
                    {entry.name.trim() !== "" ? (
                      <Link
                        href={playerPath(entry.name)}
                        className="underline-offset-2 hover:underline"
                        data-testid="directory-name"
                      >
                        {entry.name}
                      </Link>
                    ) : (
                      entry.email
                    )}
                  </span>
                </td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.wins ?? 0}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.losses ?? 0}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.draws ?? 0}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">
                  {entry.profile !== null && entry.profile.tier !== "unrated" ? entry.profile.rating : "–"}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted">
                  {new Date(entry.joinedAt).toLocaleDateString()}
                  {entry.isNew ? (
                    <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">New 新人</span>
                  ) : null}
                </td>
                <td className="py-1.5 text-right">
                  {me?.email && me.email !== entry.email ? (
                    <span className="flex justify-end gap-1">
                      <BuddyButton email={entry.email} isBuddy={buddies.has(entry.email)} />
                      <IgnoreButton email={entry.email} ignoring={ignored.has(entry.email)} />
                    </span>
                  ) : null}
                </td>
                <td className="py-1.5 text-right">
                  {me?.email && me.email !== entry.email ? <ChallengeButton email={entry.email} /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className="pt-4 text-base font-semibold">
          Ladder <span className="font-mincho text-sm font-normal opacity-70">番付</span>
        </h2>
        <p className="text-sm text-muted">
          Ratings are Elo, starting at 1600. A player is unrated for the first few games,
          provisional while the rating settles, and established after twenty. Each game keeps a
          ladder of its own too: see the{" "}
          <Link href="/champions" className="underline underline-offset-4" data-testid="champions-link">
            champions <span className="font-mincho">名人</span>
          </Link>
          .
        </p>
        {leaders.length === 0 ? (
          <p className="text-sm text-muted" data-testid="players-empty">
            No rated games yet. Give both players a name and finish a game.
          </p>
        ) : (
          <table className="w-full text-sm" data-testid="players-table">
            <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3">Player</th>
                <th className="py-1 pr-3">Rating</th>
                <th className="py-1 pr-3">Tier</th>
                <th className="py-1 pr-3">W</th>
                <th className="py-1 pr-3">L</th>
                <th className="py-1 pr-3">D</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((player) => (
                <tr key={player.key} className="border-t border-rule">
                  <td className="py-1.5 pr-3">
                    <Link href={playerPath(player.name)} className="underline-offset-2 hover:underline">
                      {player.name}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums">{player.rating}</td>
                  <td className="py-1.5 pr-3">
                    {TIER_DISPLAY[player.tier].label}{" "}
                    <span className="font-mincho text-muted">{TIER_DISPLAY[player.tier].kanji}</span>
                  </td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums">{player.wins}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums">{player.losses}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums">{player.draws}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
  </Page>
  );
}
