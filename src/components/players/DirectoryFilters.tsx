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
  filter,
  query,
  shown,
  total,
}: {
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
      <WhoFilter who={filter.who} hrefFor={(who) => to({ ...filter, who })} />

      {/* Two switches, each on or off over the list: ticked boxes, not tabs (`ToggleLink`). */}
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Which of them to leave out">
        <ToggleLink
          href={to({ ...filter, settled: !filter.settled })}
          on={filter.settled}
          testId="only-settled"
          title="A rating is unrated for the first few games and provisional while it settles."
        >
          Settled ratings
        </ToggleLink>
        <ToggleLink
          href={to({ ...filter, active: !filter.active })}
          on={filter.active}
          testId="only-active"
          title={`Seen in the last ${AWAY_AFTER_DAYS} days. A computer player is always about.`}
        >
          Seen lately
        </ToggleLink>
      </nav>

      <p className="text-xs text-muted" data-testid="directory-count">
        {shown === total ? `${total} listed` : `${shown} of ${total} listed`}
      </p>
    </div>
  );
}
