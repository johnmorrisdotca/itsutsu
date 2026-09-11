"use client";

import {
  RULE_VARIANT_LIST,
  boardSizesFor,
} from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import {
  MOVE_TIME_OPTIONS,
  SHARED_OPENINGS,
  TIMEOUT_PENALTIES,
} from "@/lib/history/gameSettingsSchema";
import { describeMoveTime } from "@/lib/history/deadline";
import { GAME_COPY } from "@/components/game/game.constants";
import { Field, Select, Toggle } from "@/components/ui/Controls";
import { penaltyName } from "./penalty";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";

/**
 * The rules of a shared game, as a form.
 *
 * One form, used twice: on the setup screen, where it edits a draft and no
 * game exists yet, and beside a board, where each change is sent to the
 * server. It knows nothing about either — it is handed a value and gives back
 * the next one — so the two screens cannot come to offer different rules, or
 * the same rule under a different name.
 *
 * Every change goes through `applyRulesChange`, so a setting that cannot sit
 * with another is corrected here, where somebody can watch it happen, rather
 * than silently on the way into the database.
 */
export function RulesForm({
  value,
  onChange,
  disabled = false,
  /** The setup screen posts a seat by choosing an opponent, so it hides this. */
  showOpen = true,
  /**
   * The setup screen hides this: its address names the game, and a form that
   * could change the game underneath it would leave the two disagreeing —
   * which is the whole thing that screen exists to stop.
   */
  showVariant = true,
  variantLabel = "Rules",
  onSizeChosen,
}: {
  value: RulesDraft;
  onChange: (next: RulesDraft) => void;
  disabled?: boolean;
  showOpen?: boolean;
  showVariant?: boolean;
  /**
   * What to call the chooser at the top.
   *
   * "Rules" is right where a game has already been chosen and this is the set
   * of rules it is played under. It is wrong where the chooser IS the game —
   * on the screen whose whole job is picking one, "Rules" reads as sub-settings
   * and the first thing you do reads as the last.
   */
  variantLabel?: string;
  /**
   * Told when somebody chooses a board themselves, so a caller that was
   * following a default can stop. A chosen board is not a default.
   */
  onSizeChosen?: (size: number) => void;
}) {
  const change = (next: Partial<RulesDraft>) => onChange(applyRulesChange(value, next));
  const variant = value.variant as RuleVariant;
  const sizes = boardSizesFor(variant);

  return (
    <>
      {showVariant ? (
        <Field label={variantLabel} hint={RULE_VARIANT_DISPLAY[variant]?.tagline}>
          <Select
            value={value.variant}
            disabled={disabled}
            onChange={(event) => change({ variant: event.target.value })}
            data-testid="shared-rules-variant"
          >
            {RULE_VARIANT_LIST.map((option) => (
              <option key={option} value={option}>
                {RULE_VARIANT_DISPLAY[option].label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      {/*
        The boards this game has, not every board the site knows. A Reversi
        game was offering 9×9, 13×13, 15×15 and 19×19 — none of which Reversi
        is played on — and showing 9×9 as the current board of an 8×8 game,
        because 8 was not in the list for anything to match.
      */}
      {sizes.length > 1 ? (
        <Field label="Board">
          <Select
            value={value.size}
            disabled={disabled}
            onChange={(event) => {
              onSizeChosen?.(Number(event.target.value));
              change({ size: Number(event.target.value) });
            }}
            data-testid="shared-rules-size"
          >
            {sizes.map((option) => (
              <option key={option} value={option}>
                {option}×{option}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Opening">
        <Select
          value={value.opening}
          disabled={disabled}
          onChange={(event) => change({ opening: event.target.value })}
          data-testid="shared-rules-opening"
        >
          {SHARED_OPENINGS.map((option) => (
            <option key={option} value={option}>
              {OPENING_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>
      <Toggle
        label={GAME_COPY.allowResign.label}
        hint={GAME_COPY.allowResignHint}
        checked={value.allowResign}
        onChange={(next) => change({ allowResign: next })}
        disabled={disabled}
      />
      {showOpen ? (
        <Toggle
          label={GAME_COPY.openSeat.label}
          hint={GAME_COPY.openSeatHint}
          checked={value.open}
          onChange={(next) => change({ open: next })}
          disabled={disabled}
        />
      ) : null}
      <Field label={GAME_COPY.moveTime.label}>
        <Select
          value={value.moveTimeMs === null ? "none" : String(value.moveTimeMs)}
          disabled={disabled}
          onChange={(event) =>
            change({ moveTimeMs: event.target.value === "none" ? null : Number(event.target.value) })
          }
          data-testid="shared-rules-move-time"
        >
          {MOVE_TIME_OPTIONS.map((option) => (
            <option key={option ?? "none"} value={option === null ? "none" : option}>
              {describeMoveTime(option)}
            </option>
          ))}
        </Select>
      </Field>
      {value.moveTimeMs !== null ? (
        <Field label="Clock">
          <Select
            value={value.clockMode}
            disabled={disabled}
            onChange={(event) => change({ clockMode: event.target.value })}
            data-testid="shared-rules-clock-mode"
          >
            <option value="move">Time is per move</option>
            <option value="game">Time is for the whole game</option>
          </Select>
        </Field>
      ) : null}
      <Field label="Ratings">
        <Select
          value={value.rated ? "rated" : "friendly"}
          disabled={disabled}
          onChange={(event) => change({ rated: event.target.value === "rated" })}
          data-testid="shared-rules-rated"
        >
          <option value="rated">Game will affect ratings</option>
          <option value="friendly">Game will NOT affect ratings</option>
        </Select>
      </Field>
      {/*
        The hint explains all three, because this is where somebody is choosing
        between them and the option itself is only a name. What this game's
        setting actually means is said in full in the statement, once there is
        nothing left to choose.
      */}
      {value.moveTimeMs !== null && value.clockMode !== "game" ? (
        <Field label={GAME_COPY.penalty.label} hint={GAME_COPY.penaltyHint}>
          <Select
            value={value.timeoutPenalty}
            disabled={disabled}
            onChange={(event) => change({ timeoutPenalty: event.target.value })}
            data-testid="shared-rules-penalty"
          >
            {TIMEOUT_PENALTIES.map((option) => (
              <option key={option} value={option}>
                {penaltyName(option)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </>
  );
}
