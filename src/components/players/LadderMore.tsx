"use client";

import Link from "next/link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { countText } from "@/lib/rating/figures";
import type { PlayerProfile } from "@/lib/rating/players";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { useLiveScroll } from "@/lib/ui/useLiveScroll";

import { PlayerLink } from "./Standings";
import { RATING_POOLS } from "@/lib/rating/pools";
import { RecordTable, type RecordTableRow } from "./RecordTable";
import type { RecordSort } from "./recordSort";

/**
 * One player's line on the ladder.
 *
 * It lives beside the table rather than beside the read, because `Ladder.tsx`
 * imports `server-only` through `fetchLadderPage` — a row builder shared across
 * that boundary would pull the server module into the browser bundle.
 */
function ladderRow(player: PlayerProfile): RecordTableRow {
  return {
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
    /*
      NO `level`, AND IT IS AN ABSENCE WITH A REASON. The members list and the
      computers tab badge a member's XP level beside their name; this table
      cannot, because a `PlayerProfile` is a `Player` row and XP lives on
      `Member`. The two are joined by a folded NAME that stops matching the
      moment somebody renames, so filling it would cost this page a second query
      per page of the ladder to answer a question nobody sorts or pages by.

      Said here rather than left to look like an oversight — the two are
      identical in a diff. If it should be here, the honest route is `xp` on the
      row `fetchLadderPage` already reads, not a lookup per name.
    */
  };
}

/**
 * THE LADDER, WITH THE PAGES AFTER THE FIRST ARRIVING AS THE READER REACHES
 * THEM — and a link that does the same thing without JavaScript.
 *
 * The same shape as `LiveRecord` on /history, and for the same reasons, with one
 * difference worth stating: the record has a `Pager` that can say "page 3 of
 * 12", and the ladder has never had one. So the fallback here is a link carrying
 * the next cursor, and that link is FORWARD ONLY.
 *
 * WHICH IS HONEST RATHER THAN A SHORTCOMING. A cursor is a position in a list,
 * not a count of pages: "how many pages are there" is a question it cannot
 * answer, so a numbered pager built on one would be printing a number it does
 * not have. What a reader can be told truthfully is how many players there are
 * and how many of them are on screen, which is what the line below says.
 *
 * THE WAY BACK IS ALSO A LINK, because a one-directional control is a whole
 * class of fault — "I can't get out of it" is only ever found by the return
 * trip. A reader who has followed the next link gets a way to the top of the
 * ladder that keeps their sort, rather than only the browser's back button.
 */
export function LadderMore({
  first,
  from,
  total,
  endpoint,
  sort,
}: {
  /** The page the server rendered, under the same sort. */
  first: readonly PlayerProfile[];
  /** Where that page ended, or null when the ladder fitted in one. */
  from: string | null;
  total: number;
  /** The listing address the next pages come from, with the sort and no cursor. */
  endpoint: string;
  sort: RecordSort;
}) {
  const hydrated = useHydrated();
  const { more, next, loading, failed, sentinel } = useLiveScroll<PlayerProfile>({
    endpoint,
    from,
  });

  const scrolling = from !== null && hydrated && !failed;
  const rows = [...first, ...more];

  /*
   * The address for the next page without JavaScript, and the one back to the
   * top. Built off the sort's own query so a reader keeps the order they chose:
   * a "show more" that dropped the sort would hand them the next page of a
   * different ladder.
   */
  const link = (cursor: string | null) => {
    const params = new URLSearchParams(sort.query);
    if (cursor === null) params.delete("cursor");
    else params.set("cursor", cursor);
    const query = params.toString();
    return query === "" ? sort.at : `${sort.at}?${query}`;
  };

  return (
    <div className="flex flex-col gap-3" data-testid="ladder-live" {...readyMark(hydrated)}>
      <RecordTable
        subject="Player"
        rows={rows.map(ladderRow)}
        columns={{ tier: true }}
        sort={sort}
        /*
          The Ladder's Played is rated games in the people pool, and the
          Members tab's identical heading — one click away — is every
          finished game. For the same person that read 5 against 14 with
          nothing saying the two "Played" columns meant different things.
          `playedScope` matches what every row's own `of` already counts,
          so the heading cannot claim a scope the numbers under it lack.
        */
        playedScope={{ pool: RATING_POOLS.people, rated: "yes" }}
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

      {scrolling ? (
        <>
          {/* Below the table and with height, so the observer is not already
              intersecting on load and reading every page at once. */}
          <div ref={sentinel} className="h-8" aria-hidden data-testid="ladder-sentinel" />
          <p className="text-sm text-muted" aria-live="polite" data-testid="ladder-progress">
            {next === null
              ? `All ${countText(total)} on the ladder shown.`
              : `${countText(rows.length)} of ${countText(total)} shown${loading ? " — reading more…" : ". Keep scrolling for more."}`}
          </p>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted" data-testid="ladder-count">
            {countText(rows.length)} of {countText(total)} on the ladder
          </p>
          {failed ? (
            <span className="text-sm text-muted" data-testid="ladder-scroll-failed">
              More could not be loaded just now — the link still works.
            </span>
          ) : null}
          {from === null ? null : (
            <Link href={link(from)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="ladder-next">
              Show the next {countText(Math.min(first.length, total - rows.length))}
            </Link>
          )}
          {/*
            Only when the reader is already past the top, and it keeps their
            sort. A forward-only list without this is one a reader has to use
            the browser's back button to escape, which is the shape of fault
            only a return trip ever finds.
          */}
          {new URLSearchParams(sort.query).get("cursor") === null ? null : (
            <Link href={link(null)} className="text-sm underline underline-offset-4" data-testid="ladder-top">
              Back to the top of the ladder
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
