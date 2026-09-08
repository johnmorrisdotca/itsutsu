import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchDirectory, fetchLeaders } from "@/lib/rating/players";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { currentSession } from "@/lib/auth/currentSession";

export const metadata = { title: "Players" };

// The table is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const LEADERS = 50;

/**
 * The players, by rating. There are no accounts, so a name is a player:
 * whoever plays as a name plays for its record, which the page says plainly.
 */
export default async function PlayersPage() {
  const [leaders, directory, me] = await Promise.all([fetchLeaders(LEADERS), fetchDirectory(200), currentSession()]);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          Players <span className="font-mincho text-sm font-normal opacity-70">対局者</span>
        </h1>
        <p className="text-sm text-muted">
          Everyone who has come in, most recently seen first, with the record their name has
          earned. Challenge anyone: the game is in their list the moment you start it.
        </p>
        <table className="w-full text-sm" data-testid="directory">
          <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-1 pr-3">Member</th>
              <th className="py-1 pr-3">W</th>
              <th className="py-1 pr-3">L</th>
              <th className="py-1 pr-3">D</th>
              <th className="py-1 pr-3">Rating</th>
              <th className="py-1 pr-3">Seen</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody>
            {directory.map((entry) => (
              <tr key={entry.email} className="border-t border-rule">
                <td className="py-1.5 pr-3">
                  <span className="flex items-center gap-2">
                    {entry.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
                      <img src={entry.picture} alt="" className="size-5 rounded-full" referrerPolicy="no-referrer" />
                    ) : null}
                    {entry.profile !== null ? (
                      <Link href={`/players/${encodeURIComponent(entry.name)}`} className="underline-offset-2 hover:underline">
                        {entry.name || entry.email}
                      </Link>
                    ) : (
                      entry.name || entry.email
                    )}
                  </span>
                </td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.wins ?? 0}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.losses ?? 0}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.draws ?? 0}</td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">
                  {entry.profile !== null && entry.profile.tier !== "unrated" ? entry.profile.rating : "–"}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted">{new Date(entry.lastSeenAt).toLocaleDateString()}</td>
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
          provisional while the rating settles, and established after twenty.
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
                    <Link href={`/players/${encodeURIComponent(player.name)}`} className="underline-offset-2 hover:underline">
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
