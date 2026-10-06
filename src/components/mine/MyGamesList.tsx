import Link from "@/components/ui/Link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { catchUpSeats } from "@/lib/bots/catchUpSeats";
import { keepFinishedDaysFor } from "@/lib/auth/members";
import { MY_FINISHED_PAGE, MY_FINISHED_PAGE_OPEN } from "@/lib/history/myFinished.sort";
import { MY_GAME_GROUPS, fetchMyGames, pagedGroup, shownGroup, type MyGameGroup } from "@/lib/history/myGames";
import { MY_GAMES_VIEWS, VIEW_GROUPS, myGamesView, type MyGamesView } from "@/lib/history/myGamesViews";
import { runsOf } from "@/lib/puzzles/server/puzzleRuns";
import { racesWaitingOn } from "@/lib/puzzles/server/puzzleRaces";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";
import { xpEarnedIn } from "@/lib/xp/xpOfGames";
import type { Tab } from "@/lib/ui/tabs";
import { gamesGoing } from "@/lib/history/gamesGoing";
import { seatClaims } from "@/lib/history/seatCookie";
import { BotCatchUp } from "./BotCatchUp";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { myGamesCopy } from "./mine.copy";
import { FavouritesPanel } from "./FavouritesPanel";
import { Group } from "./MyGamesGroup";
import { MyPuzzleRuns } from "./MyPuzzleRuns";
import { CompletedRowView } from "./CompletedRowView";
import { mySolvesBefore, mySolvesCount } from "@/lib/puzzles/server/mySolves";
import { SEATED_ONLY, finishedCursorBefore } from "@/lib/history/myFinished";
import { completedBefore, completedRows, mergeCompleted } from "@/lib/history/completed";
import { completedChoices, completedFilter, completedHref } from "@/lib/history/completedFilter";
import { CompletedFilters } from "./CompletedFilters";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import { slugFor } from "@/lib/gomoku/slugs";
import { keptOverCount, keptOverOf } from "@/lib/history/everyGame";
import { favouriteGamesOf, favouritesAmong } from "@/lib/history/favourites";
import { SeatedNarrowing } from "./SeatedNarrowing";
import { MyTables } from "@/components/party/online/MyTables";
import { MyHistorySection } from "./MyHistorySection";
import type { MyTable } from "@/lib/party/online/server/myTables";
import type { NameTag } from "@/lib/xp/nameTag.types";

/**
 * How many of each group the lobby prints BY DEFAULT — and every one of them
 * can now be opened in full.
 *
 * The games waiting on you are the reason to open this page, so they are all
 * shown however many there are. The rest are a reminder rather than a queue,
 * and a reminder that runs to fifty rows is a page nobody reaches the bottom
 * of — twenty games at once is the most anybody is meant to have, and the
 * groups that grow without anyone deciding to are held to a handful.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "14 · SHOWING 5" IS A PROMISE, AND THE NINE ARE NOW REACHABLE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The cap was a display cap with nothing behind it: the heading said fourteen
 * and there was no way to see nine of them. The comment under the finished
 * group already said as much — "the other groups have no such page… so there is
 * nothing honest to link to if one of them ever grows past its cap" — which was
 * a true report of a gap rather than a reason for it.
 *
 * A `?all=<group>` on the address opens one group where it stands.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SIX OF THESE GROUPS OPEN IN PLACE; THE SEVENTH PAGES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * For the six that are a DEBT, opening in place is truthful rather than the
 * client-side slice this convention forbids elsewhere, because THE LIST IS
 * ALREADY COMPLETE: every active game of yours is read — the bound is the
 * twenty-games-at-once cap on playing, not a cap on reading — so there is no
 * second page for an in-memory slice to be wrong about. A Directory row could
 * not say the same, and does not sort.
 *
 * FINISHED IS THE ONE THAT PAGES, and the paragraph that used to stand here
 * said it could not. Its argument was that the BUCKETS cannot be decided in SQL:
 * which group a game is in depends on whose turn it is, the stored answer to that
 * is nullable, and a null there means "nobody has written one" rather than "it is
 * over" — see the head of `settledTurn.ts` — so a query cannot be trusted to
 * group by it. Every word of that is still true — and it is an argument about the
 * six, not about this one. "Not
 * active, and not an offer" IS answerable from columns, exactly and cheaply, and
 * it is the definition of this group; only the rows the engine has ended while
 * their row still says active need a replay, and those come in on the complete
 * half. See `myFinished.ts`, which reads the page, and `myGames.ts`, which
 * explains the split.
 *
 * So `?all=finished` is a page of twenty with the true count above it and the
 * way on to the older ones, rather than every finished game anybody has ever
 * played. It has to be: the whole-group read was costing 571 rows on the site
 * owner's own account, on the page he opens daily.
 *
 * ONE GROUP AT A TIME, and the way back is a link. Opening everything at once
 * is the page this cap exists to prevent; and a group that could be opened and
 * not closed is the one-directional fault only a return trip finds.
 */
