import { RULE_VARIANT_LIST, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { Field, Select } from "@/components/ui/Controls";
import { BoardPicker } from "./BoardPicker";
import { GamePicker } from "./GamePicker";
import type { RulesDraft } from "./rulesDraft";

/**
 * THE TWO QUESTIONS THE SET-UP SCREEN EXISTS TO ASK: which game, and what board.
 *
 * The top of `RulesForm`, and only ever drawn by it. Everything else that form
 * asks is a setting about a game already chosen; these two choose the game. As
 * pictures on the screen whose whole job is choosing, and as selects in the
 * narrow panel beside a board — `pictures` is `RulesForm`'s `chooser`, read
 * once there. Every change still goes through the form's `applyRulesChange`,
 * handed in as `change`, so the two screens cannot drift.
 */
export function GameAndBoardChooser({
  value,
  disabled,
  showVariant,
  variantLabel,
  pictures,
  change,
  onSizeChosen,
}: {
  value: RulesDraft;
  disabled: boolean;
  showVariant: boolean;
  variantLabel: string;
  pictures: boolean;
  change: (next: Partial<RulesDraft>) => void;
  onSizeChosen?: (size: number) => void;
}) {
  const variant = value.variant as RuleVariant;
  const sizes = boardSizesFor(variant);

  return (
    <>
      {showVariant ? (
        pictures ? (
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
      {/*
        ALWAYS ON THE SCREEN THAT CHOOSES, EVEN WHEN THERE IS NOTHING TO
        CHOOSE. John: "And the Reversi games don't even have a board size…
        they should! It should show the board size (default) being used."

        Every Reversi variant has exactly one board — 8×8, or 6×6 for Mini and
        10×10 for Grand — so `boardSizesFor` returned one size and the picker
        hid itself, and the page went from the games straight to the rest of
        the rules with nothing said about what it would be played on. That is
        Show The Data read backwards: a picker with one option is not a choice,
        but the board is still a FACT, and the reader is about to play on it.

        The panel beside a board keeps the old rule and shows nothing, because
        the fact is already on that page — `describeRules` prints "Reversi
        リバーシ · 8×8 Eight" at the top of it — and a select holding one
        option in a narrow column beside a live game is furniture.
      */}
      {pictures ? (
        <BoardPicker
          value={value.size}
          sizes={sizes}
          disabled={disabled}
          onChange={(next) => {
            onSizeChosen?.(next);
            change({ size: next });
          }}
        />
      ) : sizes.length > 1 ? (
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
    </>
  );
}
