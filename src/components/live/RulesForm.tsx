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
import type { ReactNode } from "react";
import { BoardPicker } from "./BoardPicker";
import { GamePicker } from "./GamePicker";
import { MoreSettings } from "./MoreSettings";
import { penaltyName } from "./penalty";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";
import { describeSettings, type SettingWord } from "./rulesSummary";

/**
 * How the two biggest choices are drawn. NOT which rules are offered — that
 * is the same set on both screens and always will be, which is the whole
 * reason this form is one component used twice.
 *
 * `select` is the rules panel beside a board: a narrow column next to a game
 * already in progress, where a row of board pictures would crowd out the
 * board it is about.
 *
 * `pictures` is the screen whose entire job is choosing — /games/new, where
 * John's word for the dropdown was UGLY and the games have forty board
 * photographs between them that were going unused.
 */
export const RULES_CHOOSERS = { select: "select", pictures: "pictures" } as const;

export type RulesChooser = (typeof RULES_CHOOSERS)[keyof typeof RULES_CHOOSERS];

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
  chooser = RULES_CHOOSERS.select,
  fold,
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
   * How the game and the board are drawn — see RULES_CHOOSERS. One prop
   * rather than two flags, because it is one decision: whether this is the
   * screen that CHOOSES a game or the panel that AMENDS one. Everything
   * either branch offers comes from the same tables and goes through the
   * same `applyRulesChange`, so the two screens still cannot drift.
   */
  chooser?: RulesChooser;
  /**
   * Fold everything that is not the game or the board behind a line saying
   * what it currently is — see `MoreSettings` for the measurement that made
   * this necessary rather than nice.
   *
   * ONE PROP RATHER THAN A FLAG AND TWO SLOTS, because it is one idea: the
   * caller has settings of its own to fold in with these, and saying so is
   * what asks for the fold. The setup screen's opponent belongs inside the
   * same drawer as the clock — it is a setting about a game already chosen —
   * but it lives in that screen rather than in these rules, so it arrives
   * here instead of being reached for.
   *
   * Absent on the panel beside a board, where every rule is inline: that
   * panel is a narrow column about a game already in progress, there is no
   * Start button under it to push off a screen, and a reader who opened it
   * came to read the rules rather than to choose a game.
   */
  fold?: {
    /** The caller's own words, appended after the rules' own. */
    summary: SettingWord[];
    /** The caller's own controls, placed inside after the rules' own. */
    fields: ReactNode;
  };
  /**
   * Told when somebody chooses a board themselves, so a caller that was
   * following a default can stop. A chosen board is not a default.
   */
  onSizeChosen?: (size: number) => void;
}) {
  const change = (next: Partial<RulesDraft>) => onChange(applyRulesChange(value, next));
  const variant = value.variant as RuleVariant;
  const sizes = boardSizesFor(variant);

  /*
   * THE TWO QUESTIONS THE SCREEN EXISTS TO ASK: which game, and what board.
   * Everything else is a setting about a game already chosen, and `fold` is
   * what lets a caller put that distinction on the screen.
   */
  const head = (
    <>
      {showVariant ? (
        chooser === RULES_CHOOSERS.pictures ? (
          <GamePicker
            value={value.variant}
            disabled={disabled}
            onChange={(next) => change({ variant: next })}
            label={variantLabel}
          />
        ) : (
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
        )
      ) : null}
      {/*
        The boards this game has, not every board the site knows. A Reversi
        game was offering 9×9, 13×13, 15×15 and 19×19 — none of which Reversi
        is played on — and showing 9×9 as the current board of an 8×8 game,
        because 8 was not in the list for anything to match.
      */}
      {sizes.length > 1 ? (
        chooser === RULES_CHOOSERS.pictures ? (
          <BoardPicker
            value={value.size}
            sizes={sizes}
            disabled={disabled}
            onChange={(next) => {
              onSizeChosen?.(next);
              change({ size: next });
            }}
          />
        ) : (
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
        )
      ) : null}
    </>
  );

  /*
   * The rest: the opening, resigning, the clock, the ratings, and what
   * running out of time costs. Unchanged — they move behind the disclosure
   * exactly as they are — and rendered in the same order whether they are
   * folded or not, so the two screens cannot come to put them differently.
   */
  const rest = (
    <>
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

  /*
   * Inline unless the caller asked for the rest to be folded. The summary is
   * built HERE, from the same `value` the controls above are bound to, so it
   * cannot describe a game other than the one the button would start — see
   * `describeSettings`. The caller's own words come after, in the order its
   * own fields appear inside.
   */
  if (fold === undefined) {
    return (
      <>
        {head}
        {rest}
      </>
    );
  }
  return (
    <>
      {head}
      <MoreSettings summary={[...describeSettings(value), ...fold.summary]}>
        {rest}
        {fold.fields}
      </MoreSettings>
    </>
  );
}
