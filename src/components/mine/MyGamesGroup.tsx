import Link from "next/link";

import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import type { MyGame, MyGameGroup, ShownGroup } from "@/lib/history/myGames";
import { viewHref, viewOfGroup } from "@/lib/history/myGamesViews";
import type { NameTag } from "@/lib/xp/nameTagsOf";
import { playerPath } from "@/lib/rating/playerKey";
import { MY_GAMES_COPY } from "./mine.constants";
import { GroupHeading } from "./GroupHeading";
import { Row } from "./MyGameRow";

/**
 * ONE GROUP OF THE QUEUE, AS A PANEL: its name, its count, its rows, and the
 * ways to the rest. Split out of `MyGamesList.tsx` when /play became tabs, which
 * is the queue and the tabs; this is one list inside them.
 *
 * THE COUNT IS BIG. John, 2026-09-25: "the counts are too subtle. Their Move 3
 * is too subtle. we should probably see a larger (3) somewhere… either a badge
 * or larger number." So it is the largest thing in the heading.
 */
export function Group({
  group,
  bucket,
  memberId,
  now,
  open,
  more = null,
  empty = null,
  tags,
  earned,
  whole = false,
  newest = null,
  starred = null,
}: {
  /** The reader's starred games among these rows, where the rows offer a star (finished games, a member); null for none. */
  starred?: ReadonlySet<string> | null;
  group: MyGameGroup;
  bucket: ShownGroup<MyGame>;
  /** Whose "see the rest" this is, when there is a rest and somewhere to send them for it. */
  memberId: string | null;
  now: Date;
  /** Whether the address has asked for this group whole. */
  open: boolean;
  /** Where the page after this one is, for the group that pages. Null for the six that do not. */
  more?: string | null;
  /**
   * What the panel says when it holds nothing, for the panels that are drawn
   * empty: the Your move and Their move columns, and a tab. An empty table is
   * data. Null for the groups that are simply left out when empty.
   */
  empty?: string | null;
  /** The flag and badge beside each name in the rows (`nameTagsOf`). */
  tags: ReadonlyMap<string, NameTag>;
  /** What each finished game earned the reader, where it earned anything (`xpEarnedIn`). */
  earned?: ReadonlyMap<string, number>;
  /** Whether the tab is this list (Completed), so it pages with arrows and has no "Show fewer". */
  whole?: boolean;
  /** Where the first page is, past it, for the list that pages with arrows. */
  newest?: string | null;
}) {
  const copy = MY_GAMES_COPY.groups[group];
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={`my-games-${group}`}>
      <GroupHeading
        label={copy.label}
        kanji={copy.kanji}
        total={bucket.total}
        showing={bucket.hidden > 0 ? bucket.items.length : null}
        waiting={group === "yourMove" || group === "offered"}
        testId={`my-games-${group}`}
      />
      <p className="text-xs text-muted">{copy.hint}</p>
      {bucket.total === 0 && empty !== null ? (
        <p className="text-sm text-muted" data-testid={`my-games-${group}-empty`}>
          {empty}
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {bucket.items.map((item) => (
          <Row key={item.game.id} item={item} now={now} tags={tags} earned={earned?.get(item.game.id)} starred={starred === null ? null : starred.has(item.game.id)} />
        ))}
      </ul>
      {/*
        NOTHING AT ALL WHEN THERE IS NOTHING TO OFFER, which is the ordinary case
        and the one worth protecting. A group inside its cap has no rest to show,
        is not the opened one, and has no record to point at — so this row is not
        drawn, and the panel is exactly the panel it was before any of this
        existed. An empty flex row would be a gap under every group on John's
        daily page, added by a feature that had nothing to say there.
      */}
      {bucket.hidden > 0 || open ? (
      <div className="flex flex-wrap items-center gap-4">
        {/*
          THE CAP, OPENED. "14 · showing 5" said fourteen and offered nine
          nowhere; this is the nine. It is a link and the group is in the
          address, so an opened group can be linked, reloaded and arrived back
          at — the same reasoning every filter on this site keeps.
        */}
        {bucket.hidden > 0 && !open ? (
          <Link
            href={`/play?all=${group}`}
            className="text-xs font-medium underline underline-offset-4"
            data-testid={`my-games-${group}-all`}
          >
            {MY_GAMES_COPY.showAll(bucket.total)}
          </Link>
        ) : null}
        {/*
          THE PAGE AFTER THIS ONE, for the finished group only. "Show all" above
          leads to the FIRST page of an opened group, so drawing both at once
          would be two links to two different pages of one list — which is why
          that one is hidden while this group is open.

          Forward only, and the way out is "Show fewer" rather than a page back:
          a cursor is a position in a list and not an index into one, so there is
          no previous page to name without keeping a stack of them in the
          address. Every page here is an address, so the browser's own Back works;
          and one click returns to the top of the group whatever page you reached.
        */}
        {/*
          ARROWS WHERE THE TAB IS THE LIST: back to the newest page and on to the
          older one, as buttons, the way a paged list reads. Only forward pages
          have an address (a cursor names a position, not a page number), so the
          way back is to the newest page, and the browser's Back goes one page.
        */}
        {whole && newest !== null ? (
          <Link href={newest} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} data-testid={`my-games-${group}-newest`}>
            ← {MY_GAMES_COPY.newest}
          </Link>
        ) : null}
        {more !== null ? (
          <Link
            href={more}
            className={whole ? `${BUTTON_BASE} ${BUTTON_QUIET} ml-auto px-3` : "text-xs font-medium underline underline-offset-4"}
            /*
              `-older`, NOT `-more`: the record link below this row has been
              `my-games-finished-more` since it existed, and both of these are on
              the finished panel at once. Two controls under one test id is a
              spec that clicks whichever came first in the DOM and a `getByTestId`
              that fails on a strict-mode violation — found by grepping the real
              page's HTML for its ids, which is the only place the clash is
              visible: nothing about writing either line says the other exists.
            */
            data-testid={`my-games-${group}-older`}
          >
            {whole ? `${MY_GAMES_COPY.older} →` : MY_GAMES_COPY.showOlder}
          </Link>
        ) : null}
        {/*
          And the way back, which is the half a one-directional control always
          forgets. Drawn only when this group is the opened one, so it is not a
          link that does nothing on every other panel.
        */}
        {open && !whole ? (
          <Link
            href={viewHref(viewOfGroup(group))}
            className="text-xs font-medium underline underline-offset-4"
            data-testid={`my-games-${group}-fewer`}
          >
            {MY_GAMES_COPY.showFewer}
          </Link>
        ) : null}
        {/*
          Held-back finished games also have somewhere to be seen BESIDE this
          page: a signed-in member's own page counts every finished game, exactly
          what this bucket does — and it counts the ones past the window this
          list drops, which opening the group here cannot show. So it stays, and
          it is a different promise from the one above rather than a duplicate of
          it.
        */}
        {bucket.hidden > 0 && group === "finished" && memberId !== null ? (
          <Link
            href={playerPath("", memberId)}
            className="text-xs font-medium underline underline-offset-4"
            data-testid="my-games-finished-more"
          >
            {MY_GAMES_COPY.seeRecord}
          </Link>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
