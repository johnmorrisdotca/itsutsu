"use client";

import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_NAME_MOST } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";

import { MarbleChip } from "./MarbleChip";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "./online/OnlineSetUpParts";
import { ONLINE_COPY } from "./online/online.constants";
import type { SeatChoice } from "./online/online.types";
import { PARTY_COPY, PARTY_MARBLES } from "./party.constants";
import type { PartySetUpProps } from "./party.types";

/**
 * THE TABLE, BEFORE ANYBODY MOVES: how many are playing, and what they are
 * called if they want names. Beside it the live board, set out for that many
 * — every set-up preview on this site is the board itself, never a picture of
 * one — so choosing four shows exactly where the four sit.
 */
export function PartySetUp<S extends PartyRaceState, C extends number>({ kind, appearance, onStart, ready, online }: PartySetUpProps<S, C>) {
  const { rules, Board } = kind;
  const [count, setCount] = useState<C>(rules.firstCount);
  const [names, setNames] = useState<string[]>(() => new Array(PARTY_MARBLES.length).fill(""));
  const preview = rules.start(count, names);
  // Several devices: a seat chooser in each name's row, and Start sets the table on the server (`OnlineSetUpParts`).
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, PARTY_MARBLES.length));
  const table = useStartTable(online);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const severalOffer = several ? online : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="party-preview">
        <Board game={preview} appearance={appearance} selected={null} targets={[]} onHole={() => {}} readOnly />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="party-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) void table.start(0, choices.slice(0, count));
          else onStart(rules.start(count, names));
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PARTY_COPY.howMany}</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={PARTY_COPY.howMany}>
            {rules.counts.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                onClick={() => setCount(option)}
                aria-checked={option === count}
                data-testid="party-count"
                data-count={option}
                className={`min-h-11 rounded-lg border text-base font-semibold ${
                  option === count ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory text-ink hover:bg-rule/60"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{severalOffer !== undefined ? ONLINE_COPY.seats : PARTY_COPY.names}</legend>
          {preview.players.map((_, index) => (
            <label key={rules.seatOf(preview, index)} className="flex items-center gap-2 text-sm">
              <MarbleChip player={index} />
              <span className="sr-only">
                Player {index + 1}, {PARTY_MARBLES[index].label}
              </span>
              {severalOffer !== undefined ? (
                <SeatChoiceSelect offer={severalOffer} seat={index} choices={choices} onChoose={onChoose} />
              ) : (
                <input
                  type="text"
                  value={names[index]}
                  maxLength={PARTY_NAME_MOST}
                  placeholder={`Player ${index + 1}`}
                  onChange={(event) => setNames((was) => was.map((name, at) => (at === index ? event.target.value : name)))}
                  className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                  data-testid="party-name"
                />
              )}
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          data-testid="party-start"
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
