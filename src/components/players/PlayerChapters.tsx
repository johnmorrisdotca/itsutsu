import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { PlayerXpHistory } from "@/components/xp/PlayerXpHistory";
import { XP_HISTORY_TAB } from "@/lib/xp/xpHistoryDays";

import { ItsutsuRecord } from "./ItsutsuRecord";
import { KEPT_RECORD_COPY } from "./LegacyRecord";
import { LegacySourcePanel } from "./LegacySource";
import { WholeRecordPanel } from "./WholeRecord";
import type { PlayerChaptersProps } from "./playerPage.types";

/**
 * EVERYTHING BELOW A PLAYER'S HEADER: the record added up across every site,
 * the tabs, and the chapter the tabs have open.
 *
 * Split out of `src/app/players/[slug]/page.tsx` when that page reached the
 * file-size gate. The header — the name, the record figures and the standing
 * under them — stays on the page, where `xpColumn.coverage.test.ts` and
 * `recordLevel.coverage.test.ts` read it; this is the part of the page that
 * reads down from there, and every decision it draws was made by the page.
 */
export function PlayerChapters({
  slug,
  whole,
  showWholeFigures,
  wholeName,
  member,
  tabs,
  open,
  shown,
  earner,
  reader,
  asked,
  record,
  opponents,
  gifts,
  keptRecord,
  askable,
}: PlayerChaptersProps) {
  return (
    <>
      {/*
        Everything they have played, wherever they played it — beside the
        tabs rather than instead of them, so a life of playing shows as one
        figure and still breaks down into where each part came from.
      */}
      {whole.figures.played > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
          <WholeRecordPanel
            whole={whole}
            name={wholeName}
            memberId={member?.id}
            showFigures={showWholeFigures}
          />
        </section>
      ) : null}

      <Tabs tabs={tabs} active={open} base={`/players/${slug}`} label="Where this player's record was kept, and how their XP was earned" />

      {earner !== null && open === XP_HISTORY_TAB ? (
        <PlayerXpHistory memberId={earner} isYou={earner === reader.memberId} asked={asked} at={`/players/${slug}`} />
      ) : shown === null ? (
        <>
          <ItsutsuRecord
            name={wholeName}
            memberId={member?.id}
            record={record}
            opponents={opponents}
            gifts={gifts}
            /*
             * "No games yet" is the wrong word about somebody who has died,
             * in the one place it would be noticed. Their own wording says
             * this record was made elsewhere and is kept rather than added to.
             */
            emptyNote={keptRecord === null ? undefined : KEPT_RECORD_COPY[keptRecord.kind]?.here}
          />
          {/*
            The second way in, and the one somebody actually uses. A profile is
            read downwards — the figures, then the games, then how each went —
            and by the end the buttons at the top are off the screen. The
            decision is made here, so the offer belongs here; the elder sites
            put an invitation beside a player's games for the same reason.

            Only where there is a record to have read. On a page with no games
            the question answers itself, and the two offers sit an inch apart —
            one offer too many, about nothing.
          */}
          {askable && record.games > 0 ? (
            <p className="flex flex-wrap items-center gap-3 text-sm text-muted" data-testid="ask-after-record">
              Seen enough?{" "}
              {/*
                ONE OFFER, TWO WORDINGS. It was two components because a game
                against a program had to be asked for by id and a game against a
                person by address — and that was never a real difference, only
                the shape the creation route happened to take. Everything is
                asked for by id now, so the branch is a choice of words: "Play"
                is right about something that answers at once, and asking a
                person for a game is asking.

                And it leads to the setup screen rather than into a game, which
                is the whole of this change and the very button John was looking
                at when he asked for it a third time.
              */}
              {member === undefined || member === null ? null : (
                <ChallengeButton
                  memberId={member.id}
                  label={member.botTier ? "Play 対局" : "Ask for a game 対局を申し込む"}
                />
              )}
            </p>
          ) : null}
        </>
      ) : (
        <LegacySourcePanel legacy={shown.legacy} source={shown.source} keptFor={shown.legacy.slug} />
      )}
    </>
  );
}
