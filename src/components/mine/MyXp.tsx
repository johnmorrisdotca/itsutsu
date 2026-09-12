import Link from "next/link";

import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { GameName } from "@/components/games/GameName";
import { Paired } from "@/components/i18n/Paired";
import { PlayerName } from "@/components/players/PlayerName";
import { familyPath, matchPath } from "@/lib/gomoku/slugs";
import { foldEmail, memberRowFor } from "@/lib/auth/members";
import { isRefusal } from "@/lib/api/paging";
import { playerPath } from "@/lib/rating/playerKey";
import { xpLevelName } from "@/lib/xp/levelNames";
import { xpMoreHref, xpParamsFrom } from "@/lib/xp/xpHistory";
import { xpLedgerPage } from "@/lib/xp/xpHistoryPage";
import { xpStanding } from "@/lib/xp/xpCurve";
import type { XpAbout, XpLedgerRow } from "@/lib/xp/xpHistory.types";

/**
 * A MEMBER'S OWN XP: WHAT THEY HAVE, AND EVERY AWARD THAT MADE IT.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT SHOWS THE LEDGER, NOT THE WAY TO IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The total and the level are one line, and under them is the ledger itself —
 * not a link to a page that has it. AGENTS.md's rule, and the reason the record
 * is on this page too rather than one click under it: a link is the way to MORE
 * of something already on the page, never the page's answer to the question it
 * exists to answer. "You have 1,275 XP" with nothing behind it is the same
 * failure as a count with no link, one layer out — it states a conclusion and
 * withholds the evidence.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND AN EMPTY LEDGER IS DATA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * John's rule, verbatim: *"empty tables are fine! show the table. Show nothing
 * has been played yet… and that's a change to have a link saying - be the first
 * to play!"* So a member with no awards gets the headings, their level-1
 * standing, and a line saying where XP comes from with the way to go and earn
 * some. It does not hide itself and it does not apologise — the shape of what
 * this site keeps is worth showing before there is anything in it, and the
 * ledger is empty for every member on the site today.
 *
 * The stranger's case does not arise here: `/me` redirects a signed-out reader
 * to `/join` before this renders. The leaderboard on `/xp` is where the
 * invitation has to be worded for somebody who is not signed in.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The total, the level and the distance to the next come off the `Member` row
 * `/me` has already fetched — the level is a lookup over a hundred-element
 * array, never a stored column, so a list that has the row has the level. The
 * ledger is one page of `XpEvent` off `XpEvent_memberId_createdAt_idx`, plus one
 * bounded read resolving the page's game ids to their variants, without which a
 * match has no address at all. See `xpHistoryPage.ts` for why that is the line.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A LIST, NOT A RecordTable
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `RecordTable` owns every table of W/L/D on this site and is right to: five
 * pages had invented four column orders for the same five figures. A ledger is
 * none of those figures — it is one row per award, with a date, a number of
 * points and the thing it was about — so `RecordTable` would have to grow a
 * column set it has no other caller for, which is how a shared component
 * becomes five tables again. What IS shared is the look: the heading
 * typography, the row rule and the cell padding come from `PlayerRecord.tsx`,
 * so the ledger reads as this site's table even though it is not that one.
 */

/** The day a row was earned, in the member's own zone. */
function Earned({ row }: { row: XpLedgerRow }) {
  /*
   * `dayKey` rather than a formatted `earnedAt`, and that is a correctness
   * choice rather than a convenience. The day key was written in the member's
   * own time zone by `xpDayKey`; formatting the timestamp here would format it
   * in the SERVER's zone, so a member in Tokyo would be shown the previous day
   * for everything they earned before nine in the morning. The exact moment is
   * still in the markup, as the `datetime` a `<time>` element carries.
   */
  return (
    <time dateTime={row.earnedAt} className="text-muted">
      {row.dayKey}
    </time>
  );
}

/**
 * What the award was about, drawn the way this site draws that kind of thing.
 *
 * Every branch that CAN lead somewhere does. The two that cannot say so in
 * words: a game that is no longer kept, and a subject this deploy cannot
 * resolve. A link that cannot keep its promise is worse than a plain word, and
 * saying so in the markup is what keeps the exception from looking identical to
 * an oversight.
 */
