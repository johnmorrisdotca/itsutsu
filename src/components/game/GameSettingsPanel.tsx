"use client";

import {
  BOARD_SIZE_DISPLAY,
  DRAW_LIMIT_DISPLAY,
  DRAW_LIMIT_LIST,
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
  DrawLimit,
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
  /*
   * "Fixed by Reversi." was under every setting Reversi fixes — four times on
   * one panel, ten places in this file that could say it. Said once, above,
   * and the rows that would have repeated it carry their own hint or none.
   *
   * Only that one sentence is dropped. `locks.reading` and `locks.advantage`
   * have reasons of their own — a game whose threats cannot be read is not
   * the same statement as a board this game fixes — and those still speak for
   * themselves where they apply.
   */
  const fixedBy = GAME_COPY.fixedBy(RULE_VARIANT_DISPLAY[variant].label);
  const said = (lock: string | null, otherwise?: string) =>
    lock === null ? otherwise : lock === fixedBy ? undefined : lock;
  /*
   * A setting the game has settled is STATED, not drawn as a control that
   * cannot be used.
   *
   * It used to be a disabled select showing one option, on the reasoning that
   * a greyed control is how a player reads the rules at a glance. That was
   * true when there was nowhere else to read them. There is now: the panel is
   * folded behind a summary that states the rules, so a dead control is the
   * third place the same fact appears — and it pays a control's height to say
   * what a clause says, while promising an interaction it will not honour.
   *
   * John's call, made on purpose rather than slipped in under a refactor:
   * the test that pinned the old behaviour was rewritten with it.
   */
  const settled = [
    // "8×8" and not "8×8 eight": the size names are for choosing between
    // boards, and there is no choosing here.
    locks.size === null ? null : `${size}×${size}`,
    locks.opening === null ? null : `${OPENING_DISPLAY[opening].label.toLowerCase()} opening`,
    locks.winLength === null ? null : `${settings.winLength} in a row`,
    locks.obstacles === null ? null : OBSTACLE_LAYOUT_DISPLAY[obstacles].label.toLowerCase(),
  ].filter((one): one is string => one !== null);
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

      {settled.length > 0 ? (
        <p className="text-sm text-ink-soft" data-testid="fixed-by-rules">
          <span className="text-muted">{fixedBy}</span> {settled.join(" · ")}
        </p>
      ) : null}

      <fieldset disabled={begun} className="flex min-w-0 flex-col gap-4">
      {locks.size === null ? (
      <Field label="Board" hint={said(locks.size)}>
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
      ) : null}

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

      {locks.opening === null ? (
      <Field
        label={GAME_COPY.opening.label}
        hint={said(locks.opening, OPENING_DISPLAY[opening].tagline)}
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
      ) : null}

      {locks.winLength === null ? (
      <Field label={GAME_COPY.lineLength.label} hint={said(locks.winLength, GAME_COPY.lineLengthHint)}>
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
      ) : null}

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

      {locks.obstacles === null ? (
      <Field label="Obstacles" hint={said(locks.obstacles, OBSTACLE_LAYOUT_DISPLAY[obstacles].description)}>
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
      ) : null}

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
            hint={said(locks.allowSkip, GAME_COPY.skipHint)}
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

          {/*
            How long the game may run. A share of the board rather than a
            number of moves, so the same choice means something sensible on
            every size and nobody has to work anything out.
          */}
          <Field
            label="Length"
            hint={said(locks.drawLimit, DRAW_LIMIT_DISPLAY[settings.drawLimit].blurb)}
          >
            <Select
              value={settings.drawLimit}
              disabled={locks.drawLimit !== null}
              onChange={(event) =>
                actions.reset({ drawLimit: event.target.value as DrawLimit })
              }
              data-testid="draw-limit"
            >
              {DRAW_LIMIT_LIST.map((limit) => (
                <option key={limit} value={limit}>
                  {DRAW_LIMIT_DISPLAY[limit].label} {DRAW_LIMIT_DISPLAY[limit].kanji}
                </option>
              ))}
            </Select>
          </Field>
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
            label={GAME_COPY.advantage.label}
            checked={locks.advantage === null && session.settings.showAdvantage}
            disabled={locks.advantage !== null}
            onChange={(next) => actions.setSessionSettings({ showAdvantage: next })}
            hint={locks.advantage ?? GAME_COPY.advantageHint}
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
