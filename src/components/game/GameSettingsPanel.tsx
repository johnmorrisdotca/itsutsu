"use client";

import {
  BOARD_SIZE_DISPLAY,
  BOARD_SIZES,
  FIRST_PLAYER_DISPLAY,
  FIRST_PLAYERS,
  OBSTACLE_LAYOUT_DISPLAY,
  OBSTACLE_LAYOUTS,
  RULE_VARIANT_DISPLAY,
  RULE_VARIANTS,
  VARIANT_ALLOWS_FIRST_PLAYER_CHOICE,
} from "@/lib/gomoku/gomoku.constants";
import type {
  FirstPlayer,
  ObstacleLayout,
  RuleVariant,
} from "@/lib/gomoku/gomoku.types";
import { Field, SectionTitle, Select, Toggle } from "@/components/ui/Controls";
import {
  AWARENESS_DISPLAY,
  AWARENESS_LEVELS,
  GAME_COPY,
  HINT_POLICIES,
  HINT_POLICY_DISPLAY,
} from "./game.constants";
import type { AwarenessLevel, GamePanelProps, HintPolicy } from "./game.types";

export function GameSettingsPanel({ session, actions }: GamePanelProps) {
  const { settings } = session.state;
  const { variant, size, firstPlayer, obstacles } = settings;
  const canChooseOpener = VARIANT_ALLOWS_FIRST_PLAYER_CHOICE[variant];

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle kanji={GAME_COPY.settings.kanji}>
        {GAME_COPY.settings.label}
      </SectionTitle>

      <Field label="Board">
        <Select
          value={size}
          onChange={(event) => actions.reset({ size: Number(event.target.value) })}
          data-testid="board-size"
        >
          {BOARD_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}×{option} · {BOARD_SIZE_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rules" hint={RULE_VARIANT_DISPLAY[variant].description}>
        <Select
          value={variant}
          onChange={(event) =>
            actions.reset({ variant: event.target.value as RuleVariant })
          }
        >
          {Object.values(RULE_VARIANTS).map((option) => (
            <option key={option} value={option}>
              {RULE_VARIANT_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="First stone"
        hint={
          canChooseOpener
            ? undefined
            : `${RULE_VARIANT_DISPLAY[variant].label} always opens with black.`
        }
      >
        <Select
          value={canChooseOpener ? firstPlayer : FIRST_PLAYERS.black}
          disabled={!canChooseOpener}
          onChange={(event) =>
            actions.reset({ firstPlayer: event.target.value as FirstPlayer })
          }
          data-testid="first-player"
        >
          {Object.values(FIRST_PLAYERS).map((option) => (
            <option key={option} value={option}>
              {FIRST_PLAYER_DISPLAY[option].label} · {FIRST_PLAYER_DISPLAY[option].kanji}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Obstacles" hint={OBSTACLE_LAYOUT_DISPLAY[obstacles].description}>
        <Select
          value={obstacles}
          onChange={(event) =>
            actions.reset({ obstacles: event.target.value as ObstacleLayout })
          }
          data-testid="obstacles"
        >
          {Object.values(OBSTACLE_LAYOUTS).map((option) => (
            <option key={option} value={option}>
              {OBSTACLE_LAYOUT_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>

      <details className="group flex flex-col gap-3">
        <summary className="cursor-pointer list-none text-[0.7rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase select-none hover:text-zinc-800 dark:hover:text-zinc-200">
          {GAME_COPY.advanced.label} {GAME_COPY.advanced.kanji}
          <span className="ml-1 opacity-60 group-open:hidden">+</span>
          <span className="ml-1 hidden opacity-60 group-open:inline">−</span>
        </summary>

        <div className="mt-3 flex flex-col gap-3">
          <Toggle
            label="Allow taking moves back"
            checked={settings.allowUndo}
            onChange={(next) => actions.reset({ allowUndo: next })}
            hint="Switch off for a game where every stone is final."
          />
          <Toggle
            label="Allow skipping a turn"
            checked={settings.allowSkip}
            onChange={(next) => actions.reset({ allowSkip: next })}
            hint={GAME_COPY.skipHint}
          />
          <Toggle
            label="Allow swapping seats"
            checked={settings.allowSwap}
            onChange={(next) => actions.reset({ allowSwap: next })}
            hint={GAME_COPY.swapHint}
          />

          <Field
            label="Awareness"
            hint={AWARENESS_DISPLAY[session.settings.awareness].description}
          >
            <Select
              value={session.settings.awareness}
              onChange={(event) =>
                actions.setSessionSettings({
                  awareness: event.target.value as AwarenessLevel,
                })
              }
              data-testid="awareness"
            >
              {Object.values(AWARENESS_LEVELS).map((option) => (
                <option key={option} value={option}>
                  {AWARENESS_DISPLAY[option].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Hints"
            hint={HINT_POLICY_DISPLAY[session.settings.hintPolicy].description}
          >
            <Select
              value={session.settings.hintPolicy}
              onChange={(event) =>
                actions.setSessionSettings({
                  hintPolicy: event.target.value as HintPolicy,
                })
              }
            >
              {Object.values(HINT_POLICIES).map((option) => (
                <option key={option} value={option}>
                  {HINT_POLICY_DISPLAY[option].label}
                </option>
              ))}
            </Select>
          </Field>

          {session.settings.hintPolicy === HINT_POLICIES.limited ? (
            <Field label="Hints each">
              <Select
                value={session.settings.hintsPerSeat}
                onChange={(event) =>
                  actions.setSessionSettings({
                    hintsPerSeat: Number(event.target.value),
                  })
                }
              >
                {[1, 2, 3, 5, 10].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>
      </details>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Changing a rule starts a new game.
      </p>
    </section>
  );
}