function About({ about }: { about: XpAbout }) {
  if (about.of === "game") return <GameName variant={about.variant} />;

  if (about.of === "match") {
    if (about.variant === null) {
      return (
        <span
          className="text-muted"
          title="This match is no longer kept — finished games are held for the number of days you chose."
        >
          a match no longer kept
        </span>
      );
    }
    /*
     * BOTH, and neither instead of the other. The game's name leads to the
     * game — that is the standing rule wherever a game is named — and the match
     * is the thing this row is actually about, so it gets its own way in. One
     * link would have to choose between naming the game and reaching the board.
     */
    return (
      <>
        <GameName variant={about.variant} />
        <span className="text-muted"> · </span>
        <Link href={matchPath(about.variant, about.gameId)} className="underline underline-offset-4">
          that match
        </Link>
      </>
    );
  }

  if (about.of === "family") {
    /*
     * A family is reached through one of its games; a retitled family has no
     * game to reach it through and keeps its words. See `familyThrough`.
     *
     * Styled the way `GameName` and `PlayerName` style themselves —
     * `hover:underline` — because a family's title IS a name, and a name drawn
     * differently from the game name in the row above it reads as a different
     * kind of thing. The always-underlined links in this column are the ones
     * that are PHRASES rather than names: "that match", "your rival". That is
     * the rule, and it is why two styles appear in one cell.
     */
    return about.through === null ? (
      <span title="A family that has been renamed since this was earned.">{about.title}</span>
    ) : (
      <Link href={familyPath(about.through)} className="underline-offset-2 hover:underline">
        {about.title}
      </Link>
    );
  }

  if (about.of === "person") {
    return about.name === null ? (
      /*
       * No name, and no query spent getting one. `/players/<id>` IS the subject,
       * so the link is free; the name would cost a read of the members table for
       * a word the row's own label already implies. The computer players are the
       * other way round — their names are a constant — which is why that branch
       * has one and this one does not.
       */
      <Link href={playerPath("", about.memberId)} className="underline underline-offset-4">
        their page
      </Link>
    ) : (
      <PlayerName name={about.name} memberId={about.memberId} fallback="a computer player" />
    );
  }

  if (about.of === "rivalry") {
    return (
      <>
        <GameName variant={about.variant} />
        <span className="text-muted"> · </span>
        <Link href={playerPath("", about.memberId)} className="underline underline-offset-4">
          your rival
        </Link>
      </>
    );
  }

  if (about.of === "words") {
    return about.stale === true ? (
      <span className="text-muted" title="Nothing on the site answers to this any more.">
        {about.said}
      </span>
    ) : (
      <span className="text-muted">{about.said}</span>
    );
  }

  // Nothing to point at, said as nothing rather than as a link to the member's
  // own page — which is the page they are already reading.
  return <span className="text-muted">—</span>;
}

