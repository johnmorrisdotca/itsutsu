import Link from "next/link";

import { StatusPill } from "@/components/backlog/BacklogRow";
import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { openCount, tally } from "@/lib/backlog/backlog";
import { STATUS_ORDER } from "@/lib/backlog/backlog.constants";
import { fetchBoard } from "@/lib/backlog/backlogStore";
import { latestRelease } from "@/lib/backlog/releases";
import { readReleases } from "@/lib/backlog/releasesFile";

/**
 * The operator's view of the two lists: what is wanted, and what has shipped.
 *
 * The board itself is at /backlog and everyone who is in can read it — a
 * backlog only the operator can see is the chat window again, with one reader.
 * This is the way in from the Admin page, with enough of both lists on it to
 * say whether either needs attention.
 */
export async function AdminBoardCard() {
  const [items, releases] = await Promise.all([fetchBoard(), readReleases()]);
  const counts = tally(items);
  const latest = latestRelease(releases);

  return (
    <section className="flex flex-col gap-3" data-testid="admin-board">
      <h2 className="flex items-baseline gap-2 text-base font-semibold">
        Backlog and releases <span className="font-mincho text-sm font-normal opacity-70">積み残しと更新履歴</span>
      </h2>

      <div className="flex flex-col gap-1">
        <span className={SECTION_TITLE}>
          {openCount(items)} still wanted, of {items.length}
        </span>
        <p className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((status) => (
            <span key={status} className="flex items-center gap-1 text-xs text-muted">
              <StatusPill status={status} />
              <span className="font-mono tabular-nums">{counts[status]}</span>
            </span>
          ))}
        </p>
      </div>

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
