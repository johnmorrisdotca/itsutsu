"use client";

import { useState } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * The whole record as plain text, to be selected, copied and kept.
 *
 * Folded away by default, the way the move list is on a replay, because it is
 * the same offer made about the whole record rather than one game: here is
 * everything, in something you can take with you. The text is built on the
 * server and only shown here — nothing is computed twice, and nothing about
 * what "the record" means is decided in two places.
 *
 * CARRIES THE HYDRATION MARK, although the fold is a native `<details>`. A
 * summary clicked before the page has hydrated can end up shut again: that is
 * how `e2e/record-text.spec.ts` failed its first attempt on PR #26. A test
 * waits for `data-ready="true"` before it opens the fold.
 */
export function RecordText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const hydrated = useHydrated();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // A browser that refuses the clipboard still shows the text, and it can
      // be selected by hand. Saying nothing is better than an error about a
      // permission the reader did not know they were asked for.
      setCopied(false);
    }
  }

  return (
    <details className="group flex flex-col gap-2" data-testid="record-text" {...readyMark(hydrated)}>
      <summary className="cursor-pointer list-none text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase select-none hover:text-ink">
        The whole record as text <span className="font-mincho normal-case tracking-normal">記録</span>
        <span className="ml-1 opacity-60 group-open:hidden">+</span>
        <span className="ml-1 hidden opacity-60 group-open:inline">−</span>
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={copy}
          className="self-start rounded-lg border border-rule px-3 py-1.5 text-xs transition-colors hover:bg-shade"
          data-testid="record-text-copy"
        >
          {copied ? "Copied" : "Copy it all"}
        </button>
        {/*
          Scrolls in its own box rather than stretching the page: the listing
          is as wide as the longest name in it, and that is not something the
          rest of the page should have to accommodate.
        */}
        <pre className="max-h-[28rem] overflow-auto rounded-xl border border-rule bg-shade/40 px-4 py-3 font-mono text-xs leading-relaxed">
          {text}
        </pre>
      </div>
    </details>
  );
}
