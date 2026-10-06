import { ViewTabs } from "@/components/ui/ViewTabs";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";

import { penaltyName } from "@/components/live/penalty";
import { describeMoveTime } from "@/lib/history/deadline";
import { MOVE_TIME_OPTIONS } from "@/lib/history/moveTime.constants";
import {
  SEAT_PENALTY_LIST,
  SEAT_RATING,
  SEAT_RATING_LIST,
  openSeatQuery,
  type OpenSeatFilter,
  type SeatPenaltyFilter,
  type SeatRatingBand,
} from "@/lib/history/openSeatsFilter";
import { openSeatsFilterCopy } from "./mine.copy";


const ratingDisplay = (say: Speaker): Record<SeatRatingBand, string> => {
  const copy = openSeatsFilterCopy(say);
  return { [SEAT_RATING.any]: copy.anyRating, [SEAT_RATING.under]: copy.under, [SEAT_RATING.over]: copy.over, [SEAT_RATING.unrated]: copy.unrated };
};

function penaltyLabel(penalty: SeatPenaltyFilter, say: Speaker): string {
  return penalty === "any" ? openSeatsFilterCopy(say).anyPenalty : penaltyName(penalty, say);
}

export async function OpenSeatsFilters({
  filter,
  shown,
  total,
}: {
  filter: OpenSeatFilter;
  shown: number;
  total: number;
}) {
  const say = await currentSpeaker();
  const OPEN_SEATS_FILTER_COPY = openSeatsFilterCopy(say);
  const RATING_DISPLAY = ratingDisplay(say);
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
            label: describeMoveTime(ms, say),
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
          label: penaltyLabel(penalty, say),
        }))}
      />

      <p className="text-xs text-muted" data-testid="open-seats-count">
        {shown === total ? say.say("mine.waitingAll", { total: say.number(total) }) : say.say("mine.waitingSome", { shown: say.number(shown), total: say.number(total) })}
      </p>
    </div>
  );
}
