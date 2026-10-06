import type { ReactNode } from "react";

import type { Speaker } from "@/lib/i18n/i18n";
import { AWAY_AFTER_DAYS, filterBarHref, type DirectoryFilter } from "@/lib/rating/directoryFilter";

import { ToggleLink } from "@/components/ui/ViewTabs";

import { WhoFilter } from "./WhoFilter";

/**
 * The three questions people ask of a directory: who is a person, whose
 * rating means anything yet, and who is still about.
 *
 * Links rather than buttons, so every narrowing is an address somebody can
 * send — /players?who=computers&settled=1 — and so the page needs no script to
 * work at all. The same choice the rules index made, arrived at from the same
 * place: a list you cannot link to is a list you cannot show anybody.
 *
 * The count is printed beside them, because a filter that empties a list
 * without saying so reads as a broken page rather than as an answer.
 */
export function DirectoryFilters({
  say,
  filter,
  query,
  shown,
  total,
  worldwide,
}: {
  say: Speaker;
  filter: DirectoryFilter;
  /**
   * The address as it stands, so narrowing keeps whatever else is on it.
   *
   * It kept nothing until the directory learned to sort, which was harmless
   * while who/settled/active were the whole of what /players could say. With a
   * sort in the query it made this bar a control that undoes another control:
   * press Played, then press People, and the order silently goes back to who
   * was seen last. `filterBarHref` says which parameters survive and which
   * cannot.
   */
  query: string;
  /** How many members match the narrowing, and how many there are at all. */
  shown: number;
  total: number;
  /**
   * "Include worldwide", when the list has a kept record for it to change: a
   * third box beside these two, never a row of its own under them (John,
   * 2026-09-26: "we have tabs below tabs").
   */
  worldwide?: ReactNode;
}) {
  /*
   * Every link here says who outright, including when who is the default.
   * A bare /players means "however I last asked", so leaving the default off
   * would make the Everyone button ask for the narrowing it is offering to
   * remove — which is exactly what it did.
   */
  const to = (next: DirectoryFilter) => filterBarHref(next, query);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="directory-filters">
      <WhoFilter say={say} who={filter.who} hrefFor={(who) => to({ ...filter, who })} />

      {/* Switches, each on or off over the list: ticked boxes, not tabs (`ToggleLink`). */}
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label={say.say("players.filterLabel")}>
        <ToggleLink
          href={to({ ...filter, settled: !filter.settled })}
          on={filter.settled}
          testId="only-settled"
          title={say.say("players.filterEstablishedTitle")}
        >
          {say.say("players.chipEstablished")}
        </ToggleLink>
        <ToggleLink
          href={to({ ...filter, active: !filter.active })}
          on={filter.active}
          testId="only-active"
          title={say.say("players.filterActiveTitle", { days: say.number(AWAY_AFTER_DAYS) })}
        >
          {say.say("players.chipActive")}
        </ToggleLink>
        {worldwide}
      </nav>

      <p className="text-xs text-muted" data-testid="directory-count">
        {shown === total ? say.say("players.listedAll", { total: say.number(total) }) : say.say("players.listedSome", { shown: say.number(shown), total: say.number(total) })}
      </p>
    </div>
  );
}
