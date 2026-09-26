import { ViewTabs } from "@/components/ui/ViewTabs";

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
    // On My games since 2026-09-24, beside the games the reader has going.
    return `${query === "" ? "/play" : `/play?${query}`}#open-seats`;
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="open-seats-filters">
      {/* Three choices of what the noticeboard lists, each a row of tabs (`ViewTabs`). */}
      <ViewTabs
        label={OPEN_SEATS_FILTER_COPY.paceLabel}
        items={[
          { key: "any", href: to({ ...filter, pace: undefined }), current: filter.pace === undefined, testId: "seat-pace-any", label: OPEN_SEATS_FILTER_COPY.anyPace },
          ...MOVE_TIME_OPTIONS.map((ms) => ({
            key: String(ms ?? "none"),
            href: to({ ...filter, pace: ms }),
            current: filter.pace === ms,
            testId: `seat-pace-${ms ?? "none"}`,
            label: describeMoveTime(ms),
          })),
        ]}
      />
      <ViewTabs
        label={OPEN_SEATS_FILTER_COPY.ratingLabel}
        items={SEAT_RATING_LIST.map((rating) => ({
          key: rating,
          href: to({ ...filter, rating }),
          current: filter.rating === rating,
          testId: `seat-rating-${rating}`,
          title: rating === SEAT_RATING.unrated ? OPEN_SEATS_FILTER_COPY.unratedHint : undefined,
          label: RATING_DISPLAY[rating],
        }))}
      />
      <ViewTabs
        label={OPEN_SEATS_FILTER_COPY.penaltyLabel}
        items={SEAT_PENALTY_LIST.map((penalty) => ({
          key: penalty,
          href: to({ ...filter, penalty }),
          current: filter.penalty === penalty,
          testId: `seat-penalty-${penalty}`,
          label: penaltyLabel(penalty),
        }))}
      />

      <p className="text-xs text-muted" data-testid="open-seats-count">
        {shown === total ? `${total} waiting` : `${shown} of ${total} waiting`}
      </p>
    </div>
  );
}
