import { Paired } from "@/components/i18n/Paired";
import { RecordCells, RecordHeadings } from "./PlayerRecord";
import Link from "next/link";

import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchLeaders } from "@/lib/rating/players";
import { playerPath } from "@/lib/rating/playerKey";
import { shownName } from "@/lib/rating/shownName";

/** How far down the ladder the page reads. */
const LEADERS = 50;

/**
 * The site ladder: everybody by rating, best first.
 *
 * The per-game ladders live on /champions, and this says so — a rating here
 * is across every game, which is not what somebody who wants to know the best
 * Reversi player is asking.
 */
export async function Ladder() {
  const leaders = await fetchLeaders(LEADERS);
  return (
    <div className="flex flex-col gap-4" data-testid="ladder-section">
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
              <RecordHeadings />
            </tr>
          </thead>
          <tbody>
            {leaders.map((player) => (
              <tr key={player.key} className="border-t border-rule">
                <td className="py-1.5 pr-3">
                  <Link href={playerPath(player.name, player.memberId)} className="underline-offset-2 hover:underline">
                    {shownName(player.name)}
                  </Link>
                </td>
                <td className="py-1.5 pr-3 font-mono tabular-nums">{player.rating}</td>
                <td className="py-1.5 pr-3">
                  <Paired en={TIER_DISPLAY[player.tier].label} kanji={TIER_DISPLAY[player.tier].kanji} kanjiClassName="text-muted" />
                </td>
                {/*
                  These four are the ladder's own counting — rated games
                  against people — so the links say so. Sent to the record
                  unqualified they would open every game the name ever
                  played, which is a longer list than the number they came
                  from and a worse answer than no link at all.
                */}
                <RecordCells record={player} of={{ player: player.name, pool: "people", rated: "yes" }} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
