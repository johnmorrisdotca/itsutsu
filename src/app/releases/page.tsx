import Link from "@/components/ui/Link";

import { Releases } from "@/components/backlog/Releases";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { titleWithKanji } from "@/components/games/pageTitles";
import { readReleases } from "@/lib/backlog/releasesFile";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";
import { VERSION } from "@/lib/version";

export async function generateMetadata() {
  return { title: titleWithKanji(await currentSpeaker(), "pages.releasesTitle", "更新履歴") };
}

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
  const say = await currentSpeaker();
  const releases = await readReleases();

  return (
    <Page>
      <SiteHeader />
      <PageTitle title={say.say("pages.releasesTitle")} kanji="更新履歴" lead={say.say("pages.releasesLead")} />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="release-history">
        <Releases releases={releases} current={VERSION} />
        <p className="text-xs text-muted">
          {weave(say.say("pages.releasesNote"), {
            link: (
              <Link href="/games" className="underline underline-offset-4">
                {say.say("pages.releasesOnePage")}
              </Link>
            ),
          })}
        </p>
      </section>
    </Page>
  );
}
