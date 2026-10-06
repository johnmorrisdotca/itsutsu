"use client";

import { useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "@/components/ui/Link";
import { PressLabel } from "@/components/ui/PressLabel";
import { PLAY_BUTTON } from "@/components/ui/ui.constants";
import { AWASE_TABLE, SEAT_WINDS, readTable } from "@johnmorrisdotca/jarajara/table";
import type { AwaseSeat, AwaseTable, AwaseTableState } from "@johnmorrisdotca/jarajara/table";

import { windIn, windName, mahjongSeatName } from "./cardWords";
import { ComputerMark } from "./KumimojiDeskParts";
import { tableAddress, useKeptMahjongTable } from "./mahjongTableKept";

/**
 * WHO SITS AT THE TABLE, before the first pair: a seat for each player the
 * set-up asked for, east first, each a name typed here or a computer. The
 * names stay in this browser. At least one seat is a person's.
 */
export function MahjongTableNames({ players, replacing, onBegin }: { players: number; replacing: AwaseTable | null; onBegin: (seats: AwaseSeat[]) => void }) {
  const say = useSpeaker();
  // One person and the rest computers, the usual way to sit down alone; any seat can be changed.
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: players }, (_, at) => at > 0));
  const nobody = computers.every(Boolean);
  return (
    <form
      className="flex flex-col gap-3"
      data-testid="mahjong-table-names"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onBegin(computers.map((computer, at) => (computer ? { name: "", computer: true } : { name: String(form.get(`seat-${at}`) ?? "") })));
      }}
    >
      <div className="flex flex-col gap-2">
        {computers.map((computer, at) => (
          <div key={at} className="flex items-center gap-2" data-testid="mahjong-table-seat" data-at={at}>
            <span className="w-7 shrink-0 text-center font-mincho text-lg" title={say.say("pcard.mj.seatTitle", { wind: windName(say, at) })}>
              {SEAT_WINDS[at]!.kanji}
            </span>
            {computer ? (
              <span className="flex-1 py-1.5 text-sm text-muted">{say.say("pcard.mj.computerPlays", { wind: windIn(say, at) })}</span>
            ) : (
              <input
                name={`seat-${at}`}
                placeholder={windName(say, at)}
                maxLength={AWASE_TABLE.nameMost}
                autoComplete="off"
                aria-label={say.say("pcard.mj.seatNameAria", { wind: windIn(say, at) })}
                className="min-w-0 flex-1 rounded border border-rule bg-paper px-2 py-1.5 text-ink"
                data-testid="mahjong-table-name"
              />
            )}
            <button
              type="button"
              aria-pressed={computer}
              aria-label={say.say("pcard.mj.computerPlays", { wind: windIn(say, at) })}
              className={`flex min-h-11 shrink-0 items-center rounded-full border px-1 ${computer ? "border-ochre bg-ochre-soft" : "border-transparent opacity-60 hover:opacity-100"}`}
              onClick={() => setComputers((now) => now.map((one, seat) => (seat === at ? !one : one)))}
              data-testid="mahjong-table-computer"
            >
              <ComputerMark />
            </button>
          </div>
        ))}
      </div>
      {replacing === null ? null : (
        <p className="text-sm text-muted" data-testid="mahjong-table-replacing">
          {say.say("pcard.mj.replacing")}{say.locale === "ja" ? "" : " "}
          <Link href={tableAddress(replacing)} className="underline underline-offset-2">
            {say.say("pkumi.party.continueThat")}
          </Link>
          .
        </p>
      )}
      <p className="min-h-5 text-sm text-muted">{nobody ? say.say("pcard.mj.nobody") : ""}</p>
      <button type="submit" className={PLAY_BUTTON} disabled={nobody} data-testid="mahjong-table-begin">
        <PressLabel words={say.say("pcard.mj.start")} kanji="始" />
      </button>
    </form>
  );
}

/** Every seat's points and pairs, the seat to move marked, and the winners once it is over. */
export function MahjongScores({ table, state }: { table: AwaseTable; state: AwaseTableState }) {
  const say = useSpeaker();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="mahjong-scores" aria-label={say.say("pcard.mj.pointsAria")}>
      {table.seats.map((seat, at) => {
        const turn = !state.over && state.turn === at;
        const won = state.over && state.winners.includes(at);
        return (
          <li
            key={at}
            className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 ${turn ? "border-ink bg-ivory" : won ? "border-ochre bg-ochre-soft" : "border-rule"}`}
            data-testid="mahjong-score"
            data-at={at}
            data-turn={turn ? "true" : "false"}
            data-won={won ? "true" : "false"}
            data-points={state.scores[at]}
          >
            <span className="font-mincho text-lg" aria-hidden="true">
              {SEAT_WINDS[at]!.kanji}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="flex min-w-0 items-center gap-1 text-sm font-semibold">
                <span className="truncate">{mahjongSeatName(say, table.seats, at)}</span>
                {seat.computer === true ? <ComputerMark /> : null}
              </span>
              <span className="text-xs text-muted">
                {say.count("count.pair", state.pairs[at])}
              </span>
            </span>
            <span className="text-lg font-semibold tabular-nums">{state.scores[at]}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * "CONTINUE THE TABLE GAME", on Mahjong's set-up screen, while this browser
 * keeps one half played: the table's answer to the Resume a solo run has there.
 */
export function MahjongTableResume() {
  const say = useSpeaker();
  const [table] = useKeptMahjongTable();
  const state = table === null || table === undefined ? null : readTable(table);
  if (table === null || table === undefined || state === null || state.over) return null;
  return (
    <Link href={tableAddress(table)} className={PLAY_BUTTON} data-testid="mahjong-table-continue">
      <PressLabel words={say.say("pcard.mj.continueGame")} kanji="続" />
    </Link>
  );
}
