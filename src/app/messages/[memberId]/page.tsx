import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MessageForm } from "@/components/messages/MessageForm";
import { MESSAGE_COPY } from "@/components/messages/messages.constants";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { LocalTime } from "@/components/ui/LocalTime";
import { currentMemberId } from "@/lib/auth/currentSession";
import { readThread } from "@/lib/messages/messages";
import { prisma } from "@/lib/prisma";
import { mayReachMember } from "@/lib/social/childReach";
import { isIgnoring } from "@/lib/social/ignores";
import { listable } from "@/lib/social/listable";

export const metadata = { title: "Messages 手紙" };

/* A member's own conversation, read and marked read on each visit. */
export const dynamic = "force-dynamic";

/**
 * A CONVERSATION WITH ONE MEMBER, off the board (John, 2026-09-08). The
 * thread oldest first, and the line to write in under it. Everything about who
 * may write and what is shown is `messages.ts`'s — the ignore list in full.
 */
export default async function MessagesPage({ params }: PageProps<"/messages/[memberId]">) {
  const { memberId } = await params;
  const otherId = decodeURIComponent(memberId);
  const me = await currentMemberId();
  const other = await prisma.member.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, botTier: true, unclaimableBecause: true },
  });
  const reachable = me !== null && other !== null && listable(other) && other.id !== me;
  const ignored = reachable ? await isIgnoring(me, otherId) : false;
  // A child hears only from their own buddies: the box is not offered to anybody else (childRules.ts).
  const childClosed = reachable && !(await mayReachMember(otherId, me));
  const thread = reachable ? await readThread(me, otherId) : [];

  return (
    <Page>
      <SiteHeader />
      <PageTitle title={MESSAGE_COPY.title} kanji={MESSAGE_COPY.kanji} />
      <section className="flex flex-col gap-4" data-testid="messages">
        {!reachable || other === null ? (
          <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="messages-nobody">
            {MESSAGE_COPY.nobody}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {MESSAGE_COPY.with} <PlayerName name={other.name} memberId={other.id} fallback={MESSAGE_COPY.nobody} />
            </p>
            {ignored ? (
              <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="messages-ignored">
                {MESSAGE_COPY.ignored}
              </p>
            ) : null}
            {thread.length === 0 && !ignored ? (
              <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="messages-empty">
                {MESSAGE_COPY.empty}
              </p>
            ) : (
              <ol className="flex flex-col gap-2" data-testid="thread">
                {thread.map((message) => (
                  <li
                    key={message.id}
                    className={`flex max-w-[85%] flex-col gap-0.5 rounded-xl border border-rule px-3 py-2 text-sm ${
                      message.mine ? "self-end bg-ivory" : "self-start bg-paper"
                    }`}
                    data-testid={message.mine ? "message-mine" : "message-theirs"}
                  >
                    <span className="whitespace-pre-wrap break-words">{message.text}</span>
                    <span className="text-xs text-muted">
                      {message.mine ? `${MESSAGE_COPY.you} · ` : ""}
                      <LocalTime at={message.createdAt} />
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {childClosed ? (
              <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="messages-child-closed">
                {MESSAGE_COPY.childClosed}
              </p>
            ) : null}
            {!ignored && !childClosed ? <MessageForm to={other.id} /> : null}
          </>
        )}
      </section>
    </Page>
  );
}
