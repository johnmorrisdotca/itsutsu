import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { LocalTime } from "@/components/ui/LocalTime";
import { matchPath } from "@/lib/gomoku/slugs";
import { INBOX_KINDS } from "@/lib/inbox/inbox.constants";
import type { InboxItemShown } from "@/lib/inbox/inbox";

import { INBOX_COPY } from "./inbox.constants";

/**
 * WHAT HAPPENED WHILE YOU WERE AWAY, newest first — one line each, the game's
 * picture and name leading to it, the other player's name leading to them.
 *
 * An empty inbox shows its shape and says what will arrive here, rather than
 * hiding: an empty table is data.
 */
export function InboxList({ items }: { items: readonly InboxItemShown[] }) {
  if (items.length === 0) {
    return (
      <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="inbox-empty">
        {INBOX_COPY.empty}
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-rule" data-testid="inbox-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex items-start gap-3 py-3 ${item.unread ? "font-medium" : ""}`}
          data-testid="inbox-item"
          data-kind={item.kind}
          data-unread={item.unread}
        >
          {item.variant !== null ? <GameThumb variant={item.variant} size="small" /> : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
            <p>
              <Said item={item} />
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <LocalTime at={item.createdAt} />
              {item.gameId !== null && item.variant !== null ? (
                <Link href={matchPath(item.variant, item.gameId)} className="underline underline-offset-4" data-testid="inbox-open">
                  {item.kind === INBOX_KINDS.offer ? INBOX_COPY.answer : INBOX_COPY.open}
                </Link>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One item in words: who, what, and which game. */
function Said({ item }: { item: InboxItemShown }) {
  const who = <PlayerName name={item.fromName} memberId={item.fromMemberId} fallback={INBOX_COPY.somebody} />;
  const game = item.variant !== null ? <GameName variant={item.variant} /> : INBOX_COPY.aGame;
  switch (item.kind) {
    case INBOX_KINDS.gameOver:
      return (
        <>
          {INBOX_COPY.gameOver.lead} {game} {INBOX_COPY.gameOver.against} {who} {INBOX_COPY.gameOver.is} {INBOX_COPY.gameOver.result(item.detail)}
        </>
      );
    case INBOX_KINDS.offer:
      return (
        <>
          {who} {INBOX_COPY.offer.asked} {game}
          {item.detail !== "" ? ` — ${item.detail}` : ""}.
        </>
      );
    case INBOX_KINDS.offerDeclined:
      return (
        <>
          {who} {INBOX_COPY.declined} {game}.
        </>
      );
    case INBOX_KINDS.offerWithdrawn:
      return (
        <>
          {who} {INBOX_COPY.withdrawn} {game}.
        </>
      );
    case INBOX_KINDS.seatTaken:
      return (
        <>
          {who} {INBOX_COPY.seatTaken} {game}. {INBOX_COPY.begun}
        </>
      );
    case INBOX_KINDS.note:
      return (
        <>
          {who} {INBOX_COPY.note} {game}: “{item.detail}”
        </>
      );
    default:
      return <>{item.detail}</>;
  }
}
