"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { Appearance } from "@/components/board/board.types";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";
import {
  SUGOROKU_DEFAULT_LENGTH,
  SUGOROKU_DEFAULT_STRENGTH,
  SUGOROKU_LENGTHS,
  SUGOROKU_MOST_LENGTHS,
  SUGOROKU_STRENGTHS,
  type SugorokuKind,
  type SugorokuStrength,
} from "@/lib/party/sugoroku/sugoroku.constants";
import type { SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { startSugoroku, viewOf } from "@/lib/party/sugoroku/sugorokuTable";
import { sugorokuLengthWords } from "@/lib/party/sugoroku/sugorokuWords";
import { freshSeed } from "@/lib/puzzles/random";

import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import type { OnlineOffer, SeatChoice } from "../online/online.types";
import { SugorokuBoard } from "./SugorokuBoard";
import { onlineWords, sugorokuScreenWords, sugorokuStrengthLines, sugorokuStrengthNames } from "@/components/party/partyWords";
import { gameNameFor } from "@/lib/catalogue/gameKeys";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * THE TABLE, BEFORE THE FIRST ROLL: how long a match, who plays — a person or
 * the computer in the second seat, at one of four strengths, or on several
 * devices a link, a buddy or the computer — beside the board itself, set out as
 * the game starts: every set-up preview on this site is the board.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the board
 * keeps one box whatever the length chosen, every row is laid out whether or
 * not it applies, and a game offered only as a single game shows its one chip
 * in the room of five.
 */
export function SugorokuSetUp({ kind, appearance, onStart, ready, online }: { kind: SugorokuKind; appearance: Appearance; onStart: (table: SugorokuTable) => void; ready: { "data-ready": string }; online?: OnlineOffer }) {
  const say = useSpeaker();
  const strengthNames = sugorokuStrengthNames(say.locale);
  const strengthLines = sugorokuStrengthLines(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const SUGOROKU_COPY = sugorokuScreenWords(say.locale);
  const lengths = SUGOROKU_LENGTHS[kind];
  // The match length a link from a kept record asked for (`?points=7`), if this game is played to it.
  const [length, setLength] = useState<number>(() => {
    const asked = Number(new URLSearchParams(window.location.search).get("points"));
    return lengths.includes(asked) ? asked : SUGOROKU_DEFAULT_LENGTH;
  });
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [computer, setComputer] = useState(true);
  const [strength, setStrength] = useState<SugorokuStrength>(SUGOROKU_DEFAULT_STRENGTH);
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, 2));
  const started = useStartTable(online);
  const severalOffer = several ? online : undefined;
  const preview = useMemo(() => startSugoroku(kind, length, ["", ""], 1), [kind, length]);
  const view = preview === null ? null : viewOf(preview);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="sugoroku-preview">
        {view === null || view.game === null ? null : (
          <SugorokuBoard
            position={view.game.position}
            variant={view.settings.variant}
            view="white"
            mover={null}
            cube={view.settings.rules.cube ? { value: 1, owner: null } : null}
            dice={null}
            highlight={null}
            appearance={appearance}
            label={say.say("party.sugoroku.boardAsBegins", { game: gameNameFor(kind, say) })}
          />
        )}
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="sugoroku-set-up"
        data-kind={kind}
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) {
            void started.start(length, choices.slice(0, 2));
            return;
          }
          const fresh = startSugoroku(kind, length, names, freshSeed(), [false, computer], ["", computer ? strength : ""]);
          if (fresh !== null) onStart(fresh);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />

        <Section legend={SUGOROKU_COPY.matchLength}>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={SUGOROKU_COPY.matchLength}>
            {Array.from({ length: SUGOROKU_MOST_LENGTHS }, (_, at) => lengths[at]).map((option, at) =>
              option === undefined ? (
                <span key={`room-${at}`} aria-hidden="true" className="min-h-11" />
              ) : (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={option === length}
                  onClick={() => setLength(option)}
                  data-testid="sugoroku-length"
                  data-points={option}
                  className={`min-h-11 rounded-lg border px-1 text-sm font-semibold ${option === length ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                >
                  {option === 1 ? say.say("party.sugoroku.single") : say.say("party.sugoroku.toLength", { points: String(option) })}
                </button>
              ),
            )}
          </div>
          <p className="min-h-8 text-xs leading-snug text-muted" data-testid="sugoroku-length-line">
            {length === 1 ? say.say("party.sugoroku.lengthLineSingle") : say.say("party.sugoroku.lengthLineMatch", { length: sugorokuLengthWords(length, say) })}
          </p>
        </Section>

        <Section legend={SUGOROKU_COPY.seats}>
          {/* White first: the seat that is yours. */}
          <div className="flex items-center gap-2 text-sm" data-testid="sugoroku-seat-set-up" data-seat={0}>
            <span className="w-14 shrink-0 text-xs font-semibold text-muted">{SUGOROKU_COPY.white}</span>
            <div className="min-w-0 flex-1">
              {severalOffer !== undefined ? (
                <SeatChoiceSelect offer={severalOffer} seat={0} choices={choices} onChoose={onChoose} />
              ) : (
                <label className="block">
                  <span className="sr-only">{playerNumberName(say, 1)}</span>
                  <input
                    type="text"
                    value={names[0]}
                    maxLength={PARTY_NAME_MOST}
                    placeholder={playerNumberName(say, 1)}
                    onChange={(event) => setNames((was) => [event.target.value, was[1]])}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="sugoroku-name"
                    data-seat={0}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm" data-testid="sugoroku-seat-set-up" data-seat={1}>
            <span className="w-14 shrink-0 text-xs font-semibold text-muted">{SUGOROKU_COPY.black}</span>
            <div className="min-w-0 flex-1">
              {severalOffer !== undefined ? (
                <SeatChoiceSelect offer={severalOffer} seat={1} choices={choices} onChoose={onChoose} />
              ) : (
                <label className="block">
                  <span className="sr-only">{playerNumberName(say, 2)}</span>
                  <input
                    type="text"
                    value={names[1]}
                    maxLength={PARTY_NAME_MOST}
                    placeholder={computer ? SUGOROKU_COPY.computer : playerNumberName(say, 2)}
                    onChange={(event) => setNames((was) => [was[0], event.target.value])}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="sugoroku-name"
                    data-seat={1}
                  />
                </label>
              )}
            </div>
            {severalOffer === undefined ? (
              <button
                type="button"
                aria-pressed={computer}
                onClick={() => setComputer((was) => !was)}
                className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computer ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                data-testid="sugoroku-computer"
              >
                {SUGOROKU_COPY.computer}
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-1" data-testid="sugoroku-strength" data-value={strength} data-shown={severalOffer === undefined && computer ? "true" : "false"} style={{ visibility: severalOffer === undefined && computer ? "visible" : "hidden" }}>
            <span className="text-xs text-muted">{SUGOROKU_COPY.strength}</span>
            <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={SUGOROKU_COPY.strength}>
              {SUGOROKU_STRENGTHS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={option === strength}
                  onClick={() => setStrength(option)}
                  data-value={option}
                  tabIndex={severalOffer === undefined && computer ? 0 : -1}
                  className={`min-h-11 rounded-lg border px-1 text-xs font-semibold ${option === strength ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                >
                  {strengthNames[option]}
                </button>
              ))}
            </div>
            <span className="min-h-8 text-xs leading-snug text-muted">{strengthLines[strength]}</span>
          </div>
        </Section>

        <p className="min-h-5 text-xs text-muted">{severalOffer === undefined ? SUGOROKU_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, 2))}</p>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          disabled={started.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, 2))}
          data-testid="sugoroku-start"
        >
          {severalOffer === undefined ? SUGOROKU_COPY.start : started.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {started.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {started.problem}
          </p>
        ) : null}
      </form>
    </div>
  );
}
