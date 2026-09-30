"use client";

import { useState, type ReactNode } from "react";

import type { Appearance } from "@/components/board/board.types";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { HITOTSU_CLASSIC, HITOTSU_DEFAULT_SIZE, HITOTSU_ONE_HAND, HITOTSU_PARTY, type HitotsuGame, type HitotsuOptions, startHitotsu } from "@johnmorrisdotca/hitotsu";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";
import { freshSeed } from "@/lib/puzzles/random";

import { freshCardSeed } from "../cards/cardTableStores";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import { ONLINE_COPY } from "../online/online.constants";
import type { OnlineOffer, SeatChoice } from "../online/online.types";
import { SeatColourButton } from "../SeatColourButton";
import { HITOTSU_COPY, HITOTSU_HOUSE_COPY } from "./hitotsu.constants";
import { HitotsuTableTop } from "./HitotsuTableTop";

const SPEC = PARTY_SPECS.hitotsu;
const COUNTS = Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, at) => SPEC.fewestPlayers + at);
type Mode = "classic" | "party";
const MODES: Record<Mode, { options: HitotsuOptions; size: number }> = {
  classic: { options: HITOTSU_CLASSIC, size: HITOTSU_DEFAULT_SIZE },
  party: { options: HITOTSU_PARTY, size: HITOTSU_ONE_HAND },
};

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/** A house rule's tiles, one chosen, each the same size whichever is chosen, with its one line under the chosen one's name. */
function Tiles<K extends string>({
  legend,
  value,
  options,
  names,
  lines,
  testId,
  disabled = false,
  note,
  onChange,
}: {
  legend: string;
  value: K;
  options: readonly K[];
  names: Record<K, string>;
  lines: Record<K, string>;
  testId: string;
  disabled?: boolean;
  note?: string;
  onChange: (value: K) => void;
}) {
  return (
    <div className="flex flex-col gap-1" data-testid={testId} data-value={value}>
      <span className="text-xs text-muted">{legend}</span>
      <div className={`grid gap-1.5 ${options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} role="radiogroup" aria-label={legend}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === value}
            disabled={disabled}
            onClick={() => onChange(option)}
            data-value={option}
            className={`min-h-11 rounded-lg border px-2 text-sm font-semibold disabled:opacity-50 ${option === value ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
          >
            {names[option]}
          </button>
        ))}
      </div>
      {/* One line, the chosen rule's or why it cannot be chosen, in room kept for two so nothing below moves. */}
      <span className="min-h-8 text-xs leading-snug text-muted">{note ?? lines[value]}</span>
    </div>
  );
}

const ON_OFF = ["on", "off"] as const;
type OnOff = (typeof ON_OFF)[number];
const onOff = (value: boolean): OnOff => (value ? "on" : "off");
const onOffNames: Record<OnOff, string> = { on: HITOTSU_COPY.on, off: HITOTSU_COPY.off };

/**
 * THE TABLE, BEFORE THE FIRST CARD: Classic or Party, how many are playing,
 * how long, who sits where — a person or a computer in each seat, or on
 * several devices a link, a buddy or a computer — and the house rules, each
 * opening on the published rule (Classic) or the party table's (Party).
 * Beside it the table dealt for that many: every set-up preview on this site
 * is the board itself.
 *
 * JUMP-IN IS A TABLE OF ONE PERSON. Played out of turn, it is a race for the
 * card; round one device between two people there is no fair race for one
 * screen, and at a table on several devices the server takes one move at a
 * time from the seat to play. So it is offered where one person sits with
 * computers on this device, and says why where it is not.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): every
 * tile is one size, every rule keeps room for its line, and all eight seats'
 * rows are always laid out, those nobody sits in kept invisible.
 */
