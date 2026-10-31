"use client";

import { useMemo, useState } from "react";

import { diceWarOdds } from "@johnmorrisdotca/korokoro";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import {
  DICE_WAR_DEFAULTS,
  DICE_WAR_DICE,
  DICE_WAR_LIMITS_HERE,
  DICE_WAR_POINT_GOALS,
  DICE_WAR_ROUND_GOALS,
  DICE_WAR_SIDES,
  type DiceWarGoalKind,
} from "@/lib/party/diceWar/diceWar.constants";
import { DICE_WAR_RULES } from "@/lib/party/diceWar/diceWarRules";
import { PARTY_NAME_MOST, computerNumberName } from "@/lib/party/partyNames";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { freshSeed } from "@/lib/puzzles/random";

import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import type { OnlineOffer, SeatChoice } from "../online/online.types";
import { usePartyMarbles } from "../partyMarbles";
import { SeatColourButton } from "../SeatColourButton";
import { DiceWarBoard } from "./DiceWarBoard";
import type { DiceWarGame } from "@johnmorrisdotca/korokoro";
import { diceWarScreenWords, onlineWords, seatColourName } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

const COUNTS = Array.from({ length: DICE_WAR_LIMITS_HERE.mostPlayers - DICE_WAR_LIMITS_HERE.fewestPlayers + 1 }, (_, at) => DICE_WAR_LIMITS_HERE.fewestPlayers + at);
/** Every way the set-up offers to end a game, one tile each: a score, or a number of rounds. */
const GOALS: readonly { goal: DiceWarGoalKind; to: number }[] = [...DICE_WAR_POINT_GOALS.map((to) => ({ goal: "points" as const, to })), ...DICE_WAR_ROUND_GOALS.map((to) => ({ goal: "rounds" as const, to }))];

/** A chance as a plain percentage: "83%", and "under 1%" for one too small to round. */
function percent(chance: number): string {
  const whole = Math.round(chance * 100);
  return chance > 0 && whole === 0 ? "under 1%" : `${whole}%`;
}

/**
 * THE TABLE, BEFORE THE FIRST ROLL: how many are playing, who sits where (a
 * person, named if they like, or a computer), how many dice each rolls, how
 * many sides a die has, and what the game is played to. Beside it the live
 * table of throws for that table, drawn with nothing to press: every set-up
 * preview on this site is the table itself. A line under the choices says the
 * exact odds of one throw (Korokoro works them out), so a table can see what
 * more dice or fewer sides do to how often it is war.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): every
 * choice is a row of tiles of one size, the seats a game could need are always
 * laid out (those nobody sits in kept in place and hidden), and the preview's
 * rows are all eight places.
 */
