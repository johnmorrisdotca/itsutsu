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
    <Page gap="gap-6">
      <SiteHeader />
      <section className="flex flex-col gap-4" data-testid="inbox">
        <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
          {INBOX_COPY.title}
          <span className="font-mincho text-base font-normal opacity-70">{INBOX_COPY.kanji}</span>
        </h1>
        <p className="text-sm text-muted">{INBOX_COPY.lead}</p>
        <InboxList items={items} />
      </section>
    </Page>
  );
}
