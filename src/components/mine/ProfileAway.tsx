import { INPUT_CLASS } from "@/components/ui/ui.constants";
import { MOST_DAYS_OFF, WEEKDAYS, WEEKDAY_DISPLAY } from "@/lib/social/daysOff";

import { PROFILE_WIDTH } from "./mine.constants";
import type { ProfileSectionProps } from "./profileForm.types";

/**
 * WHEN YOUR DEADLINES WAIT: the one holiday, and the standing days off.
 *
 * Split out of `ProfileForm.tsx` when it reached the file-size gate — see that
 * file for why the form reads as three groups. The fields are the form's, and
 * this section changes them only through `set`, exactly as it did inline.
 */
export function ProfileAway({ fields, set }: ProfileSectionProps) {
  const away = fields.awayFrom !== "" || fields.awayUntil !== "";

  return (
    <>
      {/*
        WHEN YOUR DEADLINES WAIT. One holiday out of a small yearly allowance,
        and the days of the week that hold every week for ever — the same
        question asked twice, which is why they are one group and why the
        second one's note says what it does not cost.
      */}
      <div className="flex flex-col gap-4">
        <fieldset className="flex min-w-0 flex-col gap-1">
          <legend className="text-sm">
            Away <span className="font-mincho text-xs opacity-70">休暇</span>
          </legend>
          {/*
            Two dates and the word between them on ONE row, each sized to a
            date. The pair is a `w-full` block with a cap on it so the row can
            never break in the middle and leave "to" stranded on a line of its
            own, which is what it did; "clear" is outside the pair and may wrap
            under it, because a third control is not part of the range.

            `min-w-0` — on the fieldset, on the pair — and `flex-1` on each
            date are what make that promise hold on a small phone rather than
            only on a laptop. Nothing shrinks below its own content unless it
            is told it may, and a FIELDSET is the worst offender: browsers give
            it `min-inline-size: min-content`, which Tailwind's reset leaves
            alone, so it will not narrow for anything. Measured at 320px wide:
            the fieldset stood at 299px inside a 254px column and pushed the
            whole PAGE sideways, which turned "the dates are on one row" into a
            horizontal scrollbar. With these the two dates divide whatever the
            column has, up to the cap.

            The dates are labelled for a screen reader rather than by the words
            on screen — "to" between two boxes is a picture of a range, not a
            name for either end of it, so it is spoken by neither.
          */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex w-full min-w-0 max-w-[20rem] items-center gap-2">
              <label htmlFor="away-from" className="sr-only">
                Away from
              </label>
              <input
                id="away-from"
                type="date"
                value={fields.awayFrom}
                onChange={(e) => set({ awayFrom: e.target.value })}
                className={`${INPUT_CLASS} ${PROFILE_WIDTH.date} min-w-0 flex-1`}
                data-testid="away-from"
              />
              <span aria-hidden="true" className="shrink-0 text-xs text-muted">
                to
              </span>
              <label htmlFor="away-until" className="sr-only">
                Away until
              </label>
              <input
                id="away-until"
                type="date"
                value={fields.awayUntil}
                onChange={(e) => set({ awayUntil: e.target.value })}
                className={`${INPUT_CLASS} ${PROFILE_WIDTH.date} min-w-0 flex-1`}
                data-testid="away-until"
              />
            </span>
            {away ? (
              <button type="button" onClick={() => set({ awayFrom: "", awayUntil: "" })} className="text-xs text-muted underline underline-offset-4">
                clear
              </button>
            ) : null}
          </div>
          <span className="text-xs text-muted">
            While you are away, deadlines in your games wait, except in games set up to ignore vacation days. Three days a
            year, whole days.
          </span>
        </fieldset>
        {/*
          Standing, unlike the away range above it: these cost nothing from the
          yearly allowance and hold every week, for ever.
        */}
        <fieldset className="flex min-w-0 flex-col gap-1">
          <legend className="text-sm">Days I do not play</legend>
          <div className="mt-1 flex flex-wrap gap-1.5" data-testid="days-off">
            {WEEKDAYS.map((day) => {
              const chosen = fields.daysOff.includes(day);
              const full = !chosen && fields.daysOff.length >= MOST_DAYS_OFF;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={full}
                  aria-pressed={chosen}
                  title={WEEKDAY_DISPLAY[day].label}
                  data-testid={`day-off-${day}`}
                  onClick={() =>
                    set({
                      daysOff: chosen
                        ? fields.daysOff.filter((other) => other !== day)
                        : [...fields.daysOff, day].sort((a, b) => a - b),
                    })
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    chosen ? "border-moss bg-moss-soft text-ink" : "border-rule hover:bg-shade"
                  }`}
                >
                  {WEEKDAY_DISPLAY[day].short}{" "}
                  <span className="font-mincho opacity-70">{WEEKDAY_DISPLAY[day].kanji}</span>
                </button>
              );
            })}
          </div>
          <span className="text-xs text-muted">
            Deadlines in games that honour vacation step over these every week, and they cost nothing from your
            away days. Somebody has to play on some day, so six is the most you can take.
          </span>
        </fieldset>
      </div>
    </>
  );
}
