import Link from "next/link";
import { notFound } from "next/navigation";

import { BacklogBoard } from "@/components/backlog/BacklogBoard";
import { Releases } from "@/components/backlog/Releases";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { openCount } from "@/lib/backlog/backlog";
import { fetchBoard } from "@/lib/backlog/backlogStore";
import { readReleases } from "@/lib/backlog/releasesFile";
import { VERSION } from "@/lib/version";

export const metadata = { title: "Backlog", robots: { index: false, follow: false } };

// The board is read from the database on every request, never at build time.
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
 * to everybody else — the API as well as the page, because a page that is
 * hidden while its API still answers is worse than either. Requests still
 * arrive the way they always did, in conversation; what has changed is who
 * can see they were written down.
 *
 * Anyone else gets a 404 rather than a refusal, the same as the Admin page,
 * so the address gives nothing away about what is behind it.
 */
export default async function BacklogPage() {
  const me = await currentAdmin();
  if (me === null) notFound();

  const [items, releases] = await Promise.all([fetchBoard(), readReleases()]);
  const open = openCount(items);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="backlog">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          Backlog <span className="font-mincho text-sm font-normal opacity-70">積み残し</span>
        </h1>
        <p className="max-w-prose text-sm text-muted">
          Every feature asked for, every fault reported, and what has become of each. There are{" "}
          <span className="font-semibold text-ink">{open}</span> still wanting something, out of {items.length} on the
          board. A request written here outlives the conversation that raised it. The same board is a tab of{" "}
          <Link href="/admin?view=work" className="underline underline-offset-4">
            Admin
          </Link>
          ; this page is the two halves together, the board and everything that has already shipped.
        </p>
        <BacklogBoard items={items} who={me.name ?? ""} />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="release-history">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          Releases <span className="font-mincho text-sm font-normal opacity-70">更新履歴</span>
        </h2>
        <p className="max-w-prose text-sm text-muted">
          What has already shipped, newest first, in a player&apos;s words. Read from the changelog itself, which is
          written in the same commit as the work, so this list cannot fall behind the site it describes. The board above
          is the other half: what has been asked for and has not happened yet.
        </p>
        <Releases releases={releases} current={VERSION} />
      </section>
    </Page>
  );
}