const SHOWN: Record<MyGameGroup, number> = {
  /*
   * Every offer, always. They are the shortest group on the page — nobody is
   * asked for fifty games — and each one is a person waiting on an answer, so
   * a cap here would hide a question rather than trim a list. Same reasoning
   * as `yourMove`, which is the other group that is a debt.
   */
  offered: 50,
  yourMove: 50,
  theirMove: 20,
  /*
   * And every offer you have SENT, for a reason the others do not share: this
   * group holds the declines, and a decline is the one thing on this page
   * somebody has to be told. Capping it could hide "Hanachan declined" behind
   * five offers made since, which is the only way this feature can fail
   * silently.
   */
  offerSent: 50,
  unstarted: 10,
  hotSeat: 5,
  /*
   * The same five it has always shown, declared where the READ is bounded rather
   * than here, because it is a `take` now and not a slice. It is still in this
   * table so that a reader comparing the seven groups sees all seven numbers.
   */
  finished: MY_FINISHED_PAGE,
};

/**
 * The games this browser holds a seat in, as the queue the turn-based sites
 * taught: yours to move first, then the ones you are waiting on, the ones
 * nobody has started, and lately finished ones. Nothing is shown when there
 * is nothing to show — the lobby is not the place for an empty list.
 */
export async function MyGamesList({
  showAll = null,
  cursor = null,
  withMember = null,
  viewAsked,
  local = null,
  openSeats = null,
  tables = null,
  historyBefore = null,
  family = null,
  game = null,
}: {
  /** The family and the game Completed is narrowed to, off the address (`completedFilter.ts`); unchecked here. */
  family?: string | null;
  game?: string | null;
  /**
   * One other member, by id: the list becomes the games running between the
   * reader and them — the set a buddy row's "2 going" counts, no more and no
   * less (`gamesBetween`), so that figure can be a link. `/play?with=`.
   */
  withMember?: string | null;
  /**
   * The group the address asks to see whole, or null for the ordinary caps.
   *
   * A loose string rather than a `MyGameGroup`, because it comes off a URL and
   * has not been checked yet. `openedGroup` is the one place it becomes a group
   * — an unknown value opens nothing rather than throwing, since a stale link is
   * not something to put an error in front of somebody for.
   */
  showAll?: string | null;
  /**
   * Where the last page of the finished group ended, off the address.
   *
   * Only the finished group pages, so this is only ever read with
   * `?all=finished` — a cursor without it names a position in a list nobody has
   * asked to see. Unchecked here as well: `decodeCursor` refuses anything that
   * is not a cursor for this ordering and the list starts again, which is the
   * right answer to a stale link and the convention's one parameter answered by
   * carrying on rather than by a refusal.
   */
  cursor?: string | null;
  /** The tab the path names (/play/<view>), already checked by the page: `myGamesView` decides. */
  viewAsked?: string | string[];
  /** The board kept in this browser (`LocalGameCardClient`), drawn on Pass and play. */
  local?: ReactNode;
  /** The seats other members have posted (`OpenSeatsSection`), drawn under Going. */
  openSeats?: ReactNode;
  /** The party tables the member sits at on several devices (`myTables`): going under Going, finished under Completed. */
  tables?: { going: readonly MyTable[]; finished: readonly MyTable[]; finishedMore: boolean; finishedTotal: number; tags: ReadonlyMap<string, NameTag> } | null;
  /** Where the History tab was paged to (`?before=`, an ISO time), or null for the newest. */
  historyBefore?: string | null;
} = {}) {
  const say = await currentSpeaker();
  const MY_GAMES_COPY = myGamesCopy(say);
  const claims = seatClaims((await cookies()).getAll());
  // The member, by id — however they came in. Null for a browser holding only seat cookies.
  const memberId = await currentMemberId();
  /*
   * `?all=seated` IS NOT A GROUP, IT IS A SET A COUNT PROMISED: the games the
   * games-at-once limit counts, which a seat-refused notice links its number to.
   * No cookie claims and a window that keeps everything, so the queue read
   * returns exactly `seatedLive` and nothing the count counted is dropped.
   */
  const seated = showAll === SEATED_ONLY;
  // A browser with no account and no seat: the board kept in it, and the open seats, and nothing else.
  if (claims.size === 0 && memberId === null && !seated) return <>{local}{openSeats}</>;
  const now = new Date();
  /*
   * THE TAB, decided before the read, because the Completed tab IS the finished
   * list: it opens as the paged list, twenty a page with arrows, rather than
   * five and a "Show all" (John, 2026-09-25: "Why do we show 6… and where is the
   * pagination?"). Counts are drawn on the tabs after the read.
   */
  const view = myGamesView(MY_GAMES_VIEWS.map((key) => ({ key, label: key })), viewAsked, showAll);
  const opened = view === "completed" ? "finished" : openedGroup(showAll);
  /*
   * THE COMPLETED TAB IS ONE LIST OF EVERY KIND, paged by the time each game
   * ended (`completed.ts`), so its place in the address is a time: the games
   * are read from it like the tables, the games round one screen and the
   * puzzles beside them.
   */
  const before = view === "completed" ? completedBefore(cursor) : null;
  const narrowing = view === "completed" ? completedFilter(family, game) : completedFilter(null, null);
  const { only } = narrowing;
  const paging = opened === "finished" ? { limit: MY_FINISHED_PAGE_OPEN, cursor: before === null ? null : finishedCursorBefore(before), only } : {};
  const readQueue = async (at: Date) =>
    withMember !== null
      ? // No cookie seats and no finished window: the set is the two of you, running, and that is all.
        await fetchMyGames(new Map(), memberId, at, 0, {}, { with: withMember })
      : seated
        ? await fetchMyGames(new Map(), memberId, at, 0, {}, { only: SEATED_ONLY })
        : await fetchMyGames(claims, memberId, at, await keepFinishedDaysFor(memberId), paging);
  const queue = await readQueue(now);
  const { groups } = queue;
  /*
   * THE COMPUTER'S MOVE NOBODY STAYED FOR, handed to the browser that is
   * reading this page — see `unansweredBotTurns` for which games those are and
   * `BotCatchUp` for what is done about them.
   *
   * The server used to play them here, which worked and cost a search inside
   * this render on the one page a member opens daily. The machine in front of
   * the person is idle, already has the chooser, and is where every other
   * computer move on this site is now worked out.
   *
   * ONLY GAMES THIS READER HOLDS THE SEAT IN, with that seat's own key — see
   * `catchUpSeats`, which asks `resolveSeat` exactly as the match page does.
   * Nothing is handed over for a seat that is not this reader's.
   */
  const stuck = await catchUpSeats(groups, claims, memberId, now);
  const shown = MY_GAME_GROUPS.reduce((n, group) => n + groups[group].length, 0);
  // The puzzles left unfinished, kept on the account: one indexed read, for Going and its count.
  // And the flag and badge beside every name in the queue, one read for all of them (`nameTagsOf`).
  // And, on the Completed tab, what each finished game on the page earned the reader (`xpEarnedIn`).
  // And on the Completed tab, the starred games for the panel above the list (first page only) and which of the page's rows are starred.
  const completed = view === "completed" && memberId !== null;
  const [favourites, starred, solves, device, solvedCount, deviceCount] = await Promise.all([
    completed && before === null && only === null ? favouriteGamesOf(memberId) : { rows: [], total: 0 },
    completed ? favouritesAmong(memberId, groups.finished.map((item) => item.game.id)) : null,
    // The finished puzzles and the games round one screen that are over, listed only on Completed among the games; counted for its number.
    completed ? mySolvesBefore(memberId, before, MY_FINISHED_PAGE_OPEN, only) : null,
    completed ? keptOverOf(memberId, before, MY_FINISHED_PAGE_OPEN, only) : null,
    memberId === null ? 0 : mySolvesCount(memberId, only),
    memberId === null ? 0 : keptOverCount(memberId, only),
  ]);
  const listed = [...MY_GAME_GROUPS.flatMap((group) => groups[group]), ...favourites.rows];
  const completedTotal = queue.finished.total + solvedCount + (tables?.finishedTotal ?? 0) + deviceCount;
  const page = mergeCompleted(
    completedRows({ games: groups.finished, tables: tables?.finished ?? [], device: device?.entries ?? [], solves: solves?.solves ?? [] }),
    MY_FINISHED_PAGE_OPEN,
    queue.finished.next !== null || (tables?.finishedMore ?? false) || (device?.more ?? false) || (solves?.more ?? false),
  );
  // And the races waiting on the reader, offered or not yet started (`racesWaitingOn`), in the same panel as the puzzles.
  const [runs, races, tags, earned] = await Promise.all([
    memberId === null ? [] : runsOf(memberId),
    memberId === null || view !== "going" ? [] : racesWaitingOn(memberId, now),
    nameTagsOf([...listed.flatMap((item) => [item.game.blackMemberId, item.game.whiteMemberId]), ...(device?.entries ?? []).flatMap((entry) => entry.others.map((other) => other.memberId))]),
    view === "completed" ? xpEarnedIn(memberId, [...groups.finished, ...favourites.rows].map((item) => item.game.id)) : new Map<string, number>(),
  ]);

  /** One group's panel, or nothing for a closed empty group that has nothing to say when empty. */
  const panel = (group: MyGameGroup, empty: string | null = null) => {
    const open = group === opened;
    const bucket = seated
      ? /*
         * NARROWED, EVERY ROW IS SHOWN — a branch of its own rather than a
         * flag folded into `open`, because it is not "open every group".
         * The set is `seatedLive`, which the games-at-once limit bounds, and
         * a count elsewhere promised exactly that many rows; a cap here
         * would show fewer than the number that led the reader in.
         */
        shownGroup(groups[group], groups[group].length)
      : group === "finished" && view === "completed"
        ? // Every kind of finished game counted, and the page is the one list's rows (`completed.ts`).
          { items: groups.finished, total: completedTotal, hidden: Math.max(0, completedTotal - page.rows.length) }
        : group === "finished"
        ? /*
           * A PAGE, so the total comes from the database and not from the
           * list's own length. See `pagedGroup`: the finished list is five
           * rows of however many there are, so counting the rows in hand
           * would print the cap as the total — which is the fault
           * `shownGroup` was written to make impossible, arriving by the
           * other door.
           */
          pagedGroup(groups.finished, queue.finished.total)
        : // Opened means no cap at all, which `shownGroup` says as the length itself.
          shownGroup(groups[group], open ? groups[group].length : SHOWN[group]);
    /*
     * AN OPENED GROUP DRAWS EVEN WHEN IT IS EMPTY, which is the site's rule
     * about empty tables and also the only way off the last page: a reader
     * who follows "older finished games" past the end must find the panel and
     * its way back, not a blank page with the heading gone. So does a group
     * that has something to say when empty — the two columns and each tab.
     */
    return bucket.total === 0 && !open && empty === null ? null : (
      <Group
        key={group}
        group={group}
        bucket={bucket}
        memberId={memberId}
        now={now}
        open={open}
        empty={empty}
        tags={tags}
        earned={earned}
        // A star on each finished row, for a member (the rows of a browser with no account offer none).
        starred={group === "finished" ? starred : null}
        rows={group === "finished" && view === "completed"
          ? page.rows.map((row) => (
              <CompletedRowView key={row.key} row={row} now={now} tags={tags} tableTags={tables?.tags ?? tags} earned={earned} starred={starred} />
            ))
          : null}
        /*
         * The next page, for the one group that has one. Built here rather
         * than in the panel because the panel is given a bucket and knows
         * nothing about cursors, and only ever offered while the group is
         * open: on a closed panel "Show all" is the way in, and two links to
         * two different pages of the same list would be one too many.
         */
        // `?all=finished` opens Completed (`viewOfGroup`), so the one list is the only one that pages.
        more={view === "completed" && group === "finished" && page.next !== null ? completedHref({ family, game }, page.next) : null}
        // The tab is this list, so there is no "Show fewer" to go back to; past the first page, the way to the newest.
        whole={view === "completed" && group === "finished"}
        newest={view === "completed" && group === "finished" && before !== null ? completedHref({ family, game }) : null}
      />
    );
  };

  /*
   * NARROWED TO ONE PERSON, OR TO THE GAMES THE LIMIT COUNTS: one list of what
   * was asked for, with no tabs. A count led the reader here, and the page is
   * that set and nothing beside it.
   */
  if (seated || withMember !== null) {
    return (
      <section className="flex flex-col gap-4" data-testid="my-games">
        <BotCatchUp games={stuck} />
        {seated ? <SeatedNarrowing total={shown} /> : null}
        {MY_GAME_GROUPS.map((group) => panel(group))}
      </section>
    );
  }

  const going = gamesGoing(groups);
  // Each tab counts what it holds: Going its games and the puzzles left part way, Completed its games and the puzzles finished.
  const counts: Record<MyGamesView, number> = {
    going: going + runs.length + races.length + (tables?.going.length ?? 0),
    completed: completedTotal,
    "pass-and-play": groups.hotSeat.length,
    // Counted on its own tab only (`MyHistorySection`): four counts on every visit to /play is a price for a badge.
    history: Number.NaN,
  };
  const tabs: Tab[] = MY_GAMES_VIEWS.map((key) => ({ ...MY_GAMES_COPY.views[key], key, ...(Number.isNaN(counts[key]) ? {} : { count: counts[key] }) }));
  const goingShown = VIEW_GROUPS.going.reduce((n, group) => n + groups[group].length, 0);

  return (
    <section className="flex flex-col gap-4" data-testid="my-games" data-view={view}>
      {/*
        Draws nothing. It is here rather than on the page because this is where
        the queue is read, and the games it is given come out of that same read.
      */}
      <BotCatchUp games={stuck} />
      {/* The count of games going is on the Going tab now, and the strip reads the same number. */}
      <span hidden data-testid="my-games-heading" data-going={going} />
      <Tabs tabs={tabs} active={view} base="/play" label={say.say("mine.myGamesTabs")} />

      {view === "going" ? (
        goingShown === 0 && opened === null ? (
          <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-empty">
            {/*
              THE ONE PLACE ON THIS PAGE THAT SHOULD OFFER A GAME. Somebody with
              nothing going is shown the door to one, not told about it.
            */}
            <p className="text-sm text-muted">
              {say.say("mine.noneGoing")}{" "}
              <Link href="/games/new" className="font-medium text-ink underline underline-offset-4" data-testid="empty-new-game">
                {say.say("mine.newGameArrow")}
              </Link>
            </p>
          </div>
        ) : (
          <>
            {panel("offered")}
            {/*
              YOUR MOVE ON THE LEFT, THEIR MOVE ON THE RIGHT. John, 2026-09-25:
              "just do OUR MOVE on LHS, and their Move on RHS. Easier to keep
              track of… make sure we don't show too much wide data otherwise
              might mess up mobile. which will probably be top down anyway."
              One column on a phone, your move first.
            */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start" data-testid="my-games-columns">
              {panel("yourMove", MY_GAMES_COPY.empty.yourMove)}
              {panel("theirMove", MY_GAMES_COPY.empty.theirMove)}
            </div>
            {panel("offerSent")}
            {panel("unstarted")}
          </>
        )
      ) : null}
      {/* The puzzles left part way, under Going with the games (John: "not two areas"). */}
      {view === "going" && runs.length + races.length > 0 ? <MyPuzzleRuns runs={runs} races={races} /> : null}
      {/* The party tables on several devices, a panel of their own: a table's turn goes round several people. */}
      {view === "going" && tables !== null ? <MyTables tables={tables.going} finished={false} tags={tables.tags} /> : null}
      {view === "going" ? openSeats : null}
      {/* The starred games first, on the first page: John, "favourite your game, it moves to the top". */}
      {/*
        ONE LIST OF EVERYTHING FINISHED. John, 2026-09-30: "Complete games page
        should list everything together. Right now it's grouped so need to go
        down low to see some stuff. We don't want things buried." Games, tables,
        games round one screen and puzzles are rows of one list, newest first
        (`completed.ts`), under the games you starred.
      */}
      {view === "completed" ? (
        <div className="flex min-w-0 flex-col gap-4" data-testid="completed-games">
          <CompletedFilters
            choices={completedChoices()}
            family={narrowing.family === null ? null : { key: narrowing.family.key, title: narrowing.family.title }}
            game={narrowing.game === null ? null : { slug: slugFor(narrowing.game), label: gameCopyFor(narrowing.game).label }}
          />
          {completed && before === null && only === null ? <FavouritesPanel rows={favourites.rows} total={favourites.total} now={now} tags={tags} earned={earned} /> : null}
          {panel("finished", MY_GAMES_COPY.empty.completed)}
        </div>
      ) : null}
      {view === "history" && memberId !== null ? <MyHistorySection memberId={memberId} before={historyBefore} /> : null}
      {view === "pass-and-play" ? (
        <>
          {local}
          {panel("hotSeat", MY_GAMES_COPY.empty.passAndPlay)}
        </>
      ) : null}
    </section>
  );
}

/**
 * A group name off an address, checked — or null.
 *
 * Null for anything that is not one of the groups, which is what a stale or
 * hand-typed `?all=` is. Opening nothing is the right answer to that: the page
 * is the page either way, and a 404 or an error banner for a parameter nobody
 * typed on purpose would be an error the reader cannot act on.
 */
function openedGroup(asked: string | null): MyGameGroup | null {
  return MY_GAME_GROUPS.find((group) => group === asked) ?? null;
}
