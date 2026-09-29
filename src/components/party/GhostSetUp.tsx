"use client";

import { usePartyMarbles } from "./partyMarbles";
import { PlayerCountChoice } from "./PlayerCountChoice";
import { SeatColourButton } from "./SeatColourButton";
import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import type { PartyLanguage } from "@/lib/party/party.types";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";
import { startGhost } from "@/lib/party/superghost/superghost";

import { GhostPlayers } from "./GhostPlayers";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "./online/OnlineSetUpParts";
import { ONLINE_COPY } from "./online/online.constants";
import type { SeatChoice } from "./online/online.types";
import { GHOST_COPY, PARTY_COPY } from "./party.constants";
import type { GhostSetUpProps } from "./party.types";

const SPEC = PARTY_SPECS.superghost;
const COUNTS = Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, index) => SPEC.fewestPlayers + index);
const LANGUAGES: readonly PartyLanguage[] = SPEC.languages ?? [];

/**
 * THE TABLE, BEFORE ANYBODY PLAYS: how many are playing, in which language,
 * and what they are called if they want names. Beside it the table as it will
 * be, live — every name, every ghost still to come — since Superghost has no
 * board to preview.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the
 * counts and the languages are tiles of one size, and there is a row for every
 * name the table could need, and in the preview for every player, the ones
 * past the count chosen kept in their place and hidden.
 */
export function GhostSetUp({ onStart, ready, online }: GhostSetUpProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [count, setCount] = useState(SPEC.defaultPlayers);
  const [language, setLanguage] = useState<PartyLanguage>(LANGUAGES[0]!);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  const seated = names.slice(0, count);
  // A table the set-up offers is always one the rules start.
  const preview = startGhost(SPEC.defaultSize, seated, language)!;
  // Several devices: a seat chooser in each name's row, and Start sets the table on the server (`OnlineSetUpParts`).
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, SPEC.mostPlayers));
  const table = useStartTable(online);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const severalOffer = several ? online : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="ghost-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) void table.start(SPEC.defaultSize, choices.slice(0, count), { language });
          else onStart(startGhost(SPEC.defaultSize, seated, language)!);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        {/* How many are playing: the one row every table uses (`PlayerCountChoice`). */}
        <PlayerCountChoice counts={COUNTS} value={count} onChange={setCount} testId="ghost-count" />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{GHOST_COPY.language}</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={GHOST_COPY.language}>
            {LANGUAGES.map((option) => {
              const words = GHOST_COPY.languages[option];
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  onClick={() => setLanguage(option)}
                  aria-checked={option === language}
                  data-testid="ghost-language"
                  data-language={option}
                  className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border p-2 text-center ${
                    option === language ? "border-ink bg-rule/70 font-semibold" : "border-rule-strong bg-ivory hover:bg-rule/60"
                  }`}
                >
                  <span className="text-lg">{words.name}</span>
                  <span className="text-2xl font-bold">{words.letters}</span>
                  <span className="text-[0.7rem] text-muted">{words.words}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
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
                    maxLength={PARTY_NAME_MOST}
                    placeholder={`Player ${index + 1}`}
                    disabled={!sitting}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === index ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="ghost-name"
                  />
                )}
              </label>
            );
          })}
        </fieldset>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          data-testid="ghost-start"
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
      <div className="min-w-0" data-testid="ghost-preview">
        <GhostPlayers game={preview} room={SPEC.mostPlayers} />
      </div>
    </div>
  );
}
