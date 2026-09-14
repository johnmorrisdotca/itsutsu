import { PlayerName } from "@/components/players/PlayerName";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { xpDayKey } from "@/lib/xp/xpDay";

import { LevelName } from "./LevelName";
import type { PromotionsTableProps } from "./promotions.types";

/**
 * WHO WENT UP A LEVEL, AS A TABLE: who, from which rung to which, and when.
 *
 * The same five class strings every table of players on the site uses, from
 * `PlayerRecord.tsx`, so the columns sit like the leaderboard's one page over.
 * Not `RecordTable`, for the reason `Leaderboard.tsx` gives: these rows share
 * the subject with a table of records and not one figure.
 *
 * **Both rungs are links**, through `LevelName`, to the level's own page — a rung
 * named with nothing behind it is the dead end this site has a gate about, and
 * the page a reader wants from "Lv 18 · King Me" is what King Me is and who else
 * stands there.
 *
 * **The day is the one the total crossed, and a backfilled line says so.** A
 * promotion the 2026-09-13 replay paid is dated by the replay, which is when the
 * total moved, with the day of the play beside it — never presented as though it
 * had been earned on the day the replay ran. See `promotions.ts`.
 */
export function PromotionsTable({ items, viewerId, viewerZone, empty }: PromotionsTableProps) {
  return (
    <div className="overflow-x-auto" data-testid="promotions">
      <table className={TABLE_CLASS}>
        <thead className={TABLE_HEAD_CLASS}>
          <tr>
            <th className={HEAD} scope="col">
              Member
            </th>
            <th className={HEAD} scope="col">
              Promotion
            </th>
            <th className={HEAD} scope="col">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            /* The headings stay whether or not anybody is under them: an empty table is data. */
            <tr className={ROW_CLASS}>
              <td className="py-3 pr-3 text-sm" colSpan={3} data-testid="promotions-empty">
                {empty}
              </td>
            </tr>
          ) : (
            items.map((promotion) => {
              const you = promotion.memberId === viewerId;
              const climbed = promotion.to - promotion.from;
              return (
                <tr
                  key={`${promotion.memberId}-${promotion.at.getTime()}`}
                  className={`${ROW_CLASS} ${you ? "bg-moss-soft" : ""}`.trim()}
                  aria-current={you ? "true" : undefined}
                  data-testid="promotion"
                  data-member={promotion.memberId}
                  data-from={promotion.from}
                  data-to={promotion.to}
                >
                  <td className="py-1.5 pr-3">
                    <PlayerName name={promotion.name} memberId={promotion.memberId} fallback="A member with no name yet" />
                    {you ? <span className="ml-2 text-[0.65rem] tracking-wide text-moss uppercase">You</span> : null}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span className="inline-flex flex-wrap items-baseline gap-x-2">
                      <LevelName level={promotion.from} testId="promotion-from" />
                      <span aria-hidden className="text-muted">
                        →
                      </span>
                      <span className="sr-only">to</span>
                      <LevelName level={promotion.to} testId="promotion-to" />
                    </span>
                    {/* One award over several rungs is one line, and it says how many. */}
                    {climbed > 1 ? (
                      <span className="ml-2 text-xs text-muted" data-testid="promotion-several">
                        {climbed} levels at once
                      </span>
                    ) : null}
                  </td>
                  <td className={`${CELL} text-muted`}>
                    {/* Written out by the server in the reader's zone, as the leaderboard's Last earned is. */}
                    {/* One line: a day broken at its hyphen on a phone reads as two figures. */}
                    <time dateTime={promotion.at.toISOString()} className="whitespace-nowrap">
                      {xpDayKey(promotion.at, viewerZone)}
                    </time>
                    {promotion.paidLater !== null ? (
                      <span className="block text-xs" data-testid="promotion-backfilled">
                        Backfilled, for play on {promotion.paidLater}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
