"use client";

import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_NAME_MOST, PARTY_PLAYER_COUNTS, PARTY_SEATS, startPartyGame } from "@/lib/gomoku/party/partyCheckers";
import type { PartyPlayerCount } from "@/lib/gomoku/party/partyCheckers.types";

import { MarbleChip } from "./MarbleChip";
import { PartyStarBoard } from "./PartyStarBoard";
import { PARTY_COPY, PARTY_MARBLES } from "./party.constants";
import type { PartySetUpProps } from "./party.types";

/**
 * THE TABLE, BEFORE ANYBODY MOVES: how many are playing, and what they are
 * called if they want names. Beside it the live board, set out for that many
 * — every set-up preview on this site is the board itself, never a picture of
 * one — so choosing four shows exactly where the four sit.
 */
export function PartySetUp({ appearance, onStart, ready }: PartySetUpProps) {
  const [count, setCount] = useState<PartyPlayerCount>(3);
  const [names, setNames] = useState<string[]>(() => new Array(6).fill(""));
  const preview = startPartyGame(count, names);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="party-preview">
        <PartyStarBoard game={preview} appearance={appearance} selected={null} targets={[]} onHole={() => {}} readOnly />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="party-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(startPartyGame(count, names));
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PARTY_COPY.howMany}</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={PARTY_COPY.howMany}>
            {PARTY_PLAYER_COUNTS.map((option) => (
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
          <legend className={SECTION_TITLE}>{PARTY_COPY.names}</legend>
          {PARTY_SEATS[count].map((tip, index) => (
            <label key={tip} className="flex items-center gap-2 text-sm">
              <MarbleChip player={index} />
              <span className="sr-only">
                Player {index + 1}, {PARTY_MARBLES[index].label}
              </span>
              <input
                type="text"
                value={names[index]}
                maxLength={PARTY_NAME_MOST}
                placeholder={`Player ${index + 1}`}
                onChange={(event) => setNames((was) => was.map((name, at) => (at === index ? event.target.value : name)))}
                className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                data-testid="party-name"
              />
            </label>
          ))}
        </fieldset>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="party-start">
          {PARTY_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
      </form>
    </div>
  );
}
