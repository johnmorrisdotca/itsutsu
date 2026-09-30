import { MyHistory } from "@/components/mine/MyHistory";
import { gamePath } from "@/lib/gomoku/slugs";
import type { HistoryEntry } from "@/lib/history/everyGame.types";
import { historyOf, historyTotal } from "@/lib/history/everyGame";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";

/** How many games of somebody's history their page shows at a time. */
export const PLAYER_HISTORY_PAGE = 10;

/** The query parameter the page of their history is read from: where the last page ended, an ISO time. */
export const PLAYER_HISTORY_PARAM = "before";

/**
 * A table on several devices opens only for the members seated at it, so a
 * reader who was not leads to the game instead — the one row of somebody
 * else's history a reader cannot open is sent where there is a page to land on.
 */
function openableBy(entry: HistoryEntry, memberId: string, readerId: string | null): HistoryEntry {
  if (entry.source !== "table" || readerId === memberId) return entry;
  if (readerId !== null && entry.others.some((other) => other.memberId === readerId)) return entry;
  return { ...entry, href: gamePath(entry.game) };
}

/**
 * EVERY GAME SOMEBODY HAS PLAYED, ON THEIR PAGE. John, 2026-09-30: "Be able
 * to browse the history of all your friends as well" — a buddy's page, reached
 * from the Buddies tab of Players or from their name anywhere, carries the same
 * History that My games gives a member of their own (`everyGame.ts`): every
 * kind of game, going or over, the card and party games filed from one device
 * among them, each opening to watch or look back at.
 *
 * Read from their side, so "Your move" reads "Their move"; on the reader's
 * own page it is the reader's history, in their words. Behind the invite like
 * the rest of a player's page (`src/proxy.ts`), and never what a member hid:
 * `historyOf` leaves out a game its player took off their list.
 */
export async function PlayerHistory({ memberId, readerId, base, before }: { memberId: string; readerId: string | null; base: string; before: string | null }) {
  const [page, total] = await Promise.all([historyOf(memberId, before, readerId, PLAYER_HISTORY_PAGE), historyTotal(memberId)]);
  const tags = await nameTagsOf(page.entries.flatMap((entry) => entry.others.map((other) => other.memberId)));
  const entries = page.entries.map((entry) => openableBy(entry, memberId, readerId));
  return (
    <div id="history" data-testid="player-history">
      <MyHistory
        page={{ ...page, entries }}
        total={total}
        now={new Date()}
        tags={tags}
        older={page.next === null ? null : `${base}?${PLAYER_HISTORY_PARAM}=${encodeURIComponent(page.next)}#history`}
        newest={before === null ? null : `${base}#history`}
        theirs={readerId !== memberId}
      />
    </div>
  );
}
