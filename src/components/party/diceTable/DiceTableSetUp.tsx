"use client";

import { useState, type ReactNode } from "react";

import type { Appearance } from "@/components/board/board.types";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { PARTY_NAME_MOST, computerNumberName, seatedName } from "@/lib/party/partyNames";
import { freshSeed } from "@/lib/puzzles/random";

import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import type { OnlineOffer, SeatChoice } from "../online/online.types";
import { cardTableWords, onlineWords } from "../partyWords";
import { SeatColourButton } from "../SeatColourButton";
import { DICE_TABLE_ROWS } from "./diceTableRows";

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * THE TABLE, BEFORE THE FIRST THROW: where it is played, how many, the game's one
 * choice, and who sits where, a person named if they like or a computer. The
 * first seat is whoever holds the device and the rest open as computers, so one
 * person can start at once. Beside it the live board for that table, with nothing
 * to press: every set-up preview on this site is the board itself.
 */
export function DiceTableSetUp({ kind, appearance, ready, online, onStart }: { kind: DiceTableKind; appearance: Appearance; ready: { "data-ready": string }; online?: OnlineOffer; onStart: (game: unknown) => void }) {
  const say = useSpeaker();
  const CARD_TABLE_COPY = cardTableWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const row = DICE_TABLE_ROWS[kind];
  const spec = PARTY_SPECS[kind];
  const counts = Array.from({ length: spec.mostPlayers - spec.fewestPlayers + 1 }, (_, at) => spec.fewestPlayers + at);
  const [count, setCount] = useState<number>(spec.defaultPlayers);
  const [size, setSize] = useState<number>(spec.defaultSize);
  const [names, setNames] = useState<string[]>(() => new Array<string>(spec.mostPlayers).fill(""));
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: spec.mostPlayers }, (_, seat) => seat > 0));
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, spec.mostPlayers));
  const table = useStartTable(online);
  const severalOffer = several ? online : undefined;
  const seated = computers.slice(0, count);
  const nobody = severalOffer === undefined && seated.every(Boolean);
  const preview = row.rules.start(size, names.slice(0, count), undefined, 1, seated);
  const previewNames = names.slice(0, count).map((_, seat) => seatedName({ players: names.slice(0, count), computers: seated }, seat, say));
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const start = () => {
    if (severalOffer !== undefined) {
      void table.start(size, choices.slice(0, count));
      return;
    }
    const fresh = row.rules.start(size, names.slice(0, count), undefined, freshSeed(), seated);
    if (fresh !== null) onStart(fresh);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="dicetable-preview">
        {preview === null ? null : <row.Board game={preview} appearance={appearance} names={previewNames} viewer={null} canMove={false} onMove={() => undefined} />}
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="dicetable-set-up"
        data-kind={kind}
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (!nobody) start();
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <Section legend={CARD_TABLE_COPY.howMany}>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={CARD_TABLE_COPY.howMany}>
            {counts.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === count} onClick={() => setCount(option)} data-testid="dicetable-count" data-count={option} className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option}
              </button>
            ))}
          </div>
        </Section>
        <Section legend={row.sizeLegend(say)}>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={row.sizeLegend(say)}>
            {spec.sizes.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === size} onClick={() => setSize(option)} data-testid="dicetable-size" data-size={option} className={`min-h-11 rounded-lg border text-sm font-semibold ${option === size ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {row.sizeWord(option, say)}
              </button>
            ))}
          </div>
        </Section>
        <Section legend={CARD_TABLE_COPY.seats}>
          {names.map((name, seat) => {
            if (seat >= count) return null;
            return (
              <div key={seat} className="flex items-center gap-2 text-sm" data-testid="dicetable-seat" data-seat={seat}>
                <SeatColourButton player={seat} playing={count} />
                {severalOffer !== undefined ? (
                  <div className="min-w-0 flex-1">
                    <SeatChoiceSelect offer={severalOffer} seat={seat} choices={choices} onChoose={onChoose} />
                  </div>
                ) : (
                  <>
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">{playerNumberName(say, seat + 1)}</span>
                      <input
                        type="text"
                        value={name}
                        maxLength={PARTY_NAME_MOST}
                        placeholder={computers[seat] ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1)}
                        onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                        className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                        data-testid="dicetable-name"
                      />
                    </label>
                    <button type="button" aria-pressed={computers[seat]} onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))} className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`} data-testid="dicetable-computer">
                      {CARD_TABLE_COPY.computer}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </Section>
        <p className={`min-h-5 text-xs ${nobody ? "text-shu" : "text-muted"}`}>{nobody ? CARD_TABLE_COPY.onePerson : severalOffer === undefined ? CARD_TABLE_COPY.kept : ONLINE_COPY.severalNote}</p>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} disabled={nobody || table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, count))} data-testid="dicetable-start">
          {severalOffer === undefined ? CARD_TABLE_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
      </form>
    </div>
  );
}
