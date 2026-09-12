"use client";

import { WORDS_COPY } from "./mine.constants";
import type { WordCandidatesProps } from "./words.types";

/*
 * THE FOUR ON OFFER, IN THE SAME FAMILY AS THE BOXES ABOVE. A candidate becomes
 * a box the moment it is tapped, so it is drawn as a lighter version of one —
 * the same corners, the same weight of type, ivory where a kept word is moss —
 * rather than as the site's ordinary button, which is what it was and what
 * made it look like a form control instead of a choice being offered. Big
 * enough for a child's finger on an iPad with room to spare: eighty pixels
 * tall on a phone, ninety-six on a tablet, against the forty-eight a
 * fingertip needs.
 */
const CANDIDATE =
  "flex min-h-20 w-full items-center justify-center rounded-2xl border-2 border-rule-strong bg-ivory px-3 text-2xl font-semibold tracking-wide text-ink transition-colors outline-none select-none hover:border-moss hover:bg-moss-soft/60 focus-visible:ring-4 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:bg-moss-soft disabled:cursor-wait disabled:opacity-40 sm:min-h-24 sm:text-3xl";

/*
 * The refresh, as an icon beside the offer — John's own suggestion, in place
 * of the "Show me four more" text link that sat under it. Round, so it reads
 * as a control rather than a fifth word, and labelled for a screen reader
 * because an icon has no words of its own. Rerolling is unlimited by design
 * (see pickTicket.ts: an attacker never learns what was offered, so a reroll
 * costs nothing); the rate limit on the draw route still applies underneath.
 */
const REFRESH =
  "flex size-14 shrink-0 items-center justify-center self-center rounded-full border-2 border-rule-strong bg-ivory text-ink-soft transition-colors outline-none hover:border-moss hover:text-moss focus-visible:ring-4 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-wait disabled:opacity-40 sm:size-16";

export function WordCandidates({ offered, busy, remaining, onKeep, onRefresh }: WordCandidatesProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">
        <span className="font-semibold text-ink">{WORDS_COPY.keepOne}</span> {WORDS_COPY.toGo(remaining)}
      </p>
      <div className="flex items-center gap-3 sm:gap-4">
        <ul className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" data-testid="phrase-candidates">
          {offered.map((word, index) => (
            <li key={`${word}-${index}`} className="min-w-0">
              <button
                type="button"
                disabled={busy}
                onClick={() => onKeep(index)}
                data-testid={`phrase-candidate-${index}`}
                className={CANDIDATE}
              >
                {word}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={onRefresh}
          aria-label={WORDS_COPY.refresh}
          title={WORDS_COPY.refresh}
          data-testid="phrase-reroll"
          className={REFRESH}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6 sm:size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
