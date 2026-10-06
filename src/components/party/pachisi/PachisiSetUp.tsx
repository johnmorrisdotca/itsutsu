"use client";

import { useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PACHISI_FEWEST, PACHISI_MOST } from "@/lib/party/pachisi/pachisi.constants";
import { startPachisi } from "@/lib/party/pachisi/pachisi";
import type { PachisiGame } from "@/lib/party/pachisi/pachisi.types";
import { PARTY_NAME_MOST, computerNumberName } from "@/lib/party/partyNames";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { freshSeed } from "@/lib/puzzles/random";

import { usePartyMarbles } from "../partyMarbles";
import { SeatColourButton } from "../SeatColourButton";
import { PachisiBoard } from "./PachisiBoard";
import { pachisiWords, partyScreenWords, seatColourName } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { playerNumberName } from "@/lib/gomoku/seatWords";

const COUNTS = Array.from({ length: PACHISI_MOST - PACHISI_FEWEST + 1 }, (_, at) => PACHISI_FEWEST + at);

/**
 * THE TABLE, BEFORE THE FIRST THROW: how many are playing, two to four, and
 * who — a person or a computer in each seat. Beside it the live board for that
 * table, its seated arms in their colours, with nothing to press. All four
 * seats' rows are always laid out, those nobody sits in kept invisible, so
 * nothing changes height when the number changes.
 */
export function PachisiSetUp({ appearance, onStart, ready }: { appearance: Appearance; onStart: (game: PachisiGame) => void; ready: { "data-ready": string } }) {
  const say = useSpeaker();
  const PACHISI_COPY = pachisiWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const marbles = usePartyMarbles();
  const [count, setCount] = useState(PARTY_SPECS.pachisi.defaultPlayers);
  const [names, setNames] = useState<string[]>(() => new Array<string>(PACHISI_MOST).fill(""));
  // The first seat is whoever holds the device; the rest open as computers, so one person can start a game at once.
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: PACHISI_MOST }, (_, seat) => seat > 0));
  const seated = (seed: number) => startPachisi(names.slice(0, count), seed, computers.slice(0, count))!;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="pachisi-preview">
        <PachisiBoard game={seated(1)} appearance={appearance} />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="pachisi-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(seated(freshSeed()));
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PACHISI_COPY.howMany}</legend>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={PACHISI_COPY.howMany}>
            {COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={option === count}
                onClick={() => setCount(option)}
                data-testid="pachisi-count"
                data-count={option}
                className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PACHISI_COPY.seats}</legend>
          {names.map((name, seat) => {
            if (seat >= count) return null;
            return (
              <div key={seat} className="flex items-center gap-2 text-sm" data-testid="pachisi-seat" data-seat={seat}>
                <SeatColourButton player={seat} playing={count} />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">
                    {seatColourName(say, seat, marbles[seat])}
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={PARTY_NAME_MOST}
                    placeholder={computers[seat] ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1)}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="pachisi-name"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={computers[seat]}
                  onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                  className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  title={PACHISI_COPY.computerHelp}
                  data-testid="pachisi-computer"
                >
                  {PACHISI_COPY.computer}
                </button>
              </div>
            );
          })}
        </fieldset>

        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="pachisi-start">
          {PARTY_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
      </form>
    </div>
  );
}
