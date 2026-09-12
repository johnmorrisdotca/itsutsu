import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { Leaderboard } from "@/components/xp/Leaderboard";
import { LevelName } from "@/components/xp/LevelName";
import type { SortChoice } from "@/lib/api/paging.types";
import { isRefusal } from "@/lib/api/paging";
import { countText } from "@/lib/rating/figures";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS } from "@/lib/xp/xpCurve";
import { fetchXpBoardPage, readXpBoardPaging, xpRankOf, type XpBoardPage } from "@/lib/xp/xpBoard";
import { viewerXp, type ViewerXp } from "@/lib/xp/xpViewer";

export const metadata = {
  title: "XP leaderboard",
  description:
    "Every member of Itsutsu by experience earned: their level, their total, and when they last earned.",
};

/* The reader's own row is marked and their standing is read off the session. */
export const dynamic = "force-dynamic";

/** Everything the address says, as a query string a heading's press can keep. */
function addressOf(asked: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(asked)) {
    if (typeof value === "string" && value !== "") params.set(key, value);
  }
  return params.toString();
}

/**
 * Where this page starts counting.
 *
 * A display figure carried beside the cursor so a second page numbers its rows
 * 26 to 50 — see `Leaderboard`'s `from`. Anything that is not a whole number of
 * rows starts at the top, which is the one answer that is never wrong: a
 * hand-typed `?from=abc` should show a board rather than an error about a number
 * nobody meant to type.
 */
function startsAt(raw: string | string[] | undefined): number {
  if (typeof raw !== "string") return 0;
  const from = Number(raw);
  return Number.isInteger(from) && from >= 0 ? from : 0;
}

/**
 * THE XP LEADERBOARD.
 *
 * Ranked by `Member.xp` descending, which is also ranked by level — the curve is
 * monotonic, so the two are one ordering and nothing is stored to make the Level
 * heading sortable. Programs are excluded in the query, not only in the awarder.
 * `xpBoard.ts` holds the read and `xpBoard.sort.ts` the four columns a reader may
 * press, each with the index that answers it.
 *
 * **The page after the first is a plain link and there is no API behind it.**
 * The board is twenty-five rows on a site with four people on it, so a live
 * scroller and a route to feed it would be machinery for a second page nobody
 * will reach this year — and a link is the honest version of it: it works with no
 * JavaScript, it can be bookmarked, and it keeps the reader's sort. `/api/ladder`
 * exists because `/players` appends pages as a reader scrolls; nothing here does.
 */
export default async function XpPage({ searchParams }: PageProps<"/xp">) {
  const asked = await searchParams;
  const query = addressOf(asked);
  const params = new URLSearchParams(query);
  const from = startsAt(asked.from);

  const wanted = readXpBoardPaging(params);
  /*
   * A refused sort gets the board's own order and a line saying so, which is the
   * choice `/players` makes one page over. A 400 in the middle of a page would be
   * an error a reader who followed a stale link cannot act on — while a CALLER
   * who wrote the address by hand is still told which word was wrong, because
   * `readXpBoardPaging` names it.
   */
  const refused = isRefusal(wanted);
  const paging = refused
    ? (readXpBoardPaging(new URLSearchParams()) as Exclude<typeof wanted, { error: string }>)
    : wanted;

  const [board, viewer] = await Promise.all([fetchXpBoardPage(paging), viewerXp()]);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            <Paired
              en="Experience"
              kanji="経験値"
              kanjiClassName="text-sm font-normal opacity-70"
            />
          </h1>
          <Link href="/xp/levels" className="text-sm underline underline-offset-4" data-testid="to-ladder">
            All {countText(XP_LEVELS)} levels <span className="font-mincho">段位</span>
          </Link>
        </div>

        <p className="max-w-3xl text-sm text-muted">
          Experience is not the rating. A rating says how well you play; experience says you
          turned up and tried things — a game finished, a game won, a game you had never played
          before, a buddy added, a weekend. Every level has a name, from{" "}
          <Link href={levelPath(1)} className="underline underline-offset-4">
            {xpLevelName(1)}
          </Link>{" "}
          up to{" "}
          <Link href={levelPath(XP_LEVELS)} className="underline underline-offset-4">
            {xpLevelName(XP_LEVELS)}
          </Link>
          . Press a heading to sort by it. Nobody&rsquo;s experience was backfilled, so this
          ladder started the day it was built.
        </p>

        {refused ? (
          <p className="text-sm text-muted" data-testid="xp-sort-refused">
            That was not an order the leaderboard has, so this is the board by XP.
          </p>
        ) : null}

        <YourStanding viewer={viewer} board={board} />

        <Leaderboard
          rows={board.items}
          current={paging.sort as SortChoice<string>}
          at="/xp"
          query={query}
          from={from}
          viewerId={viewer?.memberId ?? null}
          viewerZone={viewer?.timeZone ?? ""}
          empty={
            viewer === null ? (
              /*
               * A reader with no account. Worded as an invitation and not as the
               * signed-in label: somebody who follows this should feel they were
               * told what the site wants from them.
               */
              <>
                Nobody has earned any experience here yet.{" "}
                <Link href="/join" className="underline underline-offset-4" data-testid="xp-join-link">
                  Join Itsutsu
                </Link>{" "}
                and be the first onto the ladder.
              </>
            ) : (
              <>
                Nobody has earned any experience here yet.{" "}
                <Link href="/games/new" className="underline underline-offset-4" data-testid="xp-play-link">
                  Play a game
                </Link>{" "}
                and be the first onto the ladder — finishing one earns experience whether you
                win it or not.
              </>
            )
          }
        />

        <BoardFoot board={board} query={query} from={from} />
      </section>
    </Page>
  );
}

