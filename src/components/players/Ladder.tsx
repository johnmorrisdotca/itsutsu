import Link from "next/link";

import { PlayerLink } from "./Standings";
import { RATING_POOLS } from "@/lib/rating/pools";
import { RecordTable, type RecordTableRow } from "./RecordTable";
import { fetchLeaders } from "@/lib/rating/players";

/** How far down the ladder the page reads. */
const LEADERS = 50;

/**
 * The site ladder: everybody by rating, best first.
 *
 * The per-game ladders live on /champions, and this says so — a rating here
 * is across every game, which is not what somebody who wants to know the best
 * Reversi player is asking.
 *
 * Every column after the name is drawn by `RecordTable`, which is the same
 * table the members list, the computer players, a member's own record and
 * every per-game ladder use. This page used to put the rating second and the
 * counts after it; the members list put the counts first and the rating
 * seventh. Both were reasonable and the pair of them was the thing John was
 * looking at.
 */
export async function Ladder() {
  const leaders = await fetchLeaders(LEADERS);
  const rows: RecordTableRow[] = leaders.map((player) => ({
    key: player.key,
    subject: <PlayerLink name={player.name} memberId={player.memberId} />,
    record: player,
    /*
      These are the ladder's own counting — rated games against people — so
      the links say so. Sent to the record unqualified they would open every
      game the name ever played, which is a longer list than the number they
      came from and a worse answer than no link at all.
    */
    of: { player: player.name, pool: RATING_POOLS.people, rated: "yes" },
    /*
      And the streak is read from the same pool for the same reason. The row
      carries three of them — this ladder's, the computer pool's, and both
      together — and showing the wrong one here would be a run of wins that
      the wins beside it do not account for.
    */
    streak: player.streak,
    rating: { rating: player.rating, pool: RATING_POOLS.people },
    tier: player.tier,
  }));

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
      <RecordTable
        subject="Player"
        rows={rows}
        columns={{ tier: true }}
        testId="players-table"
        /*
          The headings are drawn whether or not there is anybody under them.
          This used to be a paragraph instead of the table, which taught a
          reader nothing about what the site keeps and read as an apology; the
          empty table shows the shape and offers the way in. See Show The Data,
          Not The Way To It.
        */
        empty={
          <>
            Nobody has a rated game yet. Rated games are shared games between two members —{" "}
            <Link href="/players" className="underline underline-offset-4">
              find somebody to play
            </Link>{" "}
            and be the first onto the ladder.
          </>
        }
      />
    </div>
  );
}
