import Link from "next/link";
import { notFound } from "next/navigation";

import { BacklogBoard } from "@/components/backlog/BacklogBoard";
import { BoardUnreadable } from "@/components/backlog/BoardUnreadable";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { BOARD_SCOPES } from "@/lib/backlog/backlog.constants";
import { readBoard } from "@/lib/backlog/backlogStore";
import { countFor, scopeOf, statusFromAddress } from "@/lib/backlog/boardScope";

export const metadata = { title: "Backlog", robots: { index: false, follow: false } };

// The board is read from Sumilabu on every request, never at build time.
export const dynamic = "force-dynamic";

/**
 * Everything anyone has asked for, in one place — the operator's copy.
 *
 * Before this page a request was a message in a conversation: raised, agreed
 * to, and then gone with the scrollback, so the answer to "what did I ask
 * for" depended on who had kept the thread. A row here outlives the
 * conversation that made it.
 *
 * It used to be open to every member, on the argument that a board only one
 * person can write to is a list rather than a board. John has since decided
 * otherwise and it is his site: the board is the operator's, and it is shut
 * to everybody else — the page and the Server Functions it writes through
 * alike, because a page that is hidden while its writes still answer is worse
 * than either. Requests still arrive the way they always did, in
 * conversation; what has changed is who can see they were written down.
 *
 * The rows live on Sumilabu, and a load reads only the view's own scope —
 * the unfinished rows unless `?show=` asks for done, dropped or everything
 * (`boardScope.ts`). When they cannot be read the page says so in an alert,
 * rather than drawing an empty board that would read as nothing wanted.
 *
 * Anyone else gets a 404 rather than a refusal, the same as the Admin page,
 * so the address gives nothing away about what is behind it.
 */
export default async function BacklogPage({ searchParams }: PageProps<"/backlog">) {
  const me = await currentAdmin();
  if (me === null) notFound();

  const status = statusFromAddress((await searchParams).show);
  const board = await readBoard(scopeOf(status));
  // Said only where the rows behind them were read: a view of done rows has no count of what is still wanted.
  const wanted = board.ok ? countFor(board.items, board.scope, BOARD_SCOPES.unfinished) : null;
  const total = board.ok ? countFor(board.items, board.scope, BOARD_SCOPES.all) : null;

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="backlog">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          Backlog <span className="font-mincho text-sm font-normal opacity-70">積み残し</span>
        </h1>
        <p className="max-w-prose text-sm text-muted">
          Every feature asked for, every fault reported, and what has become of each.{" "}
          {wanted === null ? null : (
            <>
              There are <span className="font-semibold text-ink">{wanted}</span> still wanting something
              {total === null ? "" : `, out of ${total} on the board`}.{" "}
            </>
          )}
          A request written here outlives the conversation that raised it. The same board is a tab of{" "}
          <Link href="/admin?view=work" className="underline underline-offset-4">
            Admin
          </Link>
          . What has already shipped has{" "}
          <Link href="/releases" className="underline underline-offset-4">
            a page of its own
          </Link>
          , open to everybody — this one is only what has not.
        </p>
        {board.ok ? (
          // Keyed by what was read, so moving to another view starts the board afresh on it.
          <BacklogBoard key={`${board.scope}:${status}`} items={board.items} scope={board.scope} initial={status} base="/backlog" who={me.name ?? ""} />
        ) : (
          <BoardUnreadable problem={board.problem} />
        )}
      </section>
    </Page>
  );
}
