import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { ImportedXpNote } from "@/components/xp/ImportedXpNote";
import { Leaderboard } from "@/components/xp/Leaderboard";
import { LevelName } from "@/components/xp/LevelName";
import type { SortChoice } from "@/lib/api/paging.types";
import { isRefusal } from "@/lib/api/paging";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { countText } from "@/lib/rating/figures";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS, xpLevelFor } from "@/lib/xp/xpCurve";
import { WhoFilter } from "@/components/players/WhoFilter";
import { RecordScopeBar } from "@/components/players/RecordScopeBar";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";
import { RECORD_SCOPES, type RecordScope } from "@/lib/rating/recordScope";
import { importedFactsFor } from "@/lib/xp/importedRecipients";
import { importedNoteText } from "@/lib/xp/importedNote";
import { fetchXpBoardPage, readXpBoardPaging, xpRankOf, type XpBoardPage } from "@/lib/xp/xpBoard";
import { fetchXpAboveTotal, fetchXpBoardGains } from "@/lib/xp/xpBoardGains";
import { viewerXp, type ViewerXp } from "@/lib/xp/xpViewer";
import { XP_WHO_SAID, xpWhoHref } from "@/lib/xp/xpWho";
import { xpWhoFor } from "@/lib/xp/xpWhoServer";
import { xpScopeHref, xpTotalIn } from "@/lib/xp/xpScope";
import { xpScopeFor } from "@/lib/xp/xpScopeServer";

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
 * Ranked by the total the reader has chosen — Everywhere (`Member.xpEverywhere`)
 * or Itsutsu only (`Member.xp`) — which is also ranked by level, since the curve
 * is monotonic. `xpBoard.ts` holds the read and `xpBoard.sort.ts` the four columns
 * a reader may press, each with the index that answers it.
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

  /*
   * HOW MUCH THE BOARD COUNTS, and WHO IT IS ABOUT. John, on the first: "we will
   * show filters, that show worldwide XP with a justification that they have put
   * in their time or mileage on other sites) and the Itsutsu only XP as well".
   * On the second: "filters are the way to go". Both in the query, both
   * remembered on the board's own keys, and both applied in the query itself,
   * so the page, the total and every rank below are about the narrowed set.
   */
  const [who, scope, say] = await Promise.all([xpWhoFor(asked), xpScopeFor(asked), currentSpeaker()]);

  const wanted = readXpBoardPaging(params, scope);
  /*
   * A refused sort gets the board's own order and a line saying so, which is the
   * choice `/players` makes one page over. A 400 in the middle of a page would be
   * an error a reader who followed a stale link cannot act on — while a CALLER
   * who wrote the address by hand is still told which word was wrong, because
   * `readXpBoardPaging` names it.
   */
  const refused = isRefusal(wanted);
  const paging = refused
    ? (readXpBoardPaging(new URLSearchParams(), scope) as Exclude<typeof wanted, { error: string }>)
    : wanted;

  const narrowed = who !== DIRECTORY_WHO.everyone;
  const [board, viewer] = await Promise.all([fetchXpBoardPage({ ...paging, who, scope }), viewerXp()]);
  /*
   * WHAT EACH ROW GAINED, AND HOW FAR IT TRAILS THE ONE ABOVE. John: "XP tables
   * aren't useful if they don't tell us how much you went up each day... and how
   * far you are behind the next person." One ledger read for the whole page, and
   * past page one one primary-key read for the row above — see `xpBoardGains.ts`.
   * Over the rows the narrowing already chose. Behind next follows the scope; a
   * gain never includes imported credit under either scope — see `xpGains.ts`.
   */
  const [gains, above] = await Promise.all([
    fetchXpBoardGains({ rows: board.items }),
    fetchXpAboveTotal({ cursor: paging.cursor, sort: paging.sort, scope }),
  ]);

  /* The justification under every total that includes another site's credit. */
  const notes = new Map(
    board.items.flatMap((row) => {
      const facts = importedFactsFor(row.name, row.imported);
      return facts === null ? [] : [[row.id, <ImportedXpNote key={row.id} note={importedNoteText(say, facts)} />] as const];
    }),
  );

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
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Link href="/xp/promotions" className="text-sm underline underline-offset-4" data-testid="to-promotions">
              Recent promotions <span className="font-mincho">昇級</span>
            </Link>
            <Link href="/xp/levels" className="text-sm underline underline-offset-4" data-testid="to-ladder">
              All {countText(XP_LEVELS)} levels <span className="font-mincho">段位</span>
            </Link>
          </div>
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
          . Press a heading to sort by it. Today and 7 days are what each member earned here on their
          own days — credit from other sites counts in the total, never as a gain; Behind next is how
          far a row trails the one above it. The games finished here before the ladder existed were
          paid for when it was built, so it reaches back to the first game on the site — and a
          record kept from another site is credited too, which Everywhere counts and Itsutsu only
          leaves out.
        </p>

        {refused ? (
          <p className="text-sm text-muted" data-testid="xp-sort-refused">
            That was not an order the leaderboard has, so this is the board by XP.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <WhoFilter who={who} hrefFor={(next) => xpWhoHref("/xp", query, next)} label="Which players the board lists" />
          <RecordScopeBar
            base="/xp"
            scope={scope}
            hrefFor={(next) => xpScopeHref("/xp", query, next)}
            label="How much experience the board counts"
          />
          {narrowed ? (
            /* "Every page a link lands on says what it was narrowed to, and lets it be taken off." */
            <p className="text-xs text-muted" data-testid="xp-narrowed">
              Narrowed to {XP_WHO_SAID[who]}: {countText(board.total)} on the board.{" "}
              <Link href={xpWhoHref("/xp", query, DIRECTORY_WHO.everyone)} className="underline underline-offset-4">
                Show everyone
              </Link>
            </p>
          ) : null}
        </div>
        <ScopeSaid scope={scope} say={say} href={xpScopeHref("/xp", query, RECORD_SCOPES.everywhere)} />

        <YourStanding viewer={viewer} board={board} who={who} scope={scope} />

        <Leaderboard
          rows={board.items}
          scope={scope}
          notes={notes}
          current={paging.sort as SortChoice<string>}
          at="/xp"
          query={query}
          from={from}
          viewerId={viewer?.memberId ?? null}
          viewerZone={viewer?.timeZone ?? ""}
          rankAmong={narrowed ? XP_WHO_SAID[who] : undefined}
          gains={gains}
          above={above}
          empty={
            narrowed ? (
              /* An empty narrowed table keeps its shape and says whose it is: the computer
                 players before any of them has earned, say. */
              <>
                None of {XP_WHO_SAID[who]} has earned any experience here yet.{" "}
                <Link href={xpWhoHref("/xp", query, DIRECTORY_WHO.everyone)} className="underline underline-offset-4" data-testid="xp-show-everyone">
                  Show everyone
                </Link>
              </>
            ) : viewer === null ? (
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
 * What the board is counting, said in words under the chips — and under Itsutsu
 * only, the way back to Everywhere, since "every page a link lands on says what
 * it was narrowed to, and lets it be taken off."
 */
function ScopeSaid({ scope, say, href }: { scope: RecordScope; say: Awaited<ReturnType<typeof currentSpeaker>>; href: string }) {
  if (scope === RECORD_SCOPES.here) {
    return (
      <p className="text-xs text-muted" data-testid="xp-scope-said" data-scope={scope}>
        {say.say("xp.scope.here")}{" "}
        <Link href={href} className="underline underline-offset-4" data-testid="xp-count-everywhere">
          {say.say("xp.scope.countEverywhere")}
        </Link>
      </p>
    );
  }
  return (
    <p className="text-xs text-muted" data-testid="xp-scope-said" data-scope={scope}>
      {say.say("xp.scope.everywhere")}
    </p>
  );
}

/**
 * Where the reader stands, above the board.
 *
 * "Show The Data, Not The Way To It": the fact a member came for is their own
 * place, so it is on the page. Their row is marked in the table as well, and
 * when it is on this page that marking is the whole answer — so the RANK, which
 * costs a `count`, is only asked for when they are not among the rows on screen.
 * See `xpRankOf`. Their total is the one the board is counting.
 */
async function YourStanding({
  viewer,
  board,
  who,
  scope,
}: {
  viewer: ViewerXp | null;
  board: XpBoardPage;
  who: DirectoryWho;
  scope: RecordScope;
}) {
  if (viewer === null) return null;

  /* A reader is a person, and a board narrowed to the computer players is not
     one they can be on: said, rather than a rank counted among programs. */
  if (who === DIRECTORY_WHO.computers) {
    return (
      <p className="text-sm" data-testid="your-xp">
        This board is narrowed to the computer players, so you are not among them.
      </p>
    );
  }

  const total = xpTotalIn(viewer, scope);
  const level = xpLevelFor(total);
  const shown = board.items.some((row) => row.id === viewer.memberId);

  if (total <= 0) {
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

  const rank = shown ? null : await xpRankOf(total, who, scope);

  return (
    <p className="text-sm" data-testid="your-xp" data-rank={rank ?? undefined}>
      You have {countText(total)} XP and stand at <LevelName level={level} linkable={false} />
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
          — {countText(rank)} of {countText(board.total)} {who === DIRECTORY_WHO.people ? "among the people" : "on the board"}.
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
