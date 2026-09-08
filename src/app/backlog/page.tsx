import Link from "next/link";
import { redirect } from "next/navigation";

import { BacklogBoard } from "@/components/backlog/BacklogBoard";
import { Releases } from "@/components/backlog/Releases";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { openCount } from "@/lib/backlog/backlog";
import { fetchBoard } from "@/lib/backlog/backlogStore";
import { readReleases } from "@/lib/backlog/releasesFile";
import { VERSION } from "@/lib/version";

export const metadata = { title: "Backlog" };

// The board is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

/**
 * Everything anyone has asked for, in one place.
 *
 * Before this page a request was a message in a conversation: raised, agreed
 * to, and then gone with the scrollback, so the answer to "what did I ask for"
 * depended on who had kept the thread. A row here outlives the conversation
 * that made it. Anyone who is in can add to it, and anyone can move an item
 * along, because a board only one person can write to is a list, not a board.
 */
export default async function BacklogPage() {
  const me = await currentSession();
  if (me === null) redirect("/join?next=%2Fbacklog");

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
          board. A request written here outlives the conversation that raised it: anyone who is in can add to it, and
          move an item along as it happens. The games themselves are on the{" "}
          <Link href="/games" className="underline underline-offset-4">
            play
          </Link>{" "}
          page; this is what the site is not yet.
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
