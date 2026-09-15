import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { countText } from "@/lib/rating/figures";
import { playerXpHistory } from "@/lib/xp/playerXpHistory";
import { xpParamsFrom } from "@/lib/xp/xpHistory";
import { XP_HISTORY_ANCHOR, XP_HISTORY_CURSOR_PARAM, xpHistoryHref } from "@/lib/xp/xpHistoryDays";
import type { XpHistoryEntry } from "@/lib/xp/xpHistory.types";

import { AwardAbout } from "./AwardAbout";
import { ABOUT_ON_A_DESK } from "./xp.constants";
import type { AwardWhose, PlayerXpHistoryProps } from "./xp.types";

/**
 * HOW A PLAYER'S XP WAS EARNED, ON THEIR OWN PAGE.
 *
 * John, 2026-09-14: "I am on my profile page and there is NO indication how I
 * got my XP. where is the XP history!!!!!" The standing at the top of a player's
 * page says the total and the level; this is the evidence under it — every
 * award, newest first, in runs of days with the day's whole total, and beside
 * each award the total it left them on.
 *
 * WHO MAY READ IT is whoever may read the record on the same page, and nothing
 * here decides that: `/players/*` is shut to a signed-out reader by
 * `src/proxy.ts` before this renders (`e2e/gate.spec.ts`, "but nothing else
 * opened by accident"), and every signed-in reader sees a player's record.
 * Programs have a history like anyone — the read never asks what kind of member
 * it has.
 *
 * Credit for another site's kept record is marked as such and linked nowhere:
 * there is no game here to open, which is the `here: false` exception, and the
 * row says where it came from in words.
 *
 * A LIST AND NOT A RecordTable, for `MyXp`'s reason: a ledger is none of the
 * record's figures. The look is shared through `PlayerRecord.tsx`'s classes.
 */
