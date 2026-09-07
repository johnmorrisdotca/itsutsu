import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchLeaders } from "@/lib/rating/players";

export const metadata = { title: "Players" };

const LEADERS = 50;

/**
 * The players, by rating. There are no accounts, so a name is a player:
 * whoever plays as a name plays for its record, which the page says plainly.
 */
export default async function PlayersPage() {
  const leaders = await fetchLeaders(LEADERS);

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-4xl flex-col gap-6">
        <SiteHeader />
        <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            Players <span className="font-mincho text-sm font-normal opacity-70">対局者</span>
          </h1>
          <p className="text-sm text-muted">
            Ratings are Elo, starting at 1600. A player is unrated for the first few games,
            provisional while the rating settles, and established after twenty. There are no
            accounts here, so a name is a player: enter your name before a game to play for
            its record.
          </p>
          {leaders.length === 0 ? (
            <p className="text-sm text-muted" data-testid="players-empty">
              No rated games yet. Give both players a name and finish a game.
            </p>
          ) : (
            <table className="w-full text-sm" data-testid="players-table">
              <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
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
      </main>
    </div>
  );
}