export function DiceWarSetUp({ onStart, ready, online }: { onStart: (game: DiceWarGame) => void; ready: { "data-ready": string }; online?: OnlineOffer }) {
  const say = useSpeaker();
  const DICE_WAR_COPY = diceWarScreenWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [count, setCount] = useState<number>(DICE_WAR_DEFAULTS.players);
  const [dice, setDice] = useState<number>(DICE_WAR_DEFAULTS.dice);
  const [sides, setSides] = useState<number>(DICE_WAR_DEFAULTS.sides);
  const [goal, setGoal] = useState<{ goal: DiceWarGoalKind; to: number }>({ goal: DICE_WAR_DEFAULTS.goal, to: DICE_WAR_DEFAULTS.to });
  const [names, setNames] = useState<string[]>(() => new Array<string>(DICE_WAR_LIMITS_HERE.mostPlayers).fill(""));
  // The first seat is whoever holds the device; the rest open as computers, so one person can start a game at once.
  const [computers, setComputers] = useState<boolean[]>(() => Array.from({ length: DICE_WAR_LIMITS_HERE.mostPlayers }, (_, seat) => seat > 0));
  const ONLINE_COPY = onlineWords(say.locale);
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, DICE_WAR_LIMITS_HERE.mostPlayers));
  const table = useStartTable(online);
  const severalOffer = several ? online : undefined;
  const seated = computers.slice(0, count);
  const nobody = severalOffer === undefined && seated.every(Boolean);

  const make = (seed: string) => DICE_WAR_RULES.startWith({ players: names.slice(0, count), computers: seated, dice, sides, goal: goal.goal, to: goal.to, seed });
  const preview = make("preview");
  const odds = useMemo(() => diceWarOdds({ players: count, dice, sides }), [count, dice, sides]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="dicewar-preview">
        {preview === null ? null : <DiceWarBoard game={preview} />}
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="dicewar-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (nobody) return;
          if (severalOffer !== undefined) {
            void table.start(goal.goal === "points" ? goal.to : DICE_WAR_DEFAULTS.to, choices.slice(0, count), { dice, sides, goal: goal.goal, to: goal.to });
            return;
          }
          const game = make(String(freshSeed()));
          if (game !== null) onStart(game);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DICE_WAR_COPY.howMany}</legend>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={DICE_WAR_COPY.howMany}>
            {COUNTS.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === count} onClick={() => setCount(option)} data-testid="dicewar-count" data-count={option} className={`min-h-11 rounded-lg border text-base font-semibold ${option === count ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DICE_WAR_COPY.dice}</legend>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={DICE_WAR_COPY.dice}>
            {DICE_WAR_DICE.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === dice} onClick={() => setDice(option)} data-testid="dicewar-dice-count" data-dice={option} className={`min-h-11 rounded-lg border text-base font-semibold ${option === dice ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DICE_WAR_COPY.sides}</legend>
          <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={DICE_WAR_COPY.sides}>
            {DICE_WAR_SIDES.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === sides} onClick={() => setSides(option)} data-testid="dicewar-sides" data-sides={option} className={`min-h-11 rounded-lg border text-sm font-semibold ${option === sides ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                d{option}
              </button>
            ))}
          </div>
          <p className="min-h-5 text-xs text-muted" data-testid="dicewar-odds">
            {DICE_WAR_COPY.odds(percent(odds.outright), percent(odds.war))}
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DICE_WAR_COPY.goal}</legend>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={DICE_WAR_COPY.goal}>
            {GOALS.map((option) => {
              const chosen = option.goal === goal.goal && option.to === goal.to;
              return (
                <button key={`${option.goal}-${option.to}`} type="button" role="radio" aria-checked={chosen} onClick={() => setGoal(option)} data-testid="dicewar-goal" data-goal={option.goal} data-to={option.to} className={`min-h-11 rounded-lg border px-1 text-xs font-semibold ${chosen ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                  {option.goal === "points" ? DICE_WAR_COPY.points(option.to) : DICE_WAR_COPY.rounds(option.to)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DICE_WAR_COPY.seats}</legend>
          {names.map((name, seat) => {
            if (seat >= count) return null;
            return (
              <div key={seat} className="flex items-center gap-2 text-sm" data-testid="dicewar-seat-set-up" data-seat={seat}>
                <SeatColourButton player={seat} playing={count} />
                {severalOffer !== undefined ? (
                  <div className="min-w-0 flex-1">
                    <SeatChoiceSelect offer={severalOffer} seat={seat} choices={choices} onChoose={(at, choice) => setChoices((was) => was.map((one, where) => (where === at ? choice : one)))} />
                  </div>
                ) : (
                  <>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">
                    {seatColourName(say, seat, marbles[seat])}
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={PARTY_NAME_MOST}
                    placeholder={computers[seat] ? computerNumberName(say, seat + 1) : playerNumberName(say, seat + 1)}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === seat ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="dicewar-name"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={computers[seat]}
                  onClick={() => setComputers((was) => was.map((one, at) => (at === seat ? !one : one)))}
                  className={`min-h-11 shrink-0 rounded-lg border px-2.5 text-xs font-semibold ${computers[seat] ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  title={DICE_WAR_COPY.computerHelp}
                  data-testid="dicewar-computer"
                >
                  {DICE_WAR_COPY.computer}
                </button>
                  </>
                )}
              </div>
            );
          })}
        </fieldset>

        <p className={`min-h-5 text-xs ${nobody ? "text-shu" : "text-muted"}`}>{nobody ? DICE_WAR_COPY.onePerson : severalOffer === undefined ? DICE_WAR_COPY.kept : ONLINE_COPY.severalNote}</p>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} disabled={nobody || table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, count))} data-testid="dicewar-start">
          {severalOffer === undefined ? DICE_WAR_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
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
