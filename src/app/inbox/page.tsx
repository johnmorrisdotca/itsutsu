import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InboxList } from "@/components/inbox/InboxList";
import { INBOX_COPY } from "@/components/inbox/inbox.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { openInbox } from "@/lib/inbox/inbox";

export const metadata = { title: "Inbox 受信" };

/* A member's own list, read and marked read on each visit. */
export const dynamic = "force-dynamic";

/**
 * THE INBOX (John, 2026-09-16, after ItsYourTurn's): what happened in your
 * games while you were away, in one place. Opening it marks everything read
 * and clears what is past thirty days — see `openInbox`.
 */
export default async function InboxPage() {
  const memberId = await currentMemberId();
  const items = memberId === null ? [] : await openInbox(memberId);
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={INBOX_COPY.title} kanji={INBOX_COPY.kanji} lead={INBOX_COPY.lead} />
      <section className="flex flex-col gap-4" data-testid="inbox">
        <InboxList items={items} />
      </section>
    </Page>
  );
}
