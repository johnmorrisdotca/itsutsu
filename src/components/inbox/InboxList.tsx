import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { LocalTime } from "@/components/ui/LocalTime";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { weave } from "@/lib/i18n/weave";
import { matchPath } from "@/lib/gomoku/slugs";
import { INBOX_KINDS } from "@/lib/inbox/inbox.constants";
import { messagesPath } from "@/lib/messages/messages.constants";
import { tablePath } from "@/lib/party/online/onlinePaths";
import type { InboxItemShown } from "@/lib/inbox/inbox";


/**
 * WHAT HAPPENED WHILE YOU WERE AWAY, newest first — one line each, the game's
 * picture and name leading to it, the other player's name leading to them.
 *
 * An empty inbox shows its shape and says what will arrive here, rather than
 * hiding: an empty table is data.
 */
export async function InboxList({ items }: { items: readonly InboxItemShown[] }) {
  const say = await currentSpeaker();
  if (items.length === 0) {
    return (
      <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="inbox-empty">
        {say.say("inbox.empty")}
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
            <p>{said(item, say)}</p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <LocalTime at={item.createdAt} />
              {item.kind === INBOX_KINDS.message && item.fromMemberId !== null ? (
                <Link href={messagesPath(item.fromMemberId)} className="underline underline-offset-4" data-testid="inbox-open">
                  {say.say("inbox.reply")}
                </Link>
              ) : item.gameId !== null && item.variant !== null ? (
                <Link href={atTable(item.kind) ? tablePath(item.variant, item.gameId) : matchPath(item.variant, item.gameId)} className="underline underline-offset-4" data-testid="inbox-open">
                  {item.kind === INBOX_KINDS.offer || item.kind === INBOX_KINDS.raceOffer ? say.say("inbox.answer") : say.say("inbox.open")}
                </Link>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * How an offer's `detail` was written before it was a phrase: "a match of 3 games", stored as English by the route
 * that makes a match. Read back as its number, so that the reader's own language says it.
 */
const LEGACY_MATCH = /^a match of (\d+) games$/;

/** The phrase for what a finished game or table came to for the reader. */
const GAME_OVER: Readonly<Record<string, PhraseKey>> = { won: "inbox.gameWon", lost: "inbox.gameLost", drawn: "inbox.gameDrawn" };
const TABLE_OVER: Readonly<Record<string, PhraseKey>> = { won: "inbox.tableWon", shared: "inbox.tableShared", lost: "inbox.tableLost" };

/** One item in words: who, what, and which game, as one sentence of the reader's language. */
function said(item: InboxItemShown, say: Speaker) {
  const who = <PlayerName name={item.fromName} memberId={item.fromMemberId} fallback={say.say("inbox.somebody")} />;
  const game = item.variant !== null ? <GameName variant={item.variant} /> : say.say("inbox.aGame");
  const parts = { who, game, text: item.detail };
  switch (item.kind) {
    case INBOX_KINDS.gameOver:
      return weave(say.say(GAME_OVER[item.detail] ?? "inbox.gameDrawn"), parts);
    case INBOX_KINDS.offer: {
      const match = LEGACY_MATCH.exec(item.detail);
      if (match !== null) return weave(say.say("inbox.offerMatch", { count: say.number(Number(match[1])) }), parts);
      return weave(say.say(item.detail !== "" ? "inbox.offerDetail" : "inbox.offerAsked", { detail: item.detail }), parts);
    }
    case INBOX_KINDS.offerDeclined:
      return weave(say.say("inbox.declined"), parts);
    case INBOX_KINDS.offerWithdrawn:
      return weave(say.say("inbox.withdrawn"), parts);
    case INBOX_KINDS.seatTaken:
      return weave(say.say("inbox.seatTaken"), parts);
    case INBOX_KINDS.tableInvite:
      return weave(say.say("inbox.tableInvite"), parts);
    case INBOX_KINDS.raceOffer:
      return weave(say.say("inbox.raceOffer"), parts);
    case INBOX_KINDS.tableOver:
      return weave(say.say(TABLE_OVER[item.detail] ?? "inbox.tableEnded"), parts);
    case INBOX_KINDS.message:
      return weave(say.say("inbox.message"), parts);
    case INBOX_KINDS.note:
      return weave(say.say("inbox.note"), parts);
    default:
      return item.detail;
  }
}

/** Whether an item is about a party table on several devices, whose id is a table's, not a game's. */
function atTable(kind: string): boolean {
  return kind === INBOX_KINDS.tableInvite || kind === INBOX_KINDS.tableOver;
}
