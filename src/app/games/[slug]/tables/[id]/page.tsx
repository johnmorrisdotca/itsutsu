import { notFound, redirect } from "next/navigation";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardScaled } from "@/components/board/BoardScaled";
import { GameTrailNav } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OnlineTable } from "@/components/party/online/OnlineTable";
import { ONLINE_COPY } from "@/components/party/online/online.constants";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { appearanceFor } from "@/lib/auth/members";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import { gamePath, partyKindFor, variantFor } from "@/lib/gomoku/slugs";
import { isOnlineGame } from "@/lib/party/online/onlineGames";
import { tablePath } from "@/lib/party/online/onlinePaths";
import { readTableView } from "@/lib/party/online/server/tableRead";
import { SEATING_REFUSALS, type SeatingRefusal } from "@/lib/party/online/server/tableSeating";
import { liveBoardIntervals } from "@/lib/site/liveBoardIntervals";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";

export const metadata = {
  title: "At a table",
  // A table can be reached from a seat link; neither should be indexed.
  robots: { index: false, follow: false },
};

/** Why a seat link sent the reader here rather than seating them, from `?seat=`. */
function seatNotice(said: string | string[] | undefined, reason: string | string[] | undefined): string | null {
  if (said === "full") return ONLINE_COPY.full;
  if (said === "over") return ONLINE_COPY.over;
  if (said === "refused") return typeof reason === "string" && Object.hasOwn(SEATING_REFUSALS, reason) ? `${ONLINE_COPY.refused} ${SEATING_REFUSALS[reason as SeatingRefusal]}` : ONLINE_COPY.refused;
  return null;
}

/**
 * A PARTY TABLE PLAYED ON SEVERAL DEVICES, at /games/<slug>/tables/<id>, for
 * the members seated at it and nobody else: a reader who is not is told there
 * is no such table. Read once here — the table, who is here, and the reader's
 * board and poll settings — and handed to the page, which starts from it.
 * See docs/plans/party-online/README.md.
 */
export default async function TablePage({ params, searchParams }: PageProps<"/games/[slug]/tables/[id]">) {
  const { slug, id } = await params;
  const asked = await searchParams;
  const key = partyKindFor(slug) ?? variantFor(slug);
  if (key === null || !isOnlineGame(key)) notFound();
  const readerId = await currentMemberId();
  const notice = seatNotice(asked.seat, asked.reason);
  if (readerId === null) notFound();
  const [view, appearance, intervals] = await Promise.all([readTableView(id, readerId), appearanceFor(readerId), liveBoardIntervals()]);
  if (view === null) {
    if (notice === null) notFound();
    // A link that could not seat the reader lands here to say why, even at a table they cannot read.
    return (
      <Page board>
        <SiteHeader />
        <PageTitle title={ONLINE_COPY.title} kanji={ONLINE_COPY.kanji} />
        <p className={`${PANEL_CLASS} text-sm`} data-testid="online-seat-notice">
          {notice}
        </p>
      </Page>
    );
  }
  // An address naming another game's slug is sent to the table's own.
  if (view.game !== key) redirect(tablePath(view.game, id));
  const copy = gameCopyFor(view.game);
  // The flag and badge beside each name at the table, one read (`nameTagsOf`).
  const tags = Object.fromEntries(await nameTagsOf(view.seats.map((seat) => seat.memberId)));

  return (
    // A board page whose play draws "Just the board" beside its size (`BoardScale`).
    <Page board="play">
      <SiteHeader />
      <GameTrailNav game={{ label: copy.label, href: gamePath(view.game) }} steps={[{ label: ONLINE_COPY.title }]} />
      {/* Furniture, for just the board. */}
      <div data-chrome>
        <PageTitle title={`${copy.label}, ${ONLINE_COPY.title.toLowerCase()}`} kanji={ONLINE_COPY.kanji} lead={ONLINE_COPY.lead} />
      </div>
      {notice !== null ? (
        <p className={`${PANEL_CLASS} text-sm`} data-testid="online-seat-notice">
          {notice}
        </p>
      ) : null}
      {/* The table at the size this reader keeps for this kind of screen (`BoardScaled`). */}
      <BoardScaled>
        <OnlineTable
          initial={view}
          appearance={appearance ?? DEFAULT_APPEARANCE}
          intervals={intervals}
          gameHref={gamePath(view.game)}
          gameLabel={copy.label}
          tags={tags}
        />
      </BoardScaled>
    </Page>
  );
}
