"use client";

import { useState, type ReactNode } from "react";
import { usePartyMarbles } from "./partyMarbles";
import { SeatColourButton } from "./SeatColourButton";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { TRAIN_DEFAULT_OPTIONS, trainSetName } from "@/lib/party/mexicanTrain/mexicanTrain.constants";
import { startTrain } from "@/lib/party/mexicanTrain/mexicanTrain";
import type { TrainOptions } from "@/lib/party/mexicanTrain/mexicanTrain.types";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { freshSeed } from "@/lib/puzzles/random";

import { PARTY_COPY, TRAIN_COPY } from "./party.constants";
import { TrainTable } from "./TrainTable";
import type { TrainSetUpProps } from "./train.types";

const SPEC = PARTY_SPECS.mexicanTrain;
const COUNTS = Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, at) => SPEC.fewestPlayers + at);

/** Two choices side by side, one chosen: a house rule's tiles, each the same size whichever is chosen. */
function Choice<K extends string>({
  legend,
  value,
  options,
  names,
  lines,
  testId,
  onChange,
}: {
  legend: string;
  value: K;
  options: readonly K[];
  names: Record<K, string>;
  lines: Record<K, string>;
  testId: string;
  onChange: (value: K) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{legend}</span>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={legend}>
        {options.map((option, at) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === value}
            onClick={() => onChange(option)}
            data-testid={testId}
            data-value={option}
            className={`flex h-28 min-w-0 flex-col items-start gap-0.5 rounded-lg border p-2 text-left sm:h-20 ${
              option === value ? "border-ink bg-rule/70" : "border-rule-strong bg-ivory hover:bg-rule/60"
            }`}
          >
            <span className="text-sm font-semibold">
              {names[option]}
              {at === 0 ? <span className="ml-1 text-xs font-normal text-muted">(default)</span> : null}
            </span>
            <span className="text-xs leading-snug text-muted">{lines[option]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * THE TABLE, BEFORE THE FIRST TILE: which set, how many are playing and who
 * they are — a person or a computer in each seat — and the house rules, each
 * opening on the most common published rule. Beside it the live table for
 * that set and that many, drawn `readOnly`: every set-up preview on this site
 * is the board itself.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the table
 * is a square whatever the number at it, every tile is one size, and all
 * eight seats' rows are always laid out, those nobody sits in kept invisible,
 * so choosing three rather than eight moves nothing below them.
 */
export function TrainSetUp({ appearance, onStart, ready }: TrainSetUpProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [set, setSet] = useState(SPEC.defaultSize);
  const [count, setCount] = useState(SPEC.defaultPlayers);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  // The first seat is whoever holds the device; the rest open as computers, so one person can start a game at once.
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: SPEC.mostPlayers }, (_, seat) => seat > 0));
  const [options, setOptions] = useState<TrainOptions>(TRAIN_DEFAULT_OPTIONS);
  const seats = (seed: number) => startTrain(set, names.slice(0, count), seed, options, computers.slice(0, count))!;
  const preview = seats(1);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="train-preview">
        <TrainTable game={preview} appearance={appearance} readOnly />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="train-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(seats(freshSeed()));
        }}
      >
        <Section legend={TRAIN_COPY.set}>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={TRAIN_COPY.set}>
            {SPEC.sizes.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={option === set}
                onClick={() => setSet(option)}
                data-testid="train-set"
                data-set={option}
                className={`flex h-36 min-w-0 flex-col items-start gap-1 rounded-lg border p-2 text-left sm:h-28 ${
                  option === set ? "border-ink bg-rule/70" : "border-rule-strong bg-ivory hover:bg-rule/60"
                }`}
              >
                <span className="text-sm font-semibold">{trainSetName(option)}</span>
                <span className="text-xs leading-snug text-muted">{TRAIN_COPY.setLine[option]}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section legend={TRAIN_COPY.howMany}>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={TRAIN_COPY.howMany}>
            {COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={option === count}
                onClick={() => setCount(option)}
                data-testid="train-count"
                data-count={option}
                className={`min-h-11 rounded-lg border text-base font-semibold ${
                  option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </Section>

        <Section legend={TRAIN_COPY.seats}>
          {names.map((name, seat) => {
            const away = seat >= count;
            return (
              <div key={seat} className={`flex items-center gap-2 text-sm ${away ? "invisible" : ""}`} aria-hidden={away ? true : undefined} data-testid="train-seat" data-seat={seat}>
                <SeatColourButton player={seat} playing={count} />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">
                    Player {seat + 1}, {marbles[seat].label}
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={PARTY_NAME_MOST}
                    disabled={away}
                    placeholder={computers[seat] ? `${TRAIN_COPY.computer} ${seat + 1}` : `Player ${seat + 1}`}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="train-name"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={computers[seat]}
                  disabled={away}
                  onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                  className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${
                    computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT
                  }`}
                  title={TRAIN_COPY.computerHelp}
                  data-testid="train-computer"
                >
                  {TRAIN_COPY.computer}
                </button>
              </div>
            );
          })}
        </Section>

        <Section legend={TRAIN_COPY.house}>
          <Choice
            legend={TRAIN_COPY.lengthLabel}
            value={options.length}
            options={["full", "short"] as const}
            names={TRAIN_COPY.lengths}
            lines={TRAIN_COPY.lengthLine}
            testId="train-length"
            onChange={(length) => setOptions((was) => ({ ...was, length }))}
          />
          <Choice
            legend={TRAIN_COPY.doublesLabel}
            value={options.doubles}
            options={["one", "chain"] as const}
            names={TRAIN_COPY.doubles}
            lines={TRAIN_COPY.doublesLine}
            testId="train-doubles"
            onChange={(doubles) => setOptions((was) => ({ ...was, doubles }))}
          />
          <Choice
            legend={TRAIN_COPY.mexicanLabel}
            value={options.mexican}
            options={["any", "ownFirst"] as const}
            names={TRAIN_COPY.mexican}
            lines={TRAIN_COPY.mexicanLine}
            testId="train-mexican"
            onChange={(mexican) => setOptions((was) => ({ ...was, mexican }))}
          />
        </Section>

        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="train-start">
          {PARTY_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
      </form>
    </div>
  );
}
