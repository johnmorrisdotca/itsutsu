import { redirect } from "next/navigation";

import { RecordPage } from "@/components/history/RecordPage";
import { recordGameRedirect } from "@/lib/history/recordAddress";

export const metadata = {
  title: "Record 棋譜",
  description: "Every game played, with the stones in the order they were laid.",
};

/** The whole record. */
export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const asked = await searchParams;
  /*
   * A `?variant=` NAMES A COLLECTION, SO IT IS AN ADDRESS RATHER THAN A FILTER.
   *
   * This page used to strip it and say nothing, while `/api/games?variant=`
   * honoured it — so the same word meant "one game's record" at one door and
   * nothing at all at the other, and a reader who followed a hand-written link
   * got the whole record with no sign their filter had been dropped.
   *
   * Redirected rather than honoured, because one set of games has one address
   * here: a game's record is `/games/<slug>/history`, and the filter bar's own
   * Rules select already goes there. `recordGameRedirect` carries the other
   * filters across and leaves `page` behind. A `?variant=` that names no game
   * falls through instead, and the query refuses it in words on the page.
   */
  const canonical = recordGameRedirect(asked);
  if (canonical !== null) redirect(canonical);
  return <RecordPage params={asked} />;
}
