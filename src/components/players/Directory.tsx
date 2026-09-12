import Link from "next/link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { CountryMark } from "@/components/players/CountryMark";
import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { memberKind } from "@/lib/auth/memberKind";
import { DirectoryFilters } from "@/components/players/DirectoryFilters";
import { RecencyMark } from "@/components/mine/Recency";
import { buddyEmails } from "@/lib/social/buddies";
import { countText } from "@/lib/rating/figures";
import { currentSession } from "@/lib/auth/currentSession";
import { DIRECTORY_SORT_SPEC } from "@/lib/rating/directory.sort";
import {
  directoryPagingFallback,
  fetchDirectoryPage,
  readDirectoryPaging,
} from "@/lib/rating/directoryPage";
import { isRefusal } from "@/lib/api/paging";
import type { DirectoryEntry } from "@/lib/rating/directoryRows";
import { gamesPlayed, ratingShown } from "@/lib/rating/shownRecord";
import { RECORD_SCOPES, scopeWorthAsking, type RecordScope } from "@/lib/rating/recordScope";
import { RecordScopeBar } from "./RecordScopeBar";
import { RecordTable, type RecordTableRow } from "./RecordTable";
import type { RecordSort } from "./recordSort";
import { levelShown } from "@/lib/xp/levelShown";
import type { DirectoryFilter } from "@/lib/rating/directoryFilter";
import { SHOW_EVERYBODY_HREF } from "@/lib/rating/rememberedFilter";
import { ignoredEmails } from "@/lib/social/ignores";
import { playerPath } from "@/lib/rating/playerKey";
import { shownName } from "@/lib/rating/shownName";
import { directoryActions } from "./directoryActions";

/**
 * One member's row, worked out from their profile and what they played
 * elsewhere.
 *
 * This used to read the ladder columns alone, and a person whose games had all
 * been against the computer players came out as 0W 0L 0D with a dash for a
 * rating — while their own page, one click away, showed five games and a
 * rating of 1639. The columns were not wrong about the ladder; they were
 * answering a question nobody had asked them, and saying nothing about which.
 *
 * So the counts are every game played here, and the rating says which pool
 * earned it whenever it is not the ladder.
 *
 * THE COUNTS REACH FURTHER BACK THAN THIS SITE, which was the same fault one
 * step over. A kept record has a member row so the site can list them at all,
 * and this table read the Itsutsu columns alone — so Chibi, fourteen thousand
 * games on two sites before this one existed, appeared as somebody who had
 * never played. His own page said 14,606 the whole time.
 *
 * THE RATING DOES NOT REACH BACK, and that is the one column that must not.
 * Games and wins add up; ratings do not — another site's is on another scale,
 * against other players, and was never converted. So the rating column always
 * answers about Itsutsu whatever the counts beside it are counting.
 *
 * THE STREAK DOES NOT REACH BACK EITHER, for a stronger reason than the
 * rating's: a run is an ORDER, and a record copied down from another site is
 * four totals with no order in them at all. So it is the run over the games
 * finished HERE — every one of them, rated or not, which is exactly the set
 * `gamesPlayed` counts — and on a row carrying a kept record the cell says as
 * much in its own words, since `of.here` is false there.
 */
