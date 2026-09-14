import Link from "next/link";

import { AWAY_AFTER_DAYS, filterBarHref, type DirectoryFilter } from "@/lib/rating/directoryFilter";

import { FILTER_CHIP, FILTER_CHIP_OFF, FILTER_CHIP_ON, WhoFilter } from "./WhoFilter";

const BUTTON = FILTER_CHIP;
const ON = FILTER_CHIP_ON;
const OFF = FILTER_CHIP_OFF;

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

      <nav className="flex flex-wrap gap-1" aria-label="Which of them to leave out">
        <Link
          href={to({ ...filter, settled: !filter.settled })}
          aria-pressed={filter.settled}
          className={`${BUTTON} ${filter.settled ? ON : OFF}`}
          data-testid="only-settled"
          title="A rating is unrated for the first few games and provisional while it settles."
        >
          Settled ratings
        </Link>
        <Link
          href={to({ ...filter, active: !filter.active })}
          aria-pressed={filter.active}
          className={`${BUTTON} ${filter.active ? ON : OFF}`}
          data-testid="only-active"
          title={`Seen in the last ${AWAY_AFTER_DAYS} days. A computer player is always about.`}
        >
          Seen lately
        </Link>
      </nav>

      <p className="text-xs text-muted" data-testid="directory-count">
        {shown === total ? `${total} listed` : `${shown} of ${total} listed`}
      </p>
    </div>
  );
}