/**
 * Where the reader stands, above the board.
 *
 * "Show The Data, Not The Way To It": the fact a member came for is their own
 * place, so it is on the page. Their row is marked in the table as well, and
 * when it is on this page that marking is the whole answer — so the RANK, which
 * costs a `count`, is only asked for when they are not among the rows on screen.
 * See `xpRankOf`.
 */
async function YourStanding({ viewer, board }: { viewer: ViewerXp | null; board: XpBoardPage }) {
  if (viewer === null) return null;

  const level = viewer.standing.level;
  const shown = board.items.some((row) => row.id === viewer.memberId);

  if (viewer.xp <= 0) {
    return (
      <p className="text-sm" data-testid="your-xp">
        You are on{" "}
        <Link href={levelPath(level)} className="underline underline-offset-4">
          level {level}, {xpLevelName(level)}
        </Link>{" "}
        with no experience yet, so you are not on the board.{" "}
        <Link href="/games/new" className="underline underline-offset-4">
          Finish a game
        </Link>{" "}
        and you will be.
      </p>
    );
  }

  const rank = shown ? null : await xpRankOf(viewer.xp);

  return (
    <p className="text-sm" data-testid="your-xp" data-rank={rank ?? undefined}>
      You have {countText(viewer.xp)} XP and stand at <LevelName level={level} linkable={false} />
      {", "}
      <Link href={levelPath(level)} className="underline underline-offset-4">
        {xpLevelName(level)}
      </Link>
      {rank === null ? (
        <span className="text-muted"> — your row is marked below.</span>
      ) : (
        /* Ties share a number: two members on one total are level with each
           other, and separating them by `id` would be an order nobody can see. */
        <span className="text-muted">
          {" "}
          — {countText(rank)} of {countText(board.total)} on the board.
        </span>
      )}
    </p>
  );
}

/**
 * What is on screen, and the way to the rest of it.
 *
 * FORWARD AND BACK, because a one-directional control is a whole class of fault
 * — "I cannot get out of it" is only ever found by the return trip. Both links
 * carry the sort, so a reader who has chosen an order keeps it; a "show more"
 * that dropped it would hand them the next page of a different board.
 */
function BoardFoot({
  board,
  query,
  from,
}: {
  board: XpBoardPage;
  query: string;
  from: number;
}) {
  const shownTo = from + board.items.length;

  const link = (cursor: string | null, at: number) => {
    const params = new URLSearchParams(query);
    if (cursor === null) {
      params.delete("cursor");
      params.delete("from");
    } else {
      params.set("cursor", cursor);
      params.set("from", String(at));
    }
    const rest = params.toString();
    return rest === "" ? "/xp" : `/xp?${rest}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted" data-testid="xp-board-count">
        {board.total === 0
          ? "Nobody on the board yet."
          : `${countText(shownTo - Math.min(from, shownTo))} of ${countText(board.total)} on the board.`}
      </p>
      {board.next === null ? null : (
        <Link
          href={link(board.next, shownTo)}
          className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
          data-testid="xp-board-next"
        >
          Show the next {countText(Math.min(board.items.length, board.total - shownTo))}
        </Link>
      )}
      {from === 0 ? null : (
        <Link href={link(null, 0)} className="text-sm underline underline-offset-4" data-testid="xp-board-top">
          Back to the top of the board
        </Link>
      )}
    </div>
  );
}
