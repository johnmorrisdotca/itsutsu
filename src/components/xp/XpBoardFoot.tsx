import Link from "@/components/ui/Link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import type { Speaker } from "@/lib/i18n/i18n";
import { countText } from "@/lib/rating/figures";
import type { XpBoardPage } from "@/lib/xp/xpBoard";

/**
 * What is on screen of the XP leaderboard, and the way to the rest of it.
 *
 * FORWARD AND BACK, because a one-directional control is a whole class of fault
 * — "I cannot get out of it" is only ever found by the return trip. Both links
 * carry the sort, so a reader who has chosen an order keeps it; a "show more"
 * that dropped it would hand them the next page of a different board.
 */
export function XpBoardFoot({
  board,
  query,
  from,
  say,
}: {
  board: XpBoardPage;
  query: string;
  from: number;
  /** The reader's language. */
  say: Speaker;
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
          ? say.say("xp.board.nobody")
          : say.say("xp.board.count", {
              shown: countText(shownTo - Math.min(from, shownTo), say.locale),
              total: countText(board.total, say.locale),
            })}
      </p>
      {board.next === null ? null : (
        <Link
          href={link(board.next, shownTo)}
          className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
          data-testid="xp-board-next"
        >
          {say.say("xp.board.next", { count: countText(Math.min(board.items.length, board.total - shownTo), say.locale) })}
        </Link>
      )}
      {from === 0 ? null : (
        <Link href={link(null, 0)} className="text-sm underline underline-offset-4" data-testid="xp-board-top">
          {say.say("xp.board.top")}
        </Link>
      )}
    </div>
  );
}