function directoryRow(
  entry: DirectoryEntry,
  scope: RecordScope,
  actions: ReturnType<typeof directoryActions>,
): RecordTableRow {
  /*
   * EVERY GAME PLAYED HERE, off the member's own row. It was 0.147.1's fix that
   * this counts every finished game rather than the rated ones — Andrus
   * Meritalu had 36 and this column said 1 — and the figures came from
   * `fetchPlayedTallies`, one query over the GAMES table for the whole page,
   * until the directory learned to sort. They are columns on `Member` now, kept
   * by `recordPlayed` at the same four endings, checked against
   * `fetchPlayedTallies` by `playedTally.test.ts`: the same set of games,
   * counted where the database can also ORDER by it.
   */
  const here = gamesPlayed(entry.played);
  /*
   * Counting everywhere unless the reader has asked for this site alone. The
   * table led with the lifetime figure and offered no way to narrow it, while
   * the page one click away — a player's own — had offered exactly that choice
   * for two releases. Same question, same two answers, and the list could only
   * give one of them.
   */
  const everywhere = scope === RECORD_SCOPES.everywhere;
  const elsewhere = entry.elsewhere;
  const record = everywhere
    ? {
        wins: here.wins + elsewhere.wins,
        losses: here.losses + elsewhere.losses,
        draws: here.draws + elsewhere.draws,
      }
    : here;
  // Only worth marking where the figure beside it actually reaches back.
  const kept = everywhere && elsewhere.wins + elsewhere.losses + elsewhere.draws > 0;
  const rating = ratingShown(entry.profile);
  return {
    key: entry.id,
    subject: (
      <span className="flex items-center gap-2">
        <RecencyMark recency={actions.recency(entry)} />
        {entry.picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
          <img src={entry.picture} alt="" className="size-5 rounded-full" referrerPolicy="no-referrer" />
        ) : null}
        {entry.name.trim() !== "" ? (
          <Link
            href={playerPath(entry.name, entry.id)}
            className="underline-offset-2 hover:underline"
            data-testid="directory-name"
          >
            {shownName(entry.name)}
          </Link>
        ) : (
          entry.email
        )}
        {/* Where they are, which is most of why they answer at four in the morning. */}
        <CountryMark country={entry.country} className="text-sm" />
        {/*
          Which sort of member this is, drawn on the unusual rows only — the
          badge the operator's list has used all along, rather than a second
          one invented here. It earns its place now that the default shows
          programs alongside people: a reader should never have to work out
          which of the names is a program.
        */}
        <MemberKindBadge
          kind={memberKind({
            email: entry.email,
            botTier: entry.botTier,
            unclaimableBecause: entry.unclaimableBecause,
          })}
        />
      </span>
    ),
    record,
    /*
     * Every game here, both pools, rated or not — which is what `here` adds
     * up. `rated` is deliberately unset: "yes" would open a shorter list than
     * the number beside it promised. A row carrying a kept record is counting
     * games this site never saw, so it links nowhere: there is nothing here to
     * open, and a link showing the Itsutsu half under a total that includes
     * another site would be quietly wrong about which games it meant.
     */
    of: { player: entry.name, here: !kept },
    /*
     * THE RUN OVER EVERY GAME, which is the set this row's count is over —
     * and it exists because this cell showed a dash until it did.
     *
     * The three runs on the rating row are `people`, `computer` and `rated`,
     * and all three count RATED games; the count here counts every finished
     * game. So a rated run printed here would have been described by the cell
     * — which words its scope from the same `of` the counts link by — as a run
     * over every game, which it was not. The answer was a fourth scope rather
     * than a plausible number: `Member.playedStreakKind`, kept by
     * `recordPlayed` wherever a game is decided, read off the row this list
     * was fetching anyway — and now written in the same update as the four
     * counts beside it, so the two cannot disagree about the last game.
     */
    streak: entry.playedStreak,
    rating,
    /*
     * The XP level beside the name, off the member row this list already read.
     * `levelShown` is what decides whether there is one worth printing: nought
     * answers null, so nobody who has earned nothing wears a badge — and the
     * programs, which `awardXp` refuses by name, are omitted by that same rule
     * rather than by a check on `botTier`.
     */
    level: levelShown(entry.xp),
    joined: { at: entry.joinedAt, isNew: entry.isNew },
    note: kept ? (
      /*
       * Marked, because part of this number does not move.
       *
       * A profile page says it in a paragraph beside the figure; a table row
       * has nowhere to put one. Leaving it out because it does not fit would
       * be misleading by omission — which is precisely the fault the paragraph
       * was written to avoid — so the mark carries it, and the line under the
       * table says what the mark means.
       */
      <span
        className="ml-0.5 align-super text-[0.6rem] text-muted"
        title="Includes games from another site, copied down once and not updated since."
        data-testid="record-kept-mark"
      >
        ※
      </span>
    ) : null,
    actions: actions.forEntry(entry),
  };
}

/** The address one page of the directory lives at, keeping the sort and the tab. */
function pageHref(query: string, cursor: string | null): string {
  const params = new URLSearchParams(query);
  if (cursor === null) params.delete("cursor");
  else params.set("cursor", cursor);
  const rest = params.toString();
  return rest === "" ? "/players" : `/players?${rest}`;
}

