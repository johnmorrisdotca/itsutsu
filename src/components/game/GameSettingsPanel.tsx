"use client";

import {
  BOARD_SIZE_DISPLAY,
  FIRST_PLAYER_DISPLAY,
  FIRST_PLAYERS,
  OBSTACLE_LAYOUT_DISPLAY,
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  RULE_VARIANT_LIST,
  STARTING_DISCS,
  VARIANT_SPECS,
  WIN_LENGTHS,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import { openingFor } from "@/lib/gomoku/rules/flips";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import { availableOpenings } from "@/lib/gomoku/engine";
import type {
  FirstPlayer,
  ObstacleLayout,
  OpeningRule,
  RuleVariant,
} from "@/lib/gomoku/gomoku.types";
import {
  TIME_CONTROLS,
  TIME_CONTROL_DISPLAY,
  type TimeControlName,
} from "@/lib/clock/clock.constants";
import { Field, SectionTitle, Select, Toggle } from "@/components/ui/Controls";
import { GameBrowserButton } from "./GameBrowser";
import { HandicapPanel } from "./HandicapPanel";
import { settingsLocks } from "./settingsLocks";
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
  const { variant, size, firstPlayer, obstacles, opening } = settings;
  const spec = VARIANT_SPECS[variant];
  const openings = availableOpenings(settings);
  const locks = settingsLocks(settings);
  // Lines the reading cannot help with are greyed rather than hidden, so the rule is visible.
  const reading = locks.reading === null;
  const canChooseOpener =
    spec.allowFirstPlayerChoice && opening === OPENING_RULES.free;
  // Rules are set before the first stone and kept until the game is over.
  const begun = session.state.moves.length > 0;
  const centrePlaced = openingFor(settings) === STARTING_DISCS.fixed;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle kanji={GAME_COPY.settings.kanji}>
          {GAME_COPY.settings.label}
        </SectionTitle>
        <GameBrowserButton session={session} actions={actions} />
      </div>

      {begun ? (
        <p className="text-xs text-muted" data-testid="rules-locked">
          {GAME_COPY.rulesLocked}
        </p>
      ) : null}

      <fieldset disabled={begun} className="flex min-w-0 flex-col gap-4">
      <Field label="Board" hint={locks.size ?? undefined}>
        <Select
          value={size}
          disabled={locks.size !== null}
          onChange={(event) => actions.reset({ size: Number(event.target.value) })}
          data-testid="board-size"
        >
          {boardSizesFor(variant).map((option) => (
            <option key={option} value={option}>
              {option}×{option} · {BOARD_SIZE_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rules" hint={RULE_VARIANT_DISPLAY[variant].tagline}>
        <Select
          value={variant}
          onChange={(event) =>
            actions.reset({ variant: event.target.value as RuleVariant })
          }
          data-testid="rules"
        >
          {RULE_VARIANT_LIST.map((option) => (
            <option key={option} value={option}>
              {RULE_VARIANT_DISPLAY[option].label} · {RULE_VARIANT_DISPLAY[option].kanji}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={GAME_COPY.opening.label}
        hint={locks.opening ?? OPENING_DISPLAY[opening].tagline}
      >
        <Select
          value={opening}
          disabled={openings.length <= 1}
          onChange={(event) =>
            actions.reset({ opening: event.target.value as OpeningRule })
          }
          data-testid="opening"
        >
          {openings.map((option) => (
            <option key={option} value={option}>
              {OPENING_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={GAME_COPY.lineLength.label} hint={locks.winLength ?? GAME_COPY.lineLengthHint}>
        <Select
          value={settings.winLength}
          disabled={locks.winLength !== null}
          onChange={(event) =>
            actions.reset({ winLength: Number(event.target.value) })
          }
          data-testid="win-length"
        >
          {(locks.winLength !== null && !(WIN_LENGTHS as readonly number[]).includes(settings.winLength)
            ? [settings.winLength]
            : WIN_LENGTHS
          ).map((option) => (
            <option key={option} value={option}>
              {option} in a row
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

      <Field label="Obstacles" hint={locks.obstacles ?? OBSTACLE_LAYOUT_DISPLAY[obstacles].description}>
        <Select
          value={obstacles}
          disabled={locks.obstacles !== null}
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

      {spec.flips ? (
        <div data-testid="centre-discs">
          <Toggle
            label={GAME_COPY.centreDiscs.label}
            checked={centrePlaced}
            onChange={(next) =>
              actions.reset({ openingDiscs: next ? STARTING_DISCS.fixed : STARTING_DISCS.laid })
            }
            hint={GAME_COPY.centreDiscsHint}
          />
        </div>
      ) : null}
      </fieldset>

      <details className="group flex flex-col gap-3">
        <summary className="cursor-pointer list-none text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase select-none hover:text-ink">
          {GAME_COPY.advanced.label} {GAME_COPY.advanced.kanji}
          <span className="ml-1 opacity-60 group-open:hidden">+</span>
          <span className="ml-1 hidden opacity-60 group-open:inline">−</span>
        </summary>

        <div className="mt-3 flex flex-col gap-3">
          <fieldset disabled={begun} className="flex min-w-0 flex-col gap-3">
          <HandicapPanel session={session} actions={actions} />

          <Toggle
            label="Allow taking moves back"
            checked={settings.allowUndo}
            onChange={(next) => actions.reset({ allowUndo: next })}
            hint="Switch off for a game where every stone is final."
          />
          <Toggle
            label="Allow skipping a turn"
            checked={locks.allowSkip === null && settings.allowSkip}
            disabled={locks.allowSkip !== null}
            onChange={(next) => actions.reset({ allowSkip: next })}
            hint={locks.allowSkip ?? GAME_COPY.skipHint}
          />
          <Toggle
            label="Allow swapping seats"
            checked={settings.allowSwap}
            onChange={(next) => actions.reset({ allowSwap: next })}
            hint={GAME_COPY.swapHint}
          />
          <Toggle
            label="Allow resizing the board"
            checked={settings.allowResize}
            onChange={(next) => actions.reset({ allowResize: next })}
            hint={GAME_COPY.resizeHint}
          />
          </fieldset>

          <Field
            label="Clock"
            hint={TIME_CONTROL_DISPLAY[session.settings.timeControl].description}
          >
            <Select
              value={session.settings.timeControl}
              onChange={(event) =>
                actions.setSessionSettings({
                  timeControl: event.target.value as TimeControlName,
                })
              }
              data-testid="time-control"
            >
              {Object.keys(TIME_CONTROLS).map((option) => (
                <option key={option} value={option}>
                  {TIME_CONTROL_DISPLAY[option as TimeControlName].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Awareness"
            hint={locks.reading ?? AWARENESS_DISPLAY[session.settings.awareness].description}
          >
            <Select
              value={session.settings.awareness}
              disabled={!reading}
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
            hint={locks.reading ?? HINT_POLICY_DISPLAY[session.settings.hintPolicy].description}
          >
            <Select
              value={session.settings.hintPolicy}
              disabled={!reading}
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

          <Toggle
            label="Warn before a three forms"
            checked={reading && session.settings.earlyWarning}
            disabled={!reading}
            onChange={(next) => actions.setSessionSettings({ earlyWarning: next })}
            hint={locks.reading ?? GAME_COPY.earlyWarningHint}
          />

          <Toggle
            label="Show chance of winning"
            checked={reading && session.settings.showWinChance}
            disabled={!reading}
            onChange={(next) => actions.setSessionSettings({ showWinChance: next })}
            hint={locks.reading ?? GAME_COPY.winChanceNote}
          />

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

      <p className="text-xs text-muted">
        Changing a rule starts a new game.
      </p>
    </section>
  );
}
