"use client";

import {
  HANDICAP_RULES,
  LINE_RULES,
  NO_HANDICAP,
  SECOND_STONE_EXCLUSIONS,
  STONES,
  STONE_DISPLAY,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import {
  HANDICAP_RULE_DISPLAY,
  RULE_VARIANT_DISPLAY,
  SECOND_STONE_EXCLUSION_DISPLAY,
} from "@/lib/gomoku/variants.constants";
import type {
  GameSettings,
  Handicap,
  HandicapRule,
  Stone,
} from "@/lib/gomoku/gomoku.types";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

const NONE = "none";

/**
 * Whether a toggle does anything for this colour under this variant, and if
 * not, why: some the variant already imposes, some only mean anything in a
 * game that captures or plays two stones a turn.
 */
function relevance(
  rule: HandicapRule,
  settings: GameSettings,
  stone: Stone,
): { available: boolean; imposed: boolean; note: string | null } {
  const spec = VARIANT_SPECS[settings.variant];
  const open = { available: true, imposed: false, note: null };
  const already = {
    available: false,
    imposed: true,
    note: `Already a rule of ${RULE_VARIANT_DISPLAY[settings.variant].label} for ${STONE_DISPLAY[stone].label.toLowerCase()}.`,
  };
  const elsewhere = (note: string) => ({ available: false, imposed: false, note });

  switch (rule) {
    case "doubleThree":
    case "doubleFour":
    case "overline":
      return spec.forbidden[stone].includes(rule) ? already : open;
    case "exactLine":
      return spec.lineRule[stone] === LINE_RULES.atLeast ? open : already;
    case "openLine":
      return spec.lineRule[stone] === LINE_RULES.exactOpen ? already : open;
    case "singleStone":
      return spec.stonesPerTurn > 1
        ? open
        : elsewhere("Only in a game that places two stones a turn.");
    case "noCaptures":
      return spec.captures ? open : elsewhere("Only in a game with captures.");
    case "longerLine":
      return open;
  }
}

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
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/70 p-3 dark:border-zinc-800">
          {HANDICAP_RULES.map((rule) => {
            const copy = HANDICAP_RULE_DISPLAY[rule];
            const { available, imposed, note } = relevance(rule, settings, stone);
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
