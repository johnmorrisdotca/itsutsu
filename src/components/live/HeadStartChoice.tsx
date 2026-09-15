"use client";

import { HEAD_START_FREE_TURNS, NO_HEAD_START, STONES, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { TRADITIONAL_HEAD_START_DISPLAY, freeTurnsWords } from "@/lib/gomoku/headStartWords";
import { traditionalCounts, traditionalKind } from "@/lib/gomoku/rules/headStart";
import type { HeadStart, Stone } from "@/lib/gomoku/gomoku.types";
import { Field, Select } from "@/components/ui/Controls";
import { SET_UP_COPY } from "./live.constants";

/** Nobody is given a start: the even game. */
const NONE = "none";

/**
 * A HEAD START FOR THE WEAKER PLAYER, SETTLED BEFORE THE GAME EXISTS.
 *
 * The other half of the Handicap group, and above the harder rules because it
 * is the one people reach for: John chose "Free moves + traditional" — turns in
 * hand at the start for every game, and the game's own custom where it has one,
 * Go's handicap stones, Othello's corners, draughts' odds of a man.
 *
 * FOLDED AWAY UNTIL A COLOUR IS CHOSEN, like the harder rules below it. Choosing
 * one starts at a single free turn, so the choice is never a colour with nothing
 * given; switching colour starts again from there, because a start chosen for
 * one player is not a start chosen for the other.
 *
 * Used on the set-up screen and beside the practice board alike, so the two ask
 * the question in the same words; `testPrefix` keeps their controls apart.
 */
export function HeadStartChoice({
  value,
  variant,
  size,
  onChange,
  disabled = false,
  testPrefix = "set-up",
}: {
  value: HeadStart;
  /** The game it is given in: whether a traditional head start is offered, and what it is called. */
  variant: string;
  /** The board, which decides how many handicap stones there are star points for. */
  size: number;
  onChange: (next: HeadStart) => void;
  disabled?: boolean;
  testPrefix?: string;
}) {
  const stone = value.stone;
  const kind = traditionalKind(variant);
  const counts = traditionalCounts(variant, size);
  const tradition = kind === null ? null : TRADITIONAL_HEAD_START_DISPLAY[kind];

  return (
    <div className="flex flex-col gap-3" data-testid={`${testPrefix}-head-start`}>
      <Field label={SET_UP_COPY.headStartFor} hint={SET_UP_COPY.headStartHint}>
        <Select
          value={stone ?? NONE}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value === NONE
                ? NO_HEAD_START
                : { stone: event.target.value as Stone, freeTurns: 1, traditional: 0 },
            )
          }
          data-testid={`${testPrefix}-head-start-stone`}
        >
          <option value={NONE}>{SET_UP_COPY.headStartNone}</option>
          {Object.values(STONES).map((option) => (
            <option key={option} value={option}>
              {STONE_DISPLAY[option].label} · {STONE_DISPLAY[option].kanji}
            </option>
          ))}
        </Select>
      </Field>

      {stone !== null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rule p-3">
          <Field label={SET_UP_COPY.freeTurns} hint={SET_UP_COPY.freeTurnsHint(STONE_DISPLAY[stone].label)}>
            <Select
              value={value.freeTurns}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, freeTurns: Number(event.target.value) })}
              data-testid={`${testPrefix}-head-start-turns`}
            >
              {HEAD_START_FREE_TURNS.map((turns) => (
                <option key={turns} value={turns}>
                  {turns === 0 ? SET_UP_COPY.headStartNone : freeTurnsWords(turns)}
                </option>
              ))}
            </Select>
          </Field>

          {tradition !== null && counts.length > 0 ? (
            <Field label={`${tradition.label} · ${tradition.kanji}`} hint={`${tradition.description} From ${tradition.from}.`}>
              <Select
                value={counts.includes(value.traditional) ? value.traditional : 0}
                disabled={disabled}
                onChange={(event) => onChange({ ...value, traditional: Number(event.target.value) })}
                data-testid={`${testPrefix}-head-start-traditional`}
              >
                <option value={0}>{SET_UP_COPY.headStartNone}</option>
                {counts.map((given) => (
                  <option key={given} value={given}>
                    {tradition.count(given)}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
