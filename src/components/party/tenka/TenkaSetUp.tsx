"use client";

import { useState } from "react";
import { usePartyMarbles } from "../partyMarbles";
import { SeatColourButton } from "../SeatColourButton";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { TENKA_NAME_MOST, TENKA_PLACING, TENKA_WORLD_ROUNDS } from "@/lib/party/tenka/tenka.constants";
import type { TenkaPlacing } from "@/lib/party/tenka/tenka.types";
import { startTenka } from "@/lib/party/tenka/tenkaStart";

import { PARTY_COPY } from "../party.constants";
import { TENKA_COPY } from "./tenka.constants";
import type { TenkaSetUpProps } from "./tenka.types";
import { TenkaMap } from "./TenkaMap";
import { NO_CHOICE, marksFor } from "./tenkaTaps";
import { freshTenkaSeed } from "./tenkaStore";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import { ONLINE_COPY } from "../online/online.constants";
import type { SeatChoice } from "../online/online.types";

const SPEC = PARTY_SPECS.tenka;
const COUNTS = Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, index) => SPEC.fewestPlayers + index);

/** The deal the preview shows: always the same one, so choosing does not reshuffle the picture for nothing. */
const PREVIEW_SEED = 2026;

/** One row of choices, drawn as the other tables' set-ups draw theirs: a radio group of tiles of one size. */
function Choices<T extends string | number>({ label, options, value, onChange, words, testId, columns }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void; words: (value: T) => string; testId: string; columns: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{label}</legend>
      <div className={`grid ${columns} gap-2`} role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            onClick={() => onChange(option)}
            aria-checked={option === value}
            data-testid={testId}
            data-value={option}
            className={`min-h-11 rounded-lg border px-1 text-sm font-semibold ${option === value ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory text-ink hover:bg-rule/60"}`}
          >
            {words(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * THE TABLE, BEFORE ANYBODY MOVES: how many are playing, how long, how the
 * starting armies go down, and what everybody is called. Beside it the live
 * map dealt for that many — every set-up preview on this site is the board
 * itself, never a picture of one — drawn with nothing to tap.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the map
 * keeps its shape whatever is chosen, every row of tiles is one row, and
 * there is a row for every name the table could need, the ones past the count
 * chosen kept in their place and hidden.
 */
export function TenkaSetUp({ appearance, onStart, ready, online }: TenkaSetUpProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [count, setCount] = useState(SPEC.defaultPlayers);
  const [rounds, setRounds] = useState(SPEC.defaultSize);
  const [placing, setPlacing] = useState<TenkaPlacing>(TENKA_PLACING.auto);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  const seated = names.slice(0, count);
  // A table the set-up offers is always one the rules start.
  const preview = startTenka(rounds, seated, PREVIEW_SEED)!;
  // Several devices: a seat chooser in each name's row, and Start sets the table on the server, dealt from a seed drawn here (`OnlineSetUpParts`).
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, SPEC.mostPlayers));
  const table = useStartTable(online);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const severalOffer = several ? online : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-2" data-testid="tenka-preview">
        <TenkaMap game={preview} appearance={appearance} marks={marksFor(preview, NO_CHOICE)} readOnly />
        <p className="text-xs text-muted">{TENKA_COPY.lengthNote(rounds, TENKA_WORLD_ROUNDS)}</p>
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="tenka-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) void table.start(rounds, choices.slice(0, count), { seed: freshTenkaSeed(), placing });
          else onStart(startTenka(rounds, seated, freshTenkaSeed(), placing)!);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <Choices label={PARTY_COPY.howMany} options={COUNTS} value={count} onChange={setCount} words={String} testId="tenka-count" columns="grid-cols-5" />
        <Choices label={TENKA_COPY.length} options={SPEC.sizes} value={rounds} onChange={setRounds} words={(option) => TENKA_COPY.lengthWords(option, TENKA_WORLD_ROUNDS)} testId="tenka-length" columns="grid-cols-3" />
        <Choices
          label={TENKA_COPY.placing}
          options={[TENKA_PLACING.auto, TENKA_PLACING.hand]}
          value={placing}
          onChange={setPlacing}
          words={(option) => (option === TENKA_PLACING.auto ? TENKA_COPY.placingAuto : TENKA_COPY.placingHand)}
          testId="tenka-placing"
          columns="grid-cols-2"
        />
        <p className="-mt-2 text-xs text-muted">{TENKA_COPY.placingNote}</p>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PARTY_COPY.names}</legend>
          {names.map((name, index) => {
            const sitting = index < count;
            return (
              <label key={index} className={`flex items-center gap-2 text-sm ${sitting ? "" : "invisible"}`} aria-hidden={sitting ? undefined : true}>
                <SeatColourButton player={index} playing={count} />
                <span className="sr-only">
                  Player {index + 1}, {marbles[index].label}
                </span>
                {severalOffer !== undefined ? (
                  <SeatChoiceSelect offer={severalOffer} seat={index} choices={choices} onChoose={onChoose} disabled={!sitting} />
                ) : (
                  <input
                    type="text"
                    value={name}
                    maxLength={TENKA_NAME_MOST}
                    placeholder={`Player ${index + 1}`}
                    disabled={!sitting}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === index ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="tenka-name"
                  />
                )}
              </label>
            );
          })}
        </fieldset>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          data-testid="tenka-start"
          disabled={table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, count))}
        >
          {severalOffer === undefined ? PARTY_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
        <p className="text-xs text-muted">{severalOffer === undefined ? PARTY_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, count))}</p>
      </form>
    </div>
  );
}
