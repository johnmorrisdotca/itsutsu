import { SITE_NAME } from "@/lib/i18n/siteName";
import Link from "@/components/ui/Link";

import { Paired } from "@/components/i18n/Paired";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { ImportedXpNote } from "@/components/xp/ImportedXpNote";
import { Leaderboard } from "@/components/xp/Leaderboard";
import { XpBoardFoot } from "@/components/xp/XpBoardFoot";
import { XpScopeSaid } from "@/components/xp/XpScopeSaid";
import { YourXpStanding } from "@/components/xp/YourXpStanding";
import type { SortChoice } from "@/lib/api/paging.types";
import { isRefusal } from "@/lib/api/paging";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";
import { currentTestModeReader } from "@/lib/testMode/testMode";
import { countText } from "@/lib/rating/figures";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS } from "@/lib/xp/xpCurve";
import { WhoFilter } from "@/components/players/WhoFilter";
import { RecordScopeBar } from "@/components/players/RecordScopeBar";
import { DIRECTORY_WHO } from "@/lib/rating/directoryFilter";
import { RECORD_SCOPES } from "@/lib/rating/recordScope";
import { importedFactsFor } from "@/lib/xp/importedRecipients";
import { importedNoteText } from "@/lib/xp/importedNote";
import { fetchXpBoardPage, readXpBoardPaging } from "@/lib/xp/xpBoard";
import { fetchXpAboveTotal, fetchXpBoardGains } from "@/lib/xp/xpBoardGains";
import { viewerXp } from "@/lib/xp/xpViewer";
import { XP_WHO_SAID, xpWhoHref } from "@/lib/xp/xpWho";
import { xpWhoFor } from "@/lib/xp/xpWhoServer";
import { xpScopeHref } from "@/lib/xp/xpScope";
import { xpScopeFor } from "@/lib/xp/xpScopeServer";
import { ipTotalsOf } from "@/lib/points/ipBoards";

export async function generateMetadata() {
  const say = await currentSpeaker();
  return { title: say.say("xp.board.metaTitle"), description: say.say("xp.board.metaDescription", { site: SITE_NAME }) };
}

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
  const reader = await currentTestModeReader();
  const [board, viewer] = await Promise.all([fetchXpBoardPage({ ...paging, who, scope, reader }), viewerXp()]);
  /*
   * WHAT EACH ROW GAINED, AND HOW FAR IT TRAILS THE ONE ABOVE. John: "XP tables
   * aren't useful if they don't tell us how much you went up each day... and how
   * far you are behind the next person." One ledger read for the whole page, and
   * past page one one primary-key read for the row above — see `xpBoardGains.ts`.
   * Over the rows the narrowing already chose. Behind next follows the scope; a
   * gain never includes imported credit under either scope — see `xpGains.ts`.
   */
  const [gains, above, ip] = await Promise.all([
    fetchXpBoardGains({ rows: board.items }),
    fetchXpAboveTotal({ cursor: paging.cursor, sort: paging.sort, scope }),
    // Each row's IP beside its XP: one query over the rows on screen, never a read per row.
    ipTotalsOf(board.items.map((row) => row.id), reader),
  ]);

  /* The justification under every total that includes another site's credit. */
  const notes = new Map(
    board.items.flatMap((row) => {
      const facts = importedFactsFor(row.name, row.imported);
      return facts === null ? [] : [[row.id, <ImportedXpNote key={row.id} note={importedNoteText(say, facts)} />] as const];
    }),
  );

  return (
    <Page>
      <SiteHeader />

      <PageTitle
        title={say.say("xp.title")}
        kanji="経験値"
        aside={
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Link href="/xp/promotions" className="text-sm underline underline-offset-4" data-testid="to-promotions">
              <Paired en={say.say("xp.promotions.title")} kanji="昇級" />
            </Link>
            <Link href="/xp/levels" className="text-sm underline underline-offset-4" data-testid="to-ladder">
              <Paired en={say.say("xp.levels.titleCount", { count: countText(XP_LEVELS) })} kanji="段位" />
            </Link>
          </div>
        }
      />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <p className="text-sm text-muted">
          {weave(say.say("xp.board.intro"), {
            first: (
              <Link href={levelPath(1)} className="underline underline-offset-4">
                {xpLevelName(1, say.locale)}
              </Link>
            ),
            last: (
              <Link href={levelPath(XP_LEVELS)} className="underline underline-offset-4">
                {xpLevelName(XP_LEVELS, say.locale)}
              </Link>
            ),
          })}
        </p>

        {refused ? (
          <p className="text-sm text-muted" data-testid="xp-sort-refused">
            {say.say("xp.board.sortRefused")}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <WhoFilter who={who} hrefFor={(next) => xpWhoHref("/xp", query, next)} label={say.say("xp.board.whoLabel")} />
          <RecordScopeBar
            base="/xp"
            scope={scope}
            hrefFor={(next) => xpScopeHref("/xp", query, next)}
            label={say.say("xp.board.scopeLabel")}
          />
          {narrowed ? (
            /* "Every page a link lands on says what it was narrowed to, and lets it be taken off." */
            <p className="text-xs text-muted" data-testid="xp-narrowed">
              {say.say("xp.board.narrowed", { who: say.say(XP_WHO_SAID[who]), count: countText(board.total) })}{" "}
              <Link href={xpWhoHref("/xp", query, DIRECTORY_WHO.everyone)} className="underline underline-offset-4">
                {say.say("xp.showEveryone")}
              </Link>
            </p>
          ) : null}
        </div>
        <XpScopeSaid scope={scope} say={say} href={xpScopeHref("/xp", query, RECORD_SCOPES.everywhere)} />

        <YourXpStanding viewer={viewer} board={board} who={who} scope={scope} reader={reader} />

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
          rankAmong={narrowed ? say.say(XP_WHO_SAID[who]) : undefined}
          say={say}
          gains={gains}
          ip={ip}
          above={above}
          empty={
            narrowed ? (
              /* An empty narrowed table keeps its shape and says whose it is: the computer
                 players before any of them has earned, say. */
              <>
                {say.say("xp.board.emptyNarrowed", { who: say.say(XP_WHO_SAID[who]) })}{" "}
                <Link href={xpWhoHref("/xp", query, DIRECTORY_WHO.everyone)} className="underline underline-offset-4" data-testid="xp-show-everyone">
                  {say.say("xp.showEveryone")}
                </Link>
              </>
            ) : viewer === null ? (
              /*
               * A reader with no account. Worded as an invitation and not as the
               * signed-in label: somebody who follows this should feel they were
               * told what the site wants from them.
               */
              <>
                {weave(say.say("xp.board.emptyGuest"), {
                  join: (
                    <Link href="/join" className="underline underline-offset-4" data-testid="xp-join-link">
                      {say.say("xp.joinSite", { site: SITE_NAME })}
                    </Link>
                  ),
                })}
              </>
            ) : (
              <>
                {weave(say.say("xp.board.emptyMember"), {
                  play: (
                    <Link href="/games/new" className="underline underline-offset-4" data-testid="xp-play-link">
                      {say.say("xp.playAGame")}
                    </Link>
                  ),
                })}
              </>
            )
          }
        />

        <XpBoardFoot board={board} query={query} from={from} say={say} />
      </section>
    </Page>
  );
}
