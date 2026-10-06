"use client";

import {
  HANDICAP_RULES,
  NO_HANDICAP,
  SECOND_STONE_EXCLUSIONS,
  STONES,
  STONE_DISPLAY,
} from "@/lib/gomoku/gomoku.constants";
import { handicapCopy, secondStoneLabel } from "@/lib/gomoku/openingCopy";
import { dottedText, stoneName } from "@/lib/gomoku/seatWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { handicapOffer } from "@/lib/gomoku/handicapOffer";
import type { Handicap, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import { gameCopy } from "@/components/game/game.constants";
import { setUpCopy } from "./live.constants";

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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const SET_UP_COPY = setUpCopy(say);
  const stone = value.stone;
  const known = variant as RuleVariant;

  return (
    <div className="flex flex-col gap-3" data-testid="set-up-handicap">
      {/*
        "Harder rules for", not "Handicap" again: the group's heading already says
        Handicap, and this control asks which colour takes on the harder game. A
        head start for the weaker colour is its own control, above it: HeadStartChoice.
      */}
      <Field label={SET_UP_COPY.handicapFor} hint={SET_UP_COPY.handicapHint}>
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
              {dottedText(say, stoneName(say, option), STONE_DISPLAY[option].kanji)}
            </option>
          ))}
        </Select>
      </Field>

      {stone !== null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rule p-3">
          <p className="text-xs text-muted">{SET_UP_COPY.handicapOpen(stoneName(say, stone))}</p>
          {HANDICAP_RULES.map((rule) => {
            const copy = handicapCopy(rule, say.locale);
            /*
             * The same table the local board's panel reads — see
             * `handicapOffer`. A toggle the game already imposes shows as on
             * and cannot come off, because a reader comparing renju with
             * gomoku wants to see that renju already forbids the double three
             * rather than find the row missing.
             */
            const { available, imposed, note } = handicapOffer(rule, known, stone, say);
            return (
              <div key={rule} className={available ? undefined : "opacity-60"}>
                <Toggle
                  label={dottedText(say, copy.label, copy.kanji)}
                  checked={available ? value[rule] : imposed}
                  disabled={disabled || !available}
                  onChange={(next) => (available ? onChange({ ...value, [rule]: next }) : undefined)}
                  hint={say.sentences([say.say("live.sourceLine", { description: copy.description, from: copy.from }), ...(note !== null ? [note] : [])])}
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
                  {secondStoneLabel(option, say.locale)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}
    </div>
  );
}