/** The address the directory's own order lives at: no sort, and back to the top. */
function ownOrderHref(query: string): string {
  const params = new URLSearchParams(query);
  for (const gone of ["sort", "order", "cursor", "page"]) params.delete(gone);
  const rest = params.toString();
  return rest === "" ? "/players" : `/players?${rest}`;
}

/**
 * The members, with the record each name has earned, the bar that narrows
 * them, and headings that order them.
 *
 * Fetches its own rows rather than being handed them: it is the only section
 * that needs any of this, and a page that reads the directory in order to
 * render a ladder is a page that pays for four sections to show one.
 *
 * THE HEADINGS SORT NOW, WHICH THEY COULD NOT BEFORE, and the comment that used
 * to sit over this table said exactly why not: the rows were a composite of
 * four reads and the figures were in other tables, so there was no `orderBy` a
 * heading could reach. `fetchDirectoryPage` is that rewrite — one ordered query
 * over `Member`, whose played/won/lost/drawn are columns — and it also turns the
 * two hundred from a CUT into a PAGE. Which of the headings can be pressed, and
 * why the rest cannot, is `DIRECTORY_SORT_SPEC`'s to say.
 */
export async function Directory({
  filter,
  scope,
  query,
  now,
}: {
  filter: DirectoryFilter;
  scope: RecordScope;
  /** The address as it stands, so choosing a scope keeps the narrowing. */
  query: string;
  now: Date;
}) {
  const params = new URLSearchParams(query);
  const asked = readDirectoryPaging(params);
  /*
   * A refused sort leaves the reader on the directory with a line saying the
   * order was not applied — the ladder's own choice one tab over, for the same
   * reason: a 400 in the middle of a page of tabs is an error somebody who
   * followed a stale link cannot act on.
   */
  const refused = isRefusal(asked);
  const paging = refused ? directoryPagingFallback() : asked;
  const [page, me] = await Promise.all([
    fetchDirectoryPage({ paging, filter, now }),
    currentSession(),
  ]);
  const [buddies, ignored] = await Promise.all([
    me?.email ? buddyEmails(me.email) : Promise.resolve(new Set<string>()),
    me?.email ? ignoredEmails(me.email) : Promise.resolve(new Set<string>()),
  ]);
  const actions = directoryActions(me, buddies, ignored, now);
  const people = page.items;
  const anyKept = people.some(
    (entry) => entry.elsewhere.wins + entry.elsewhere.losses + entry.elsewhere.draws > 0,
  );

  const sort: RecordSort = {
    at: "/players",
    query,
    spec: DIRECTORY_SORT_SPEC,
    current: paging.sort,
    /*
     * The six headings the database can order by, named against the slots
     * `RecordTable` draws. `subject` is the Member heading, which sorts by name
     * — the only table on the site whose subject column can be ordered by. Win
     * rate, streak, rating and tier are left out, which is what makes them plain
     * text; `DIRECTORY_SORT_SPEC` says why each cannot, and the rating's reason
     * ends by pointing at the Ladder tab, which can.
     */
    by: {
      subject: "name",
      played: "played",
      won: "won",
      lost: "lost",
      drawn: "drawn",
      joined: "joined",
    },
  };
  /*
   * Whether the order in force is over the stored tally. It decides one
   * sentence, and only where there is a kept record on screen to be wrong
   * about: those four columns order by games played HERE, and a row marked ※ is
   * showing a total that reaches further back than this site. Saying so is
   * cheaper and more honest than either sorting by a figure half of which is
   * static data from another site, or refusing the sort on a page where two
   * rows out of six hundred carry one.
   */
  const tallySorted = ["played", "won", "lost", "drawn"].includes(paging.sort.column.param);

  return (
    <div className="flex flex-col gap-4" data-testid="directory-section">
      <p className="text-sm text-muted">
        The members, most recently seen first, with the record their name has earned. Press a
        heading to sort by it. New members are marked for two weeks; challenge one, and the game
        is in their list the moment you start it.
      </p>
      {/*
        `shown` is how many members MATCH the narrowing and not how many are on
        this page — which is what "3 of 15 listed" has always meant, and a paged
        list must not quietly re-point that sentence at its first fifty rows.
        How many are on screen is the line under the table, because that is a
        fact about the page rather than about the narrowing.

        And the address goes with it, so narrowing keeps the order a heading was
        just pressed for.
      */}
      <DirectoryFilters
        filter={filter}
        query={query}
        shown={page.matching}
        total={page.total}
      />
      {refused ? (
        <p className="text-sm text-muted" data-testid="directory-sort-refused">
          That was not an order the members list has, so this is the list by who was seen last.
        </p>
      ) : null}
      {/*
        Drawn only where it can change an answer — the same rule a player's own
        page keeps. With nobody on this list carrying a record from anywhere
        else, the two scopes are the same games, and a control that cannot
        change anything is furniture that also promises a chapter which is not
        there.
      */}
      {scopeWorthAsking(anyKept ? 2 : 1) ? (
        <RecordScopeBar
          base="/players"
          query={query}
          scope={scope}
          label="How much of these records to count"
        />
      ) : null}
      <RecordTable
        subject="Member"
        rows={people.map((entry) => directoryRow(entry, scope, actions))}
        columns={{ joined: true, actions: "" }}
        sort={sort}
        testId="directory"
        empty={
          /*
           * No testid of its own: `RecordTable` already wraps whatever `empty`
           * renders in a `<td data-testid="directory-empty">` — the id this
           * span duplicated from before the tables were unified, when
           * Directory drew its own empty row and needed one. Two elements
           * answering to the same test id is a strict-mode violation waiting
           * to happen, so the outer one is the only one that keeps it now.
           */
          <span>
            Nobody here answers to all of that.{" "}
            {/*
              Says "everyone" out loud rather than pointing at the bare page.
              Now that /players means "however I last asked", a way back that
              went there would re-apply the very narrowing it offers to remove,
              and appear to do nothing at all.
            */}
            <Link href={SHOW_EVERYBODY_HREF} className="underline underline-offset-4" data-testid="directory-clear">
              Show everybody again
            </Link>
            .
          </span>
        }
        /*
          What the mark means, said once under the table rather than repeated
          in every row that carries it. Drawn only when a row on this screen
          actually has one: a legend for a mark nobody can see is furniture.
        */
        caption={
          anyKept ? (
            <p className="text-xs leading-snug text-muted" data-testid="directory-kept-note">
              <span className="align-super text-[0.6rem]">※</span> Counts games from before Itsutsu, on
              the sites named on that player&rsquo;s own page.{" "}
              <span className="font-medium text-ink-soft">Those figures do not update</span> — they were
              copied down by hand once and are a snapshot of that day. Only what happens here is counted
              as it happens; the rating and the streak are always Itsutsu&rsquo;s alone.
              {tallySorted ? (
                <>
                  {" "}
                  <span data-testid="directory-sort-here-note">
                    This order is by games played HERE, so a row with the mark sits by its Itsutsu
                    figure rather than by the total shown.
                  </span>
                </>
              ) : null}
            </p>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted" data-testid="directory-page-count">
          {countText(people.length)} of {countText(page.matching)} shown
        </p>
        {page.next === null ? null : (
          <Link
            href={pageHref(query, page.next)}
            className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
            data-testid="directory-next"
          >
            Show the next {countText(Math.min(paging.limit, page.matching - people.length))}
          </Link>
        )}
        {/*
          THE WAY BACK, and there are two of them because a reader can be away
          from the top for two different reasons. Past the first page: a link
          home. Under a sort they pressed: a link to the directory's own order,
          which is the one order that has no heading to press — how recently
          somebody was seen is a mark in the name cell, not a column, so this
          link is the only control there is for it. A list that can be entered
          and not left is the fault only a return trip finds.
        */}
        {paging.cursor === null ? null : (
          <Link
            href={pageHref(query, null)}
            className="text-sm underline underline-offset-4"
            data-testid="directory-top"
          >
            Back to the first page
          </Link>
        )}
        {paging.sort.asked ? (
          <Link
            href={ownOrderHref(query)}
            className="text-sm underline underline-offset-4"
            data-testid="directory-own-order"
          >
            Most recently seen first
          </Link>
        ) : null}
      </div>
    </div>
  );
}
