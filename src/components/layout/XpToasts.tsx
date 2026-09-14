"use client";

import { useEffect, useRef } from "react";

import { useToastsHeldForCard } from "@/components/history/useResultCard";
import { XpToastHost } from "@/components/xp/XpToastHost";
import type { XpToastItem } from "@/components/xp/xp.types";
import { clearXpFlash } from "@/lib/xp/xpFlash.actions";
import type { XpToastHold } from "@/lib/xp/xpFlash";

/** Nothing to draw, as one value so a held batch does not hand the host a new list each render. */
const NOTHING: readonly XpToastItem[] = [];

/**
 * The toasts a member is owed, shown once and then forgotten.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THERE IS A WRAPPER AT ALL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XpToastHost` draws and nothing else — it is handed awards and it stacks
 * them. Two things have to happen around it that a server component cannot do:
 * the flash has to be CLEARED once it has been handed over, which is a Server
 * Function call, and that call has to happen from the browser, once, rather
 * than during the render that read it. Hence a client component, mounted by the
 * masthead.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CLEARED ON ARRIVAL, NOT ON DISMISSAL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The flash is cleared as soon as the toasts have been handed to the host,
 * because at that point they HAVE been shown: the host owns their time on
 * screen from admission, and a reader who navigates away mid-toast has still
 * been told. Clearing per dismissal instead would mean one Server Function call
 * per toast in a stack of three, and a batch nobody dismissed would come back
 * on the next page for ever.
 *
 * Conditional on the stamp, in `clearXpFlashFor`, so a clear cannot wipe a
 * batch that landed while the page was open — that one is shown on the next
 * page rather than lost. And it is fired once per stamp: the ref is what makes a
 * re-render of the same flash not a second call.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HELD WHERE THE RESULT CARD SAYS THE SAME THING
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A game's end pays a batch, and the page that batch is first read on is the
 * finished game's own record — where the result card opens over the board and
 * already says "+N XP from this game", from this very batch (`flashAboutGame`).
 * Stacked toasts there sat in the middle of the board the reader was looking at,
 * saying it a second time. So for that batch the card is the announcement: the
 * host is handed nothing, and the flash is still cleared, because it HAS been
 * shown. A card this browser closed on an earlier visit does not open, and then
 * the toasts show as they always did (`useToastsHeldForCard`). Every other batch
 * is untouched.
 *
 * **Nothing here polls, and nothing fetches.** The awards arrive as props from
 * a server render that read them off a row it was already reading. This is the
 * only request the whole mechanism makes, and it is a write, after the fact.
 *
 * A failure is a toast shown twice, which the design allows on purpose: a toast
 * is a courtesy and the ledger is the record.
 */
export function XpToasts({
  at,
  items,
  holdFor = null,
}: {
  at: string;
  items: readonly XpToastItem[];
  /** The game-end batch the result card on this page is saying instead, or null. */
  holdFor?: XpToastHold | null;
}) {
  const cleared = useRef<string | null>(null);
  const held = useToastsHeldForCard(holdFor);

  useEffect(() => {
    if (cleared.current === at) return;
    cleared.current = at;
    void clearXpFlash(at);
  }, [at]);

  return <XpToastHost items={held ? NOTHING : items} />;
}
