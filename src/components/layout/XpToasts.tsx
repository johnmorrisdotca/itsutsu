"use client";

import { useEffect, useRef } from "react";

import { XpToastHost } from "@/components/xp/XpToastHost";
import type { XpToastItem } from "@/components/xp/xp.types";
import { clearXpFlash } from "@/lib/xp/xpFlash.actions";

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
 * than during the render that read it. Hence a client component of eleven
 * lines, mounted by the root layout.
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
 * **Nothing here polls, and nothing fetches.** The awards arrive as props from
 * a server render that read them off a row it was already reading. This is the
 * only request the whole mechanism makes, and it is a write, after the fact.
 *
 * A failure is a toast shown twice, which the design allows on purpose: a toast
 * is a courtesy and the ledger is the record.
 */
export function XpToasts({ at, items }: { at: string; items: readonly XpToastItem[] }) {
  const cleared = useRef<string | null>(null);

  useEffect(() => {
    if (cleared.current === at) return;
    cleared.current = at;
    void clearXpFlash(at);
  }, [at]);

  return <XpToastHost items={items} />;
}