export async function PlayerXpHistory({ memberId, isYou, asked, at }: PlayerXpHistoryProps) {
  const raw = asked[XP_HISTORY_CURSOR_PARAM];
  const cursor = typeof raw === "string" && raw !== "" ? raw : null;
  const history = await playerXpHistory({ memberId, cursor });
  const params = xpParamsFrom(asked);
  const whose: AwardWhose = isYou ? "yours" : "theirs";

  return (
    <section id={XP_HISTORY_ANCHOR} className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="xp-history">
      <h2 className="flex items-baseline gap-2 text-base font-semibold">
        <Paired en="How the XP was earned" kanji="経験の記録" kanjiClassName="text-xs font-normal opacity-70" />
      </h2>
      <p className="max-w-prose text-xs text-muted">
        Every award, newest first, under the day it was earned — counted in{" "}
        {isYou ? "your" : "their"} own time zone. Total is where the whole stood once that award was
        counted, credit from other sites included.
      </p>

      <div className="overflow-x-auto">
        <table className={TABLE_CLASS} data-testid="xp-history-table">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th scope="col" className={HEAD}>For</th>
              {/* The phone folds About into the For cell — see ABOUT_ON_A_DESK. */}
              <th scope="col" className={`${HEAD} ${ABOUT_ON_A_DESK}`}>About</th>
              <th scope="col" className={HEAD}>XP</th>
              <th scope="col" className={HEAD} title="The whole total once this award was counted">
                Total
              </th>
            </tr>
          </thead>
          {history.days.length === 0 ? (
            /*
             * The shape, and the way in: an empty history is a true fact about
             * this player, and the headings above it show what will be kept.
             */
            <tbody>
              <tr className={ROW_CLASS}>
                <td colSpan={4} className="py-3 text-sm text-muted" data-testid="xp-history-empty">
                  {isYou ? (
                    <>
                      Nothing earned yet. Every game you finish earns XP, and so does every game here you
                      try for the first time.{" "}
                      <Link href="/games" className="underline underline-offset-4">
                        Pick a game and start earning
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Nothing earned here yet — each award will be listed here, day by day, as it arrives.{" "}
                      <Link href="/xp" className="underline underline-offset-4">
                        See where everyone stands
                      </Link>
                      .
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          ) : (
            history.days.map((day) => (
              /* One tbody per day, headed by the day and its whole total. */
              <tbody key={`${day.dayKey}-${day.entries[0].id}`} data-testid="xp-history-day" data-day={day.dayKey}>
                <tr className={ROW_CLASS}>
                  <th scope="rowgroup" colSpan={4} className="pt-3 pb-1 text-left text-xs font-semibold text-ink-soft">
                    <time dateTime={day.dayKey} data-testid="xp-history-day-key">
                      {day.dayKey}
                    </time>
                    {day.total === null ? null : (
                      <span className="ml-2 font-normal text-muted">
                        <span className="font-mono text-moss" data-testid="xp-history-day-total">
                          +{countText(day.total)}
                        </span>{" "}
                        that day
                      </span>
                    )}
                  </th>
                </tr>
                {day.entries.map((entry) => (
                  <Award key={entry.id} entry={entry} whose={whose} />
                ))}
              </tbody>
            ))
          )}
        </table>
      </div>

      {/*
        FORWARD AND BACK, both plain links with addresses: older awards, and the
        way back to today once a reader has gone looking. No polling — a history
        is read when the page is, like the record beside it.
      */}
      {history.next === null && cursor === null ? null : (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {history.next === null ? null : (
            <Link href={xpHistoryHref(at, params, history.next)} className="underline underline-offset-4" data-testid="xp-history-older">
              Older awards
            </Link>
          )}
          {cursor === null ? null : (
            <Link href={xpHistoryHref(at, params, null)} className="underline underline-offset-4" data-testid="xp-history-newest">
              Back to the newest
            </Link>
          )}
        </p>
      )}

      {history.skipped.unknownType > 0 ? (
        <p className="text-xs text-muted" data-testid="xp-history-skipped">
          {history.skipped.unknownType} award{history.skipped.unknownType === 1 ? "" : "s"} on this page
          were earned under a rule this version of the site cannot explain, and are not shown. The total
          still counts them.
        </p>
      ) : null}
    </section>
  );
}

/** One award: what for, what about, the points, and the total it left. */
function Award({ entry, whose }: { entry: XpHistoryEntry; whose: AwardWhose }) {
  return (
    <tr className={ROW_CLASS} data-testid="xp-history-award" data-elsewhere={entry.elsewhere ? "true" : "false"}>
      <td className="py-1.5 pr-3 align-top">
        <span className="font-semibold">
          <Paired en={entry.label} kanji={entry.kanji} kanjiClassName="ml-1 font-mincho text-[0.68rem] font-normal opacity-70" />
        </span>
        {entry.elsewhere ? (
          /*
           * `data-here="false"`: the decision that this row has nothing here to
           * open, made in the source — the same statement `of={{ here: false }}`
           * makes for a count from another site.
           */
          <span
            className="ml-2 rounded-sm bg-shade px-1 text-[0.65rem] tracking-wide text-muted uppercase"
            data-testid="xp-history-elsewhere"
            data-here="false"
            title="Credit for a record kept from another site. There is no game here to open."
          >
            From another site
          </span>
        ) : null}
        <span className="block text-xs text-muted">{entry.blurb}</span>
        {entry.about.of === "nobody" ? null : (
          <span className="mt-0.5 block sm:hidden">
            <AwardAbout about={entry.about} whose={whose} />
          </span>
        )}
      </td>
      <td className={`py-1.5 pr-3 align-top ${ABOUT_ON_A_DESK}`}>
        <AwardAbout about={entry.about} whose={whose} />
      </td>
      <td className={`${CELL} whitespace-nowrap align-top`} data-testid="xp-history-points">
        +{countText(entry.points)}
      </td>
      <td className={`${CELL} whitespace-nowrap align-top text-muted`} data-testid="xp-history-running">
        {countText(entry.runningTotal)}
      </td>
    </tr>
  );
}
