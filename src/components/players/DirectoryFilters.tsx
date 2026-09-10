import Link from "next/link";

import {
  AWAY_AFTER_DAYS,
  DIRECTORY_WHO,
  DIRECTORY_WHO_LIST,
  filterBarHref,
  type DirectoryFilter,
  type DirectoryWho,
} from "@/lib/rating/directoryFilter";

const WHO_DISPLAY: Record<DirectoryWho, { label: string; kanji: string }> = {
  [DIRECTORY_WHO.people]: { label: "People", kanji: "人" },
  [DIRECTORY_WHO.computers]: { label: "Computers", kanji: "機械" },
  [DIRECTORY_WHO.everyone]: { label: "Everyone", kanji: "全員" },
};

const BUTTON =
  "rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss";
const ON = "border-ink bg-ink text-paper";
const OFF = "border-rule bg-ivory/70 hover:border-rule-strong";

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
  shown,
  total,
}: {
  filter: DirectoryFilter;
  shown: number;
  total: number;
}) {
  /*
   * Every link here says who outright, including when who is the default.
   * A bare /players means "however I last asked", so leaving the default off
   * would make the Everyone button ask for the narrowing it is offering to
   * remove — which is exactly what it did.
   */
  const to = (next: DirectoryFilter) => filterBarHref(next);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="directory-filters">
      <nav className="flex flex-wrap gap-1" aria-label="Which players to list">
        {DIRECTORY_WHO_LIST.map((who) => (
          <Link
            key={who}
            href={to({ ...filter, who })}
            aria-current={filter.who === who ? "true" : undefined}
            className={`${BUTTON} ${filter.who === who ? ON : OFF}`}
            data-testid={`who-${who}`}
          >
            {WHO_DISPLAY[who].label} <span className="font-mincho opacity-70">{WHO_DISPLAY[who].kanji}</span>
          </Link>
        ))}
      </nav>

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