/** The total, the level, and how far the next one is. */
function Standing({ xp }: { xp: number }) {
  const standing = xpStanding(xp);
  const atTheTop = standing.span === 0;
  return (
    <div className="flex flex-col gap-1.5" data-testid="my-xp-standing">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-mono text-lg tabular-nums" data-testid="my-xp-total">
          {xp.toLocaleString("en-US")} XP
        </span>
        {/*
          The level's NAME, from the one door — `xpLevelName`, which is the
          catalogue's hundred rows with `Level 42` kept as its floor for a rung
          the ladder does not have. It read `xpLevelLabel` from XP-09 until the
          names landed; that function is gone rather than forwarding, so there
          is one lookup and not two to choose between.
        */}
        <span className="font-semibold" data-testid="my-xp-level">
          {xpLevelName(standing.level)}
        </span>
        <span className="text-muted" data-testid="my-xp-next">
          {atTheTop
            ? "The top of the ladder."
            : `${standing.toNext.toLocaleString("en-US")} to ${xpLevelName(standing.level + 1)}`}
        </span>
      </p>
      {/*
        The bar is `aria-hidden`: it says the same thing as the line above it,
        which is already words, and a progress bar announced as "63%" after
        "215 to Level 12" is the same fact twice in a worse unit.
      */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-shade" aria-hidden>
        <div
          className="h-full rounded-full bg-moss"
          style={{ width: `${Math.round(standing.ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The ledger's own headings, which stand whether or not there is a row under
 * them.
 *
 * FOUR COLUMNS ON A DESK, THREE ON A PHONE. At 390 the fourth one squeezed
 * every other cell until "that match" broke over two lines and the sentence
 * became a two-word-wide ribbon — a table crushed rather than a table read. So
 * `About` folds into the row's own cell below that width and the heading folds
 * with it, which is why the subject appears twice in the markup: one of the two
 * is always `display: none`, so a reader and a screen reader each meet exactly
 * one. The alternative was hiding the sentence on a phone, and the sentence
 * saying what an award was for is the column a ledger exists for.
 */
const ABOUT_ON_A_DESK = "hidden sm:table-cell";

function Headings() {
  return (
    <thead className={TABLE_HEAD_CLASS}>
      <tr>
        <th scope="col" className={HEAD}>Earned</th>
        <th scope="col" className={HEAD}>XP</th>
        <th scope="col" className={HEAD}>For</th>
        <th scope="col" className={`${HEAD} ${ABOUT_ON_A_DESK}`}>About</th>
      </tr>
    </thead>
  );
}

/**
 * Everything a member has earned, newest first, and their standing above it.
 *
 * THE STANDING COSTS NO QUERY. `memberRowFor` is `cache()`d per request and has
 * already run on this render — `currentSession()` → `touchMember()` calls it on
 * every server-rendered page — and its `select` already carries `id` and `xp`.
 * So this is a cache hit, and reading the total here is the pattern that file's
 * own comment states: *a preference is read by riding this query, never by
 * adding one*. `fetchProfile`'s row could not answer it; `MemberProfile` is
 * declared over a session-shaped `Member` and knows nothing about XP.
 *
 * Which leaves exactly one read of its own: the page of the ledger.
 */
export async function MyXp({
  email,
  params,
}: {
  /** The signed-in address. Folded here, so the cached read is the same read. */
  email: string;
  /** The page's own search parameters: the cursor, the sort, and the open tab. */
  params: Record<string, string | string[] | undefined>;
}) {
  const row = await memberRowFor(foldEmail(email));
  if (row === null) {
    /*
     * THE OPERATOR IS NOT A MEMBER. `currentMemberId` answers null for the admin
     * session and `touchMember` returns early, so there is no row to have earned
     * anything — which is a different fact from having earned nothing, and said
     * differently. A standing of "0 XP, Level 1" here would be a judgement about
     * somebody the ladder does not hold.
     */
    return (
      <p className="text-sm text-muted" data-testid="my-xp-no-member">
        XP belongs to a member, and this session is signed in without a member row — so there is
        nothing here to show rather than nothing earned.
      </p>
    );
  }

  const query = xpParamsFrom(params);
  const page = await xpLedgerPage({ memberId: row.id, params: query });

  return (
    <div className="flex flex-col gap-4" data-testid="my-xp">
      <Standing xp={row.xp} />

      {isRefusal(page) ? (
        /*
         * A sort this list does not have, refused by name rather than answered
         * with the default order — which would tell a reader their sort worked.
         * A line on the page and not a 500: the standing above it is still true,
         * and the ledger's own address is one link away from being right.
         */
        <p className="text-sm text-ink-soft" data-testid="my-xp-refused">
          {page.error}{" "}
          <Link href="/me?view=xp" className="underline underline-offset-4">
            Start again
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className={TABLE_CLASS} data-testid="my-xp-ledger">
              <Headings />
              <tbody>
                {page.items.length === 0 ? (
                  <tr className={ROW_CLASS}>
                    {/*
                      The shape, and the way in. Not a hidden panel and not a
                      sentence apologising for the absence: "nobody has earned
                      anything here yet" is a true fact about this member, and
                      every one of the site's forty games is a first play
                      somebody has not had.
                    */}
                    <td colSpan={4} className="py-3 text-sm text-muted" data-testid="my-xp-empty">
                      Nothing yet. XP comes from turning up and trying things — every game you
                      finish, and every one of the forty here you try for the first time.{" "}
                      <Link href="/games" className="underline underline-offset-4">
                        Pick a game and start earning
                      </Link>
                      .
                    </td>
                  </tr>
                ) : (
                  page.items.map((row) => (
                    <tr key={row.id} className={ROW_CLASS} data-testid="my-xp-award">
                      {/*
                        `whitespace-nowrap` on both figures. At 390 the browser
                        will break "2026-09-08" across two lines to make room for
                        the sentence beside it, and a date in two pieces is the
                        one thing in the row that stops being readable. The
                        sentence is what should wrap, and does.
                      */}
                      <td className={`${CELL} whitespace-nowrap align-top`}>
                        <Earned row={row} />
                      </td>
                      <td
                        className={`${CELL} whitespace-nowrap align-top`}
                        data-testid="my-xp-points"
                      >
                        +{row.points}
                      </td>
                      <td className="py-1.5 pr-3 align-top">
                        <span className="font-semibold">
                          <Paired
                            en={row.label}
                            kanji={row.kanji}
                            kanjiClassName="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
                          />
                        </span>
                        {/* The sentence saying what it was for, from the catalogue. */}
                        <span className="block text-xs text-muted">{row.blurb}</span>
                        {/*
                          The phone's About, under the sentence — see
                          ABOUT_ON_A_DESK — and NOT for a row about nothing.
                          The dash exists to fill a column cell so the column
                          stays aligned; with no column to fill it is a line of
                          punctuation on a phone saying what the absence of a
                          line already says.
                        */}
                        {row.about.of === "nobody" ? null : (
                          <span className="mt-0.5 block sm:hidden">
                            <About about={row.about} />
                          </span>
                        )}
                      </td>
                      <td className={`py-1.5 pr-3 align-top ${ABOUT_ON_A_DESK}`}>
                        <About about={row.about} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {page.next === null ? null : (
            /*
             * A LINK, so the next page has an address: it can be shared,
             * opened in a new tab, and it works with no JavaScript — the same
             * reasoning the tabs above it keep. It carries the cursor and every
             * other parameter, `view` included, so "more" stays on this tab.
             */
            <p className="text-sm">
              <Link
                href={xpMoreHref("/me", query, page.next)}
                scroll={false}
                className="underline underline-offset-4"
                data-testid="my-xp-more"
              >
                Earlier awards
              </Link>
            </p>
          )}

          {page.skipped.unknownType > 0 ? (
            /*
             * Said out loud rather than swallowed. A row whose type this deploy
             * has never heard of cannot be explained, so it is dropped — and a
             * ledger quietly one row short is exactly the kind of silence
             * AGENTS.md is about. It should never appear.
             */
            <p className="text-xs text-muted" data-testid="my-xp-skipped">
              {page.skipped.unknownType} award{page.skipped.unknownType === 1 ? "" : "s"} on this
              page were earned under a rule this version of the site cannot explain, and are not
              shown. Your total still counts them.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
