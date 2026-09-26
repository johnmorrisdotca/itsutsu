"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, INPUT_CLASS, SECTION_TITLE, SELECT_CLASS, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { dayLabel, monthLabel } from "@/lib/puzzles/dailyWords/dailyDay";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { DailyArchiveTableProps } from "./dailyWords.types";

/**
 * The past days' words, a table a week, with a month to choose and a search
 * over what is listed.
 *
 * The month is part of the address (`?month=2026-10`, or `all`): a form that
 * works before the page has hydrated, sent as soon as the choice changes once
 * it has. The search is in the browser alone, over the days the server has
 * already sent — no search endpoint, nothing asked of the server as it is
 * typed — and matches a word or any part of a date ("2026-10", "Oct", "Sat").
 */
export function DailyArchiveTable({ sizes, weeks, months, month, unit }: DailyArchiveTableProps) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const wanted = search.trim().toLowerCase();

  const shown = useMemo(() => {
    if (wanted === "") return weeks;
    return weeks
      .map((week) => ({
        ...week,
        days: week.days.filter(
          (row) => row.day.includes(wanted) || dayLabel(row.day).toLowerCase().includes(wanted) || row.words.some((each) => each.word.toLowerCase().includes(wanted)),
        ),
      }))
      .filter((week) => week.days.length > 0);
  }, [weeks, wanted]);

  return (
    <div className="flex flex-col gap-4" data-testid="daily-archive" {...readyMark(hydrated)}>
      <div className="flex flex-wrap items-end gap-3">
        <form method="get" className="flex items-end gap-2" data-testid="daily-month-form">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Month
            <select
              name="month"
              defaultValue={month}
              className={SELECT_CLASS}
              data-testid="daily-month"
              onChange={(event) => router.push(`?month=${encodeURIComponent(event.target.value)}`)}
            >
              {months.map((each) => (
                <option key={each} value={each}>
                  {monthLabel(each)}
                </option>
              ))}
              <option value="all">Every month</option>
            </select>
          </label>
          {/* Only needed before the page has come alive; after that the choice goes as soon as it is made. */}
          {hydrated ? null : (
            <button type="submit" className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
              Show
            </button>
          )}
        </form>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
          Search these days
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="A word or a date"
            className={INPUT_CLASS}
            data-testid="daily-search"
          />
        </label>
      </div>

      {weeks.length === 0 ? (
        <EmptyWeek sizes={sizes} unit={unit} line="No day has passed yet. The first day's words are listed here the day after it." />
      ) : shown.length === 0 ? (
        <EmptyWeek sizes={sizes} unit={unit} line={`No day listed here has "${search.trim()}". Try another month, or every month.`} />
      ) : (
        shown.map((week) => (
          <section key={week.monday} className="flex flex-col gap-1" data-testid="daily-week" data-monday={week.monday}>
            <h2 className={SECTION_TITLE}>Week of {dayLabel(week.monday)}</h2>
            <div className={TABLE_SCROLL}>
              <table className="w-full text-sm">
                <Head sizes={sizes} unit={unit} />
                <tbody>
                  {week.days.map((row) => (
                    <tr key={row.day} className="border-t border-rule" data-testid="daily-day" data-day={row.day}>
                      {/* The day leads to its own page: its words and the fastest to find each. */}
                      <td className="py-1 pr-2 whitespace-nowrap tabular-nums">
                        <Link href={row.dayHref} title={`${dayLabel(row.day)}: the fastest finds`} className="underline decoration-rule-strong underline-offset-2 hover:decoration-ink" data-testid="daily-day-fastest">
                          {/* The week's heading carries the year. */ dayLabel(row.day, false)}
                        </Link>
                      </td>
                      {sizes.map((size) => {
                        const word = row.words.find((each) => each.size === size);
                        return (
                          <td key={size} className="py-1 pr-2 whitespace-nowrap">
                            {word === undefined ? (
                              <span className="text-muted">—</span>
                            ) : (
                              <Link href={word.href} className="font-semibold tracking-wide underline-offset-2 hover:underline" data-testid="daily-word" data-size={size}>
                                {word.word}
                              </Link>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Head({ sizes, unit }: { sizes: readonly number[]; unit: "letters" | "kana" }) {
  return (
    <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
      <tr>
        <th className="py-1 pr-2 text-left">Day</th>
        {sizes.map((size) => (
          <th key={size} className="py-1 pr-2 text-left">
            {size} {unit}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** An empty table keeps its headings and says why it is empty. */
function EmptyWeek({ sizes, unit, line }: { sizes: readonly number[]; unit: "letters" | "kana"; line: string }) {
  return (
    <div className={TABLE_SCROLL} data-testid="daily-empty">
      <table className="w-full text-sm">
        <Head sizes={sizes} unit={unit} />
        <tbody>
          <tr className="border-t border-rule">
            <td colSpan={sizes.length + 1} className="py-2 text-muted">
              {line}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
