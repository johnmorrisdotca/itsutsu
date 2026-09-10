import Link from "next/link";

import { penaltyName } from "@/components/live/penalty";
import { describeMoveTime } from "@/lib/history/deadline";
import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";
import {
  SEAT_PENALTY_LIST,
  SEAT_RATING,
  SEAT_RATING_LIST,
  openSeatQuery,
  type OpenSeatFilter,
  type SeatPenaltyFilter,
  type SeatRatingBand,
} from "@/lib/history/openSeatsFilter";
import { OPEN_SEATS_FILTER_COPY } from "./mine.constants";

const BUTTON =
  "rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss";
const ON = "border-ink bg-ink text-paper";
const OFF = "border-rule bg-ivory/70 hover:border-rule-strong";

const RATING_DISPLAY: Record<SeatRatingBand, string> = {
  [SEAT_RATING.any]: OPEN_SEATS_FILTER_COPY.anyRating,
  [SEAT_RATING.under]: OPEN_SEATS_FILTER_COPY.under,
  [SEAT_RATING.over]: OPEN_SEATS_FILTER_COPY.over,
  [SEAT_RATING.unrated]: OPEN_SEATS_FILTER_COPY.unrated,
};

function penaltyLabel(penalty: SeatPenaltyFilter): string {
  return penalty === "any" ? OPEN_SEATS_FILTER_COPY.anyPenalty : penaltyName(penalty);
}

/**
 * The three questions a reader asks of the noticeboard: how fast, against
 * whom, and what losing the clock costs. The players page settled on the
 * shape for this — links rather than buttons, so every narrowing is an
 * address somebody can bookmark or send on, and the board needs no script to
 * work at all.
 *
 * The count is printed beside them for the same reason it is on the players
 * page: a filter that empties the board without saying so reads as a broken
 * page rather than as an honest answer.
 */
export function OpenSeatsFilters({
  filter,
  shown,
  total,
}: {
  filter: OpenSeatFilter;
  shown: number;
  total: number;
}) {
  const to = (next: OpenSeatFilter) => {
    const query = openSeatQuery(next);
    // Back to the board itself, not to the top of the page — a reader who
    // just changed a pill is looking at the noticeboard, not the hero above it.
    return `${query === "" ? "/games" : `/games?${query}`}#open-seats`;
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="open-seats-filters">
      <nav className="flex flex-wrap gap-1" aria-label={OPEN_SEATS_FILTER_COPY.paceLabel}>
        <Link
          href={to({ ...filter, pace: undefined })}
          aria-current={filter.pace === undefined ? "true" : undefined}
          className={`${BUTTON} ${filter.pace === undefined ? ON : OFF}`}
          data-testid="seat-pace-any"
        >
          {OPEN_SEATS_FILTER_COPY.anyPace}
        </Link>
        {MOVE_TIME_OPTIONS.map((ms) => (
          <Link
            key={ms ?? "none"}
            href={to({ ...filter, pace: ms })}
            aria-current={filter.pace === ms ? "true" : undefined}
            className={`${BUTTON} ${filter.pace === ms ? ON : OFF}`}
            data-testid={`seat-pace-${ms ?? "none"}`}
          >
            {describeMoveTime(ms)}
          </Link>
        ))}
      </nav>

      <nav className="flex flex-wrap gap-1" aria-label={OPEN_SEATS_FILTER_COPY.ratingLabel}>
        {SEAT_RATING_LIST.map((rating) => (
          <Link
            key={rating}
            href={to({ ...filter, rating })}
            aria-current={filter.rating === rating ? "true" : undefined}
            className={`${BUTTON} ${filter.rating === rating ? ON : OFF}`}
            data-testid={`seat-rating-${rating}`}
            title={rating === SEAT_RATING.unrated ? OPEN_SEATS_FILTER_COPY.unratedHint : undefined}
          >
            {RATING_DISPLAY[rating]}
          </Link>
        ))}
      </nav>

      <nav className="flex flex-wrap gap-1" aria-label={OPEN_SEATS_FILTER_COPY.penaltyLabel}>
        {SEAT_PENALTY_LIST.map((penalty) => (
          <Link
            key={penalty}
            href={to({ ...filter, penalty })}
            aria-current={filter.penalty === penalty ? "true" : undefined}
            className={`${BUTTON} ${filter.penalty === penalty ? ON : OFF}`}
            data-testid={`seat-penalty-${penalty}`}
          >
            {penaltyLabel(penalty)}
          </Link>
        ))}
      </nav>

      <p className="text-xs text-muted" data-testid="open-seats-count">
        {shown === total ? `${total} waiting` : `${shown} of ${total} waiting`}
      </p>
    </div>
  );
}
