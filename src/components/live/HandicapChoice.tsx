"use client";

import {
  HANDICAP_RULES,
  NO_HANDICAP,
  SECOND_STONE_EXCLUSIONS,
  STONES,
  STONE_DISPLAY,
} from "@/lib/gomoku/gomoku.constants";
import { SECOND_STONE_EXCLUSION_DISPLAY } from "@/lib/gomoku/variants.constants";
import { HANDICAP_RULE_DISPLAY } from "@/lib/gomoku/openings.constants";
import { handicapOffer } from "@/lib/gomoku/handicapOffer";
import type { Handicap, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import { GAME_COPY } from "@/components/game/game.constants";
import { SET_UP_COPY } from "./live.constants";

/** No colour is carrying a handicap: the ordinary game, which is most games. */
const NONE = "none";

/**
 * A HANDICAP, SETTLED BEFORE THE GAME EXISTS.
 *
 * John's words, and the one thing this screen had no answer for: "you're
 * playing someone who's not very strong — you want to, in the settings page,
 * give yourself a handicap to help them out." The engine has had handicaps
 * since early on — `rulesFor` in `rules/handicap.ts` lays one over the
 * variant's spec for a single colour — and until now the only place a shared
 * game could touch one was a button beside a live board that could REMOVE a
 * handicap and never add one. So the feature existed, nobody could ask for it,
 * and the one control that mentioned it could only undo something that had no
 * way of being done.
 *
 * It belongs here by definition: it is a rule of the game, it is a thing the
 * two players have to have agreed, and the whole point of this screen is that
 * the rules are settled before there is a board to argue over them on.
 *
 * FOLDED AWAY UNTIL IT IS WANTED. Almost every game is played straight, and a
 * screenful of nine restrictions above the Start button would make the
 * ordinary case read as the complicated one. Choosing a colour opens it.
 *
 * It is its own component rather than another field inside `RulesForm` because
 * that form is used at a live board too, where a handicap cannot be changed
 * the same way — `SharedRules` sends the game's own handicap back untouched on
 * every rules change, deliberately — and because this is the one part of the
 * screen that is a small form of its own rather than a row.
 */
export function HandicapChoice({
  value,
  variant,
  onChange,
  disabled = false,
}: {
  value: Handicap;
  /** The game it is laid over: which toggles mean anything is a fact about that. */
  variant: string;
  onChange: (next: Handicap) => void;
  disabled?: boolean;
}) {
  const stone = value.stone;
  const known = variant as RuleVariant;

  return (
    <div className="flex flex-col gap-3" data-testid="set-up-handicap">
      <Field label={GAME_COPY.handicap.label} hint={SET_UP_COPY.handicapHint}>
        <Select
          value={stone ?? NONE}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value === NONE
                ? NO_HANDICAP
                : /*
                   * Built from NO_HANDICAP rather than from whatever was there,
                   * so switching the colour does not silently hand the other
                   * player a set of restrictions chosen for their opponent.
                   */
                  { ...NO_HANDICAP, stone: event.target.value as Stone }
            )
          }
          data-testid="set-up-handicap-stone"
        >
          <option value={NONE}>{GAME_COPY.handicapNone}</option>
          {Object.values(STONES).map((option) => (
            <option key={option} value={option}>
              {STONE_DISPLAY[option].label} · {STONE_DISPLAY[option].kanji}
            </option>
          ))}
        </Select>
      </Field>

      {stone !== null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rule p-3">
          <p className="text-xs text-muted">{SET_UP_COPY.handicapOpen(STONE_DISPLAY[stone].label)}</p>
          {HANDICAP_RULES.map((rule) => {
            const copy = HANDICAP_RULE_DISPLAY[rule];
            /*
             * The same table the local board's panel reads — see
             * `handicapOffer`. A toggle the game already imposes shows as on
             * and cannot come off, because a reader comparing renju with
             * gomoku wants to see that renju already forbids the double three
             * rather than find the row missing.
             */
            const { available, imposed, note } = handicapOffer(rule, known, stone);
            return (
              <div key={rule} className={available ? undefined : "opacity-60"}>
                <Toggle
                  label={`${copy.label} · ${copy.kanji}`}
                  checked={available ? value[rule] : imposed}
                  disabled={disabled || !available}
                  onChange={(next) => (available ? onChange({ ...value, [rule]: next }) : undefined)}
                  hint={`${copy.description} From ${copy.from}.${note !== null ? ` ${note}` : ""}`}
                />
              </div>
            );
          })}

          <Field label={GAME_COPY.secondStone.label} hint={GAME_COPY.secondStoneHint}>
            <Select
              value={value.secondStoneExclusion}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...value, secondStoneExclusion: Number(event.target.value) })
              }
              data-testid="set-up-handicap-second-stone"
            >
              {SECOND_STONE_EXCLUSIONS.map((option) => (
                <option key={option} value={option}>
                  {SECOND_STONE_EXCLUSION_DISPLAY[option].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}
    </div>
  );
}
