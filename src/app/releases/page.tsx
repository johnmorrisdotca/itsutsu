import Link from "next/link";

import { Releases } from "@/components/backlog/Releases";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { readReleases } from "@/lib/backlog/releasesFile";
import { VERSION } from "@/lib/version";

export const metadata = { title: "What has shipped" };

// Read from the changelog on every request, never at build time.
export const dynamic = "force-dynamic";

/**
 * What has shipped, at /releases.
 *
 * It lived on the board, underneath everything still wanted. Two different
 * questions on one page: what is coming, which is the operator's business,
 * and what arrived, which is everybody's. The second was written for players
 * from the beginning — "in a player's words", the copy said — and then kept
 * behind a page that answers 404 to every player there is.
 *
 * So it has its own address, and it is open. The edition is stamped at the
 * foot of every page already and the changelog is written in the open; there
 * was never anything here to keep back, only somewhere better to put it.
 */
export default async function ReleasesPage() {
  const releases = await readReleases();

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title="What has shipped"
        kanji="更新履歴"
        lead="Newest first, in a player’s words. Read from the changelog itself, which is written in the same commit as the work, so this list cannot fall behind the site it describes. The edition you are being served is marked."
      />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="release-history">
        <Releases releases={releases} current={VERSION} />
        <p className="text-xs text-muted">
          Every game is on{" "}
          <Link href="/games" className="underline underline-offset-4">
            one page
          </Link>
          , and how each is played is under the game itself.
        </p>
      </section>
    </Page>
  );
}
