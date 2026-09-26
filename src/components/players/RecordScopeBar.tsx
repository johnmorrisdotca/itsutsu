import { ToggleLink } from "@/components/ui/ViewTabs";

import {
  RECORD_SCOPES,
  scopeHref,
  scopeHrefFrom,
  type RecordScope,
} from "@/lib/rating/recordScope";

/**
 * Which of somebody's playing the figures above are counting: ONE BOX,
 * "Include worldwide", ticked by default. Ticked counts the credit for games
 * played on other sites (the `everywhere` scope); unticked counts this site
 * only (`here`). John, 2026-09-26, on /players: "Bad design - we have tabs
 * below tabs... seems like Everywhere / Itsutsu Only under Everyone should
 * just be a checkbox filter called 'Include Worldwide'." It was two tabs, which
 * read as a second choice of view under the first; it is a switch over the
 * same list, like "Settled ratings" and "Seen lately" (`ToggleLink`).
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
  hrefFor,
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
  /**
   * The address the box leads to, for a page that keeps its own rules about
   * it. The XP board does: its box always names the scope, so following it is
   * what gets it remembered on the account, and they drop the board's cursor.
   */
  hrefFor?: (scope: RecordScope) => string;
}) {
  const href = (one: RecordScope) =>
    hrefFor !== undefined
      ? hrefFor(one)
      : query === undefined
        ? scopeHref(base, view, one)
        : scopeHrefFrom(base, new URLSearchParams(query), one);
  const on = scope === RECORD_SCOPES.everywhere;
  return (
    <span data-testid="record-scope" data-scope={scope} aria-label={label} role="group">
      <ToggleLink
        href={href(on ? RECORD_SCOPES.here : RECORD_SCOPES.everywhere)}
        on={on}
        testId="include-worldwide"
        title={
          on
            ? "Counting every site played on, this one included. Untick for this site only."
            : "Counting this site only. Tick to add the games played on other sites."
        }
      >
        Include worldwide
      </ToggleLink>
    </span>
  );
}
