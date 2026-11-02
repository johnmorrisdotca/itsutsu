"use client";

import { useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { YACHT_DICE, YACHT_FEWEST_ALONE, YACHT_MOST_PLAYERS } from "@/lib/party/yacht/yacht.constants";
import { startYacht } from "@/lib/party/yacht/yacht";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";
import { PARTY_NAME_MOST, computerNumberName } from "@/lib/party/partyNames";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { freshSeed } from "@/lib/puzzles/random";

import { usePartyMarbles } from "../partyMarbles";
import { SeatColourButton } from "../SeatColourButton";
import { DiceTray } from "./DiceTray";
import { YachtSheet } from "./YachtSheet";
import { partyScreenWords, seatColourName, yachtWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

const COUNTS = Array.from({ length: YACHT_MOST_PLAYERS - YACHT_FEWEST_ALONE + 1 }, (_, at) => YACHT_FEWEST_ALONE + at);
const BLANK = new Array<number>(YACHT_DICE).fill(0);
const NONE = new Array<boolean>(YACHT_DICE).fill(false);

/**
 * THE TABLE, BEFORE THE FIRST ROLL: how many are playing — one alone, up to
 * eight — and who they are, a person or a computer in each seat. Beside it the
 * live tray and sheet for that table, drawn with nothing to press: every
 * set-up preview on this site is the board itself.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): all eight
 * seats' rows are always laid out, those nobody sits in kept invisible, and
 * the sheet's rows are the same thirteen whoever is at the table.
 */
export function YachtSetUp({ appearance, onStart, ready }: { appearance: Appearance; onStart: (game: YachtGame) => void; ready: { "data-ready": string } }) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const YACHT_COPY = yachtWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [count, setCount] = useState(PARTY_SPECS.yacht.defaultPlayers);
  const [names, setNames] = useState<string[]>(() => new Array<string>(YACHT_MOST_PLAYERS).fill(""));
  // The first seat is whoever holds the device; the rest open as computers, so one person can start a game at once.
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: YACHT_MOST_PLAYERS }, (_, seat) => seat > 0));
  // Alone is a person alone: a sheet a computer fills by itself is nothing to play.
  const seated = (seed: number) => startYacht(names.slice(0, count), seed, count === 1 ? [false] : computers.slice(0, count))!;
  const preview = seated(1);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-3" data-testid="yacht-preview">
        <DiceTray dice={BLANK} held={NONE} rolled={NONE} rollKey={0} appearance={appearance} label={YACHT_COPY.rollFirst} />
        <YachtSheet game={preview} />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="yacht-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(seated(freshSeed()));
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{YACHT_COPY.howMany}</legend>
          <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label={YACHT_COPY.howMany}>
            {COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={option === count}
                onClick={() => setCount(option)}
                data-testid="yacht-count"
                data-count={option}
                className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className={`min-h-5 text-xs text-muted ${count > 1 ? "invisible" : ""}`}>{YACHT_COPY.alone}</p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{YACHT_COPY.seats}</legend>
          {names.map((name, seat) => {
            if (seat >= count) return null;
            const computer = count > 1 && computers[seat];
            return (
              <div key={seat} className="flex items-center gap-2 text-sm" data-testid="yacht-seat" data-seat={seat}>
                <SeatColourButton player={seat} playing={count} />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">
                    {seatColourName(say, seat, marbles[seat])}
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={PARTY_NAME_MOST}
                    placeholder={computer ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1)}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="yacht-name"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={computer}
                  disabled={count === 1}
                  onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                  className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold disabled:opacity-50 ${computer ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  title={YACHT_COPY.computerHelp}
                  data-testid="yacht-computer"
                >
                  {YACHT_COPY.computer}
                </button>
              </div>
            );
          })}
        </fieldset>

        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="yacht-start">
          {PARTY_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
      </form>
    </div>
  );
}
