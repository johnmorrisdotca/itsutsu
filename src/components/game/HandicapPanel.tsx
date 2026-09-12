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
import type { Handicap, Stone } from "@/lib/gomoku/gomoku.types";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

const NONE = "none";

/**
 * A handicap for one colour, built from the restrictions the variants impose:
 * the stronger player takes on the rules of a harder game while the other
 * plays the plain one. Changing any of it starts a new game.
 */
export function HandicapPanel({ session, actions }: GamePanelProps) {
  const { settings } = session.state;
  const { handicap } = settings;
  const stone = handicap.stone;

  const update = (next: Partial<Handicap>) =>
    actions.reset({ handicap: { ...handicap, ...next } });

  return (
    <div className="flex flex-col gap-3" data-testid="handicap-panel">
      <Field label={GAME_COPY.handicap.label} hint={GAME_COPY.handicapHint}>
        <Select
          value={stone ?? NONE}
          onChange={(event) =>
            event.target.value === NONE
              ? actions.reset({ handicap: NO_HANDICAP })
              : update({ stone: event.target.value as Stone })
          }
          data-testid="handicap-stone"
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
          {HANDICAP_RULES.map((rule) => {
            const copy = HANDICAP_RULE_DISPLAY[rule];
            const { available, imposed, note } = handicapOffer(rule, settings.variant, stone);
            return (
              <div key={rule} className={available ? undefined : "opacity-60"}>
                <Toggle
                  label={`${copy.label} · ${copy.kanji}`}
                  checked={available ? handicap[rule] : imposed}
                  onChange={(next) => (available ? update({ [rule]: next }) : undefined)}
                  hint={`${copy.description} From ${copy.from}.${note !== null ? ` ${note}` : ""}`}
                />
              </div>
            );
          })}

          <Field
            label={GAME_COPY.secondStone.label}
            hint={GAME_COPY.secondStoneHint}
          >
            <Select
              value={handicap.secondStoneExclusion}
              onChange={(event) =>
                update({ secondStoneExclusion: Number(event.target.value) })
              }
              data-testid="handicap-second-stone"
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
