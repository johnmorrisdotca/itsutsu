import Link from "next/link";

import { StatusPill } from "@/components/backlog/BacklogRow";
import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { BOARD_SCOPES, STATUS_DISPLAY, STATUS_ORDER } from "@/lib/backlog/backlog.constants";
import { countFor } from "@/lib/backlog/boardScope";
import { latestRelease } from "@/lib/backlog/releases";
import { readReleases } from "@/lib/backlog/releasesFile";

import { BoardUnreadable } from "./BoardUnreadable";
import type { AdminBoardCardProps } from "./backlogBoard.types";

/**
 * The operator's view of the two lists: what is wanted, and what has shipped.
 *
 * The board itself is at /backlog; this is the way in from the Admin page, with
 * enough of both lists on it to say whether either needs attention. The board is
 * handed in rather than read here, so the card and the board drawn below it on
 * the same tab are one call to Sumilabu, and a board that could not be read is
 * said to be unreadable rather than counted as empty.
 *
 * It counts only what that call read. The tab reads the unfinished rows unless
 * its board is showing done, dropped or everything, so the pills beside each
 * status appear only for statuses whose rows are in hand, and "of all of them"
 * only once all of them were read.
 */
export async function AdminBoardCard({ board }: AdminBoardCardProps) {
  const releases = await readReleases();
  const latest = latestRelease(releases);

  return (
    <section className="flex flex-col gap-3" data-testid="admin-board">
      <h2 className="flex items-baseline gap-2 text-base font-semibold">
        Backlog and releases <span className="font-mincho text-sm font-normal opacity-70">積み残しと更新履歴</span>
      </h2>

      {board.ok ? (
        <div className="flex flex-col gap-1">
          <span className={SECTION_TITLE}>{heading(board.items, board.scope)}</span>
          <p className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((status) => {
              const count = countFor(board.items, board.scope, status);
              return count === null ? null : (
                <span key={status} className="flex items-center gap-1 text-xs text-muted">
                  <StatusPill status={status} />
                  <span className="font-mono tabular-nums">{count}</span>
                </span>
              );
            })}
          </p>
        </div>
      ) : (
        <BoardUnreadable problem={board.problem} />
      )}

      <div className="flex flex-col gap-1">
        <span className={SECTION_TITLE}>{releases.length} releases</span>
        {latest === null ? (
          <p className="text-sm text-muted">The release history could not be read.</p>
        ) : (
          <p className="max-w-prose text-sm text-muted" data-testid="admin-latest-release">
            <span className="font-mono font-semibold text-ink">{latest.version}</span> — {latest.notes[0]}
          </p>
        )}
      </div>

      <p className="text-sm">
        <Link href="/backlog" className="underline underline-offset-4" data-testid="admin-backlog-link">
          Open the board and the full history
        </Link>
      </p>
    </section>
  );
}

/** What the card can truthfully say about the rows it was handed. */
function heading(items: Parameters<typeof countFor>[0], scope: Parameters<typeof countFor>[1]): string {
  const wanted = countFor(items, scope, BOARD_SCOPES.unfinished);
  if (wanted === null) {
    const label = scope === BOARD_SCOPES.done ? STATUS_DISPLAY.done.label : STATUS_DISPLAY.dropped.label;
    return `${items.length} ${label.toLowerCase()}`;
  }
  const total = countFor(items, scope, BOARD_SCOPES.all);
  return total === null ? `${wanted} still wanted` : `${wanted} still wanted, of ${total}`;
}
