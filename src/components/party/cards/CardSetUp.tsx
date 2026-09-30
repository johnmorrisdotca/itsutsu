"use client";

import { useState, type ReactNode } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";
import { CARD_GAME_SPECS } from "@/lib/cardGames/cardGames.constants";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";

import { MarbleChip } from "../MarbleChip";
import { CARD_ADAPTERS } from "./cardAdapters";
import { CARD_TABLE_COPY, PREVIEW_SEED } from "./cardTable.constants";
import type { CardSetUpProps } from "./cardTable.types";
import { CardTableSurface } from "./CardTableParts";
import { freshCardSeed } from "./cardTableStores";

/** What each game's length is called on its tiles. */
const LENGTH_WORDS: Record<CardSetUpProps["kind"], (size: number) => string> = {
  hearts: (size) => `To ${size}`,
  bigTwo: (size) => `${size} ${size === 1 ? "deal" : "deals"}`,
  president: (size) => `${size} rounds`,
  goFish: () => "One deal",
  crazyEights: (size) => `To ${size}`,
  spades: (size) => `To ${size}`,
  ginRummy: (size) => `To ${size}`,
  euchre: (size) => `To ${size}`,
  cribbage: (size) => (size === 61 ? "To 61, once round" : "To 121"),
};

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * THE TABLE, BEFORE THE FIRST CARD: how many are playing, how long, and who
 * sits where — a person, named if they like, or a computer. The first seat is
 * whoever holds the device, and the rest open as computers, so one person can
 * start a game at once. Beside it the live table dealt for that many, with
 * nothing to press: every set-up preview on this site is the board itself.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): every tile
 * is one size, and all the seats a game could need are always laid out, those
 * nobody sits in kept in place and hidden.
 */
export function CardSetUp({ kind, appearance, onStart, ready }: CardSetUpProps) {
  const spec = CARD_GAME_SPECS[kind];
  const counts = Array.from({ length: spec.mostPlayers - spec.fewestPlayers + 1 }, (_, at) => spec.fewestPlayers + at);
  const [count, setCount] = useState(spec.defaultPlayers);
  const [size, setSize] = useState(spec.defaultSize);
  const [names, setNames] = useState<string[]>(() => new Array<string>(spec.mostPlayers).fill(""));
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: spec.mostPlayers }, (_, seat) => seat > 0));
  const seated = computers.slice(0, count);
  const nobody = seated.every(Boolean);
  const adapter = CARD_ADAPTERS[kind];
  const preview = CARD_GAME_RULES[kind].start(size, names.slice(0, count), undefined, PREVIEW_SEED, seated.map(() => true));
  const previewNames = names.slice(0, count).map((name, seat) => (name.trim() === "" ? (computers[seat] ? CARD_TABLE_COPY.computerName(seat) : `Player ${seat + 1}`) : name));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="cards-preview">
        <CardTableSurface appearance={appearance}>{preview === null ? null : <adapter.Centre game={preview} viewer={0} players={previewNames} />}</CardTableSurface>
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="cards-set-up"
        data-kind={kind}
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (nobody) return;
          onStart(freshCardSeed(), size, names.slice(0, count), seated);
        }}
      >
        <Section legend={CARD_TABLE_COPY.howMany}>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={CARD_TABLE_COPY.howMany}>
            {counts.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === count} onClick={() => setCount(option)} data-testid="cards-count" data-count={option} className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option}
              </button>
            ))}
          </div>
        </Section>
        <Section legend={CARD_TABLE_COPY.length}>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={CARD_TABLE_COPY.length}>
            {spec.sizes.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === size} onClick={() => setSize(option)} data-testid="cards-length" data-size={option} className={`min-h-11 rounded-lg border text-sm font-semibold ${option === size ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {LENGTH_WORDS[kind](option)}
              </button>
            ))}
          </div>
        </Section>
        <Section legend={CARD_TABLE_COPY.seats}>
          {names.map((name, seat) => {
            const away = seat >= count;
            return (
              <div key={seat} className={`flex items-center gap-2 text-sm ${away ? "invisible" : ""}`} aria-hidden={away ? true : undefined} data-testid="cards-seat-set-up" data-seat={seat}>
                <MarbleChip player={seat} />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Player {seat + 1}</span>
                  <input
                    type="text"
                    value={name}
                    maxLength={PARTY_NAME_MOST}
                    disabled={away}
                    placeholder={computers[seat] ? CARD_TABLE_COPY.computerName(seat) : `Player ${seat + 1}`}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="cards-name"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={computers[seat]}
                  disabled={away}
                  onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                  className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  data-testid="cards-computer"
                >
                  {CARD_TABLE_COPY.computer}
                </button>
              </div>
            );
          })}
        </Section>
        <p className={`min-h-5 text-xs ${nobody ? "text-shu" : "text-muted"}`}>{nobody ? CARD_TABLE_COPY.onePerson : CARD_TABLE_COPY.kept}</p>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} disabled={nobody} data-testid="cards-start">
          {CARD_TABLE_COPY.start} →
        </button>
      </form>
    </div>
  );
}
