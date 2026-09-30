import { HISTORY_PAGE, historyOf, historyTotal } from "@/lib/history/everyGame";
import { viewHref } from "@/lib/history/myGamesViews";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";

import { MyHistory } from "./MyHistory";

/**
 * THE HISTORY TAB'S READ: a page of the member's every game (`historyOf`), the
 * count of all of it, and the flag and badge beside every name on the page —
 * read only on this tab, so the other tabs pay nothing for it. `before` is
 * where the last page ended (`?before=`), an ISO time; a stale or unreadable
 * one starts from the newest.
 */
export async function MyHistorySection({ memberId, before }: { memberId: string; before: string | null }) {
  const [page, total] = await Promise.all([historyOf(memberId, before, memberId, HISTORY_PAGE), historyTotal(memberId)]);
  const tags = await nameTagsOf(page.entries.flatMap((entry) => entry.others.map((other) => other.memberId)));
  const base = viewHref("history");
  return (
    <MyHistory
      page={page}
      total={total}
      now={new Date()}
      tags={tags}
      older={page.next === null ? null : `${base}?before=${encodeURIComponent(page.next)}`}
      newest={before === null ? null : base}
    />
  );
}
