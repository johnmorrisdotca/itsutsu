"use client";

import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { MANCALA_RULE_NAMES } from "@/lib/party/mancala/mancala.constants";
import { ruleSetOf, startMancala } from "@/lib/party/mancala/mancala";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";
import { PARTY_SPECS } from "@/lib/party/party.constants";

import { MancalaBoard } from "./MancalaBoard";
import { MarbleChip } from "./MarbleChip";
import { MANCALA_COPY, PARTY_COPY, PARTY_MARBLES } from "./party.constants";
import type { MancalaSetUpProps } from "./party.types";

const SPEC = PARTY_SPECS.mancala;

/**
 * THE TABLE, BEFORE THE FIRST SEED: which rules — Kalah, the default, or
 * Oware — and what the two players are called if they want names. Beside it
 * the live board under the rules chosen, drawn `readOnly`, with nothing to
 * tap: every set-up preview on this site is the board itself.
 *
 * A rule set is chosen as a board is, because on this site it is one
 * (`MANCALA_BOARDS`): Kalah's fourteen holes or Oware's twelve.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the board
 * is a square as wide as its column, and the two rule tiles are one size,
 * each with room for its longest line.
 */
export function MancalaSetUp({ appearance, onStart, ready }: MancalaSetUpProps) {
  const [board, setBoard] = useState(SPEC.defaultSize);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  // A table the set-up offers is always one the rules start.
  const preview = startMancala(board, names)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="mancala-preview">
        <MancalaBoard game={preview} appearance={appearance} readOnly />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="mancala-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(startMancala(board, names)!);
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{MANCALA_COPY.rules}</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={MANCALA_COPY.rules}>
            {SPEC.sizes.map((option) => {
              const ruleSet = ruleSetOf(option)!;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  onClick={() => setBoard(option)}
                  aria-checked={option === board}
                  data-testid="mancala-rule-set"
                  data-rules={ruleSet}
                  className={`flex h-32 min-w-0 flex-col items-start gap-1 rounded-lg border p-2 text-left ${
                    option === board ? "border-ink bg-rule/70" : "border-rule-strong bg-ivory hover:bg-rule/60"
                  }`}
                >
                  <span className="text-base font-semibold">
                    {MANCALA_RULE_NAMES[ruleSet]}
                    {option === SPEC.defaultSize ? <span className="ml-1 text-xs font-normal text-muted">(default)</span> : null}
                  </span>
                  <span className="text-xs leading-snug text-muted">{MANCALA_COPY.ruleLine[ruleSet]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{MANCALA_COPY.names}</legend>
          {names.map((name, index) => (
            <label key={index} className="flex items-center gap-2 text-sm">
              <MarbleChip player={index} />
              <span className="sr-only">
                Player {index + 1}, {PARTY_MARBLES[index].label}, {index === 0 ? "the near row, sowing first" : "the far row"}
              </span>
              <input
                type="text"
                value={name}
                maxLength={PARTY_NAME_MOST}
                placeholder={`Player ${index + 1}${index === 0 ? " (near row, sows first)" : " (far row)"}`}
                onChange={(event) => setNames((was) => was.map((one, at) => (at === index ? event.target.value : one)))}
                className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                data-testid="mancala-name"
              />
            </label>
          ))}
        </fieldset>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="mancala-start">
          {PARTY_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
      </form>
    </div>
  );
}
