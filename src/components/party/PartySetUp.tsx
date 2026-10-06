"use client";

import { usePartyMarbles } from "./partyMarbles";
import { PlayerCountChoice } from "./PlayerCountChoice";
import { SeatColourButton } from "./SeatColourButton";
import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PARTY_NAME_MOST } from "@/lib/gomoku/party/partyRace";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";

import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "./online/OnlineSetUpParts";
import type { SeatChoice } from "./online/online.types";
import { PARTY_MARBLES } from "./party.constants";
import type { PartySetUpProps } from "./party.types";
import { marbleLabel, onlineWords, partyScreenWords } from "./partyWords";

/**
 * THE TABLE, BEFORE ANYBODY MOVES: how many are playing, and what they are
 * called if they want names. Beside it the live board, set out for that many
 * — every set-up preview on this site is the board itself, never a picture of
 * one — so choosing four shows exactly where the four sit.
 */
export function PartySetUp<S extends PartyRaceState, C extends number>({ kind, appearance, onStart, ready, online }: PartySetUpProps<S, C>) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
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
        {/* How many are playing: the one row every table uses (`PlayerCountChoice`). */}
        <PlayerCountChoice counts={rules.counts} value={count} onChange={setCount} testId="party-count" />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{severalOffer !== undefined ? ONLINE_COPY.seats : PARTY_COPY.names}</legend>
          {preview.players.map((_, index) => (
            <label key={rules.seatOf(preview, index)} className="flex items-center gap-2 text-sm">
              <SeatColourButton player={index} playing={count} />
              <span className="sr-only">{say.say("party.seatColour", { player: playerNumberName(say, index + 1), colour: marbleLabel(marbles[index], say.locale) })}</span>
              {severalOffer !== undefined ? (
                <SeatChoiceSelect offer={severalOffer} seat={index} choices={choices} onChoose={onChoose} />
              ) : (
                <input
                  type="text"
                  value={names[index]}
                  maxLength={PARTY_NAME_MOST}
                  placeholder={playerNumberName(say, index + 1)}
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
