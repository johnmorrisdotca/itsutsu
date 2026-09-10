import Link from "next/link";

import {
  RECORD_SCOPES,
  RECORD_SCOPE_LIST,
  scopeHref,
  scopeHrefFrom,
  type RecordScope,
} from "@/lib/rating/recordScope";

const COPY: Record<RecordScope, { label: string; kanji: string; note: string }> = {
  [RECORD_SCOPES.everywhere]: {
    label: "Everywhere",
    kanji: "通算",
    note: "Every site this player played on, counted together.",
  },
  [RECORD_SCOPES.here]: {
    label: "Itsutsu only",
    kanji: "五",
    note: "Only the games played on this site.",
  },
};

const BUTTON =
  "rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss";
const ON = "border-ink bg-ink text-paper";
const OFF = "border-rule bg-ivory/70 hover:border-rule-strong";

/**
 * Which of somebody's playing the figures above are counting.
 *
 * Links rather than buttons, the same choice the directory's bar made for the
 * same reason: a narrowed page is an address somebody can send, and the page
 * works with no script at all.
 *
 * Drawn only where it can change the answer — see `scopeWorthAsking`. For
 * somebody who has only ever played here the two scopes are the same games,
 * and a control that cannot change anything is furniture that also promises a
 * chapter which is not there.
 */
export function RecordScopeBar({
  base,
  view,
  query,
  scope,
  label = "How much of this player's record to count",
}: {
  base: string;
  view?: string;
  /**
   * The rest of the address, for a page that already narrows itself.
   *
   * The directory has three narrowings of its own, and choosing a scope must
   * not quietly undo any of them — so its whole query comes through and only
   * the scope is changed.
   */
  query?: string;
  scope: RecordScope;
  label?: string;
}) {
  const href = (one: RecordScope) =>
    query === undefined
      ? scopeHref(base, view, one)
      : scopeHrefFrom(base, new URLSearchParams(query), one);
  return (
    <nav
      className="flex flex-wrap items-center gap-1"
      aria-label={label}
      data-testid="record-scope"
    >
      {RECORD_SCOPE_LIST.map((one) => (
        <Link
          key={one}
          href={href(one)}
          aria-current={scope === one ? "true" : undefined}
          title={COPY[one].note}
          className={`${BUTTON} ${scope === one ? ON : OFF}`}
          data-testid={`scope-${one}`}
        >
          {COPY[one].label} <span className="font-mincho opacity-70">{COPY[one].kanji}</span>
        </Link>
      ))}
    </nav>
  );
}
