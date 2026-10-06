import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InboxList } from "@/components/inbox/InboxList";
import { INBOX_KANJI } from "@/components/inbox/inbox.constants";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { currentMemberId } from "@/lib/auth/currentSession";
import { openInbox } from "@/lib/inbox/inbox";

export async function generateMetadata() {
  return { title: titleWithKanji(await currentSpeaker(), "inbox.title", INBOX_KANJI) };
}

/* A member's own list, read and marked read on each visit. */
export const dynamic = "force-dynamic";

/**
 * THE INBOX (John, 2026-09-16, after ItsYourTurn's): what happened in your
 * games while you were away, in one place. Opening it marks everything read
 * and clears what is past thirty days — see `openInbox`.
 */
export default async function InboxPage() {
  const say = await currentSpeaker();
  const memberId = await currentMemberId();
  const items = memberId === null ? [] : await openInbox(memberId);
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={say.say("inbox.title")} kanji={INBOX_KANJI} lead={say.say("inbox.lead")} />
      <section className="flex flex-col gap-4" data-testid="inbox">
        <InboxList items={items} />
      </section>
    </Page>
  );
}