export function HitotsuSetUp({ appearance, onStart, ready, online }: { appearance: Appearance; onStart: (game: HitotsuGame) => void; ready: { "data-ready": string }; online?: OnlineOffer }) {
  const [mode, setMode] = useState<Mode>("classic");
  const [count, setCount] = useState(SPEC.defaultPlayers);
  const [size, setSize] = useState<number>(HITOTSU_DEFAULT_SIZE);
  const [options, setOptions] = useState<HitotsuOptions>(HITOTSU_CLASSIC);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  // The first seat is whoever holds the device; the rest open as computers, so one person can start a game at once.
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: SPEC.mostPlayers }, (_, seat) => seat > 0));
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, SPEC.mostPlayers));
  const table = useStartTable(online);
  const severalOffer = several ? online : undefined;
  const seated = computers.slice(0, count);
  const people = seated.filter((computer) => !computer).length;
  const nobody = severalOffer === undefined && people === 0;
  const jumpAllowed = severalOffer === undefined && people === 1;
  const played: HitotsuOptions = { ...options, jumpIn: options.jumpIn && jumpAllowed };
  const preview = startHitotsu(size, names.slice(0, count), 1, played, seated.map(() => true));
  const choose = (next: Mode) => {
    setMode(next);
    setOptions(MODES[next].options);
    setSize(MODES[next].size);
  };
  const set = <K extends keyof HitotsuOptions>(key: K, value: HitotsuOptions[K]) => setOptions((was) => ({ ...was, [key]: value }));
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="hitotsu-preview">
        {preview === null ? null : <HitotsuTableTop game={preview} appearance={appearance} />}
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="hitotsu-set-up"
        data-mode={mode}
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) {
            void table.start(size, choices.slice(0, count), { seed: freshSeed(), options: { ...options, jumpIn: false } });
            return;
          }
          if (nobody) return;
          const fresh = startHitotsu(size, names.slice(0, count), freshCardSeed(), played, seated);
          if (fresh !== null) onStart(fresh);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <Section legend={HITOTSU_COPY.mode}>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={HITOTSU_COPY.mode}>
            {(["classic", "party"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={option === mode}
                onClick={() => choose(option)}
                data-testid="hitotsu-mode"
                data-value={option}
                className={`flex h-24 min-w-0 flex-col items-start gap-0.5 rounded-lg border p-2 text-left sm:h-20 ${option === mode ? "border-ink bg-rule/70" : "border-rule-strong bg-ivory hover:bg-rule/60"}`}
              >
                <span className="text-sm font-semibold">
                  {option === "classic" ? HITOTSU_COPY.classic : HITOTSU_COPY.party}
                  {option === "classic" ? <span className="ml-1 text-xs font-normal text-muted">(default)</span> : null}
                </span>
                <span className="text-xs leading-snug text-muted">{option === "classic" ? HITOTSU_COPY.classicLine : HITOTSU_COPY.partyLine}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section legend={HITOTSU_COPY.howMany}>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={HITOTSU_COPY.howMany}>
            {COUNTS.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === count} onClick={() => setCount(option)} data-testid="hitotsu-count" data-count={option} className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option}
              </button>
            ))}
          </div>
        </Section>

        <Section legend={HITOTSU_COPY.length}>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={HITOTSU_COPY.length}>
            {SPEC.sizes.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === size} onClick={() => setSize(option)} data-testid="hitotsu-length" data-size={option} className={`min-h-11 rounded-lg border text-sm font-semibold ${option === size ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option === HITOTSU_ONE_HAND ? HITOTSU_COPY.oneHand : HITOTSU_COPY.to(option)}
              </button>
            ))}
          </div>
        </Section>

        <Section legend={HITOTSU_COPY.seats}>
          {names.map((name, seat) => {
            const away = seat >= count;
            return (
              <div key={seat} className={`flex items-center gap-2 text-sm ${away ? "invisible" : ""}`} aria-hidden={away ? true : undefined} data-testid="hitotsu-seat-set-up" data-seat={seat}>
                <SeatColourButton player={seat} playing={count} />
                {severalOffer !== undefined ? (
                  <div className="min-w-0 flex-1">
                    <SeatChoiceSelect offer={severalOffer} seat={seat} choices={choices} onChoose={onChoose} disabled={away} />
                  </div>
                ) : (
                  <>
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Player {seat + 1}</span>
                      <input
                        type="text"
                        value={name}
                        maxLength={PARTY_NAME_MOST}
                        disabled={away}
                        placeholder={computers[seat] ? HITOTSU_COPY.computerName(seat) : `Player ${seat + 1}`}
                        onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                        className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                        data-testid="hitotsu-name"
                      />
                    </label>
                    <button
                      type="button"
                      aria-pressed={computers[seat]}
                      disabled={away}
                      onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                      className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                      data-testid="hitotsu-computer"
                    >
                      {HITOTSU_COPY.computer}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </Section>

        <Section legend={HITOTSU_COPY.house}>
          <Tiles legend={HITOTSU_HOUSE_COPY.stacking.legend} value={options.stacking} options={["off", "same", "any"] as const} names={HITOTSU_HOUSE_COPY.stacking.names} lines={HITOTSU_HOUSE_COPY.stacking.lines} testId="hitotsu-stacking" onChange={(value) => set("stacking", value)} />
          <Tiles
            legend={HITOTSU_HOUSE_COPY.jumpIn.legend}
            value={onOff(played.jumpIn)}
            options={ON_OFF}
            names={onOffNames}
            lines={{ on: HITOTSU_HOUSE_COPY.jumpIn.on, off: HITOTSU_HOUSE_COPY.jumpIn.off }}
            testId="hitotsu-jump-in"
            disabled={!jumpAllowed}
            note={jumpAllowed ? undefined : HITOTSU_HOUSE_COPY.jumpIn.people}
            onChange={(value) => set("jumpIn", value === "on")}
          />
          <Tiles legend={HITOTSU_HOUSE_COPY.sevenZero.legend} value={onOff(options.sevenZero)} options={ON_OFF} names={onOffNames} lines={{ on: HITOTSU_HOUSE_COPY.sevenZero.on, off: HITOTSU_HOUSE_COPY.sevenZero.off }} testId="hitotsu-seven-zero" onChange={(value) => set("sevenZero", value === "on")} />
          <Tiles legend={HITOTSU_HOUSE_COPY.drawToMatch.legend} value={onOff(options.drawToMatch)} options={ON_OFF} names={onOffNames} lines={{ on: HITOTSU_HOUSE_COPY.drawToMatch.on, off: HITOTSU_HOUSE_COPY.drawToMatch.off }} testId="hitotsu-draw-to-match" onChange={(value) => set("drawToMatch", value === "on")} />
          <Tiles legend={HITOTSU_HOUSE_COPY.wildFour.legend} value={options.wildFour} options={["challenge", "strict"] as const} names={HITOTSU_HOUSE_COPY.wildFour.names} lines={HITOTSU_HOUSE_COPY.wildFour.lines} testId="hitotsu-wild-four" onChange={(value) => set("wildFour", value)} />
        </Section>

        <p className={`min-h-5 text-xs ${nobody ? "text-shu" : "text-muted"}`}>{nobody ? HITOTSU_COPY.onePerson : severalOffer === undefined ? HITOTSU_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, count))}</p>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          disabled={nobody || table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, count))}
          data-testid="hitotsu-start"
        >
          {severalOffer === undefined ? HITOTSU_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
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
