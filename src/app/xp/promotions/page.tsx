import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WhoFilter } from "@/components/players/WhoFilter";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { PromotionsTable } from "@/components/xp/PromotionsTable";
import { countText } from "@/lib/rating/figures";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";
import { PROMOTIONS_PAGE, readPromotionsCursor } from "@/lib/xp/promotions";
import { fetchPromotionsPage } from "@/lib/xp/promotionsRead";
import { XP_LEVELS } from "@/lib/xp/xpCurve";
import { viewerXp } from "@/lib/xp/xpViewer";
import { XP_WHO_PARAM, XP_WHO_SAID, xpWhoHref } from "@/lib/xp/xpWho";
import { xpWhoFor } from "@/lib/xp/xpWhoServer";

export const metadata = {
  title: "Recent promotions",
  description: "Who went up an experience level on Itsutsu lately, newest first: from which level to which, and when.",
};

/* Who the list is about is remembered on the member's account, and their own lines are marked. */
export const dynamic = "force-dynamic";

const AT = "/xp/promotions";

/** The address parameter carrying where an older page starts. */
const OLDER = "older";

/** This page for a narrowing, from the newest or from a cursor. */
function pageHref(who: DirectoryWho, older: string | null): string {
  const params = new URLSearchParams({ [XP_WHO_PARAM]: who });
  if (older !== null) params.set(OLDER, older);
  return `${AT}?${params.toString()}`;
}

/**
 * RECENT PROMOTIONS 昇級 — who went up a level lately, newest first.
 *
 * John, looking at /xp and a level's page: "BUG: Where is the recent promotions
 * page?" A level-up was a toast and nothing more, so nobody but the member ever
 * saw one. This is the ladder's news: who, from which rung to which, and when.
 *
 * Derived from the ledger in one query per page and stored nowhere — see
 * `promotions.ts` for what a promotion is and `promotionsRead.ts` for the read.
 * The People / Computers / Everyone choice is the leaderboard's own, on the same
 * memory, because the board, the rungs and this list are one ladder.
 *
 * Not open to a reader with no invite, like the rest of /xp: `proxy.ts` shuts
 * every path it does not name, and names none of these. So the names and the
 * links to members' pages here are only ever drawn for somebody signed in.
 */
export default async function PromotionsPage({ searchParams }: PageProps<"/xp/promotions">) {
  const asked = await searchParams;
  const cursor = readPromotionsCursor(asked[OLDER]);
  const who = await xpWhoFor(asked);
  const narrowed = who !== DIRECTORY_WHO.everyone;
  const [page, viewer] = await Promise.all([
    fetchPromotionsPage({ who, cursor, limit: PROMOTIONS_PAGE }),
    viewerXp(),
  ]);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            <Paired en="Recent promotions" kanji="昇級" kanjiClassName="text-sm font-normal opacity-70" />
          </h1>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Link href="/xp" className="text-sm underline underline-offset-4" data-testid="to-leaderboard">
              Who is where <span className="font-mincho">経験値</span>
            </Link>
            <Link href="/xp/levels" className="text-sm underline underline-offset-4" data-testid="to-ladder">
              All {countText(XP_LEVELS)} levels <span className="font-mincho">段位</span>
            </Link>
          </div>
        </div>

        <p className="max-w-3xl text-sm text-muted">
          Who went up a level lately, newest first. A level is read from the total, so a promotion
          is the moment an award carried somebody over a rung. An award that carried them over
          more than one is a single line, from where they stood to where they arrived. Games
          finished before the ladder was built were paid for by a backfill on 13 September 2026; a
          promotion that came from it is dated by the backfill and says which day&rsquo;s play it
          was for.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <WhoFilter who={who} hrefFor={(next) => xpWhoHref(AT, "", next)} label="Which players the list shows" />
          {narrowed ? (
            /* "Every page a link lands on says what it was narrowed to, and lets it be taken off." */
            <p className="text-xs text-muted" data-testid="promotions-narrowed">
              Narrowed to {XP_WHO_SAID[who]}.{" "}
              <Link href={pageHref(DIRECTORY_WHO.everyone, null)} className="underline underline-offset-4">
                Show everyone
              </Link>
            </p>
          ) : null}
        </div>

        <PromotionsTable
          items={page.items}
          viewerId={viewer?.memberId ?? null}
          viewerZone={viewer?.timeZone ?? ""}
          empty={
            narrowed ? (
              <>
                None of {XP_WHO_SAID[who]} has gone up a level yet.{" "}
                <Link href={pageHref(DIRECTORY_WHO.everyone, null)} className="underline underline-offset-4" data-testid="promotions-show-everyone">
                  Show everyone
                </Link>
              </>
            ) : viewer === null ? (
              /* Somebody with no member row: an invitation, not the signed-in label. */
              <>
                Nobody has gone up a level yet.{" "}
                <Link href="/join" className="underline underline-offset-4" data-testid="promotions-join-link">
                  Join Itsutsu
                </Link>{" "}
                and be the first.
              </>
            ) : (
              <>
                Nobody has gone up a level yet.{" "}
                <Link href="/games/new" className="underline underline-offset-4" data-testid="promotions-play-link">
                  Play a game
                </Link>{" "}
                and be the first — finishing one earns experience whether you win it or not.
              </>
            )
          }
        />

        {/* Forward and back: an older page, and the way to the newest from it. */}
        <div className="flex flex-wrap items-center gap-3">
          {page.next === null ? null : (
            <Link href={pageHref(who, page.next)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="promotions-older">
              Show older promotions
            </Link>
          )}
          {cursor === null ? null : (
            <Link href={pageHref(who, null)} className="text-sm underline underline-offset-4" data-testid="promotions-newest">
              Back to the newest
            </Link>
          )}
        </div>
      </section>
    </Page>
  );
}
