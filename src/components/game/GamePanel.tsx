"use client";

import { canUndo } from "@/lib/gomoku/engine";
import {
  BOARD_SIZES,
  GAME_STATUS,
  RULE_VARIANT_DISPLAY,
  RULE_VARIANTS,
  STONE_DISPLAY,
} from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { StoneMark } from "@/components/board/StoneMark";
import type { GamePanelProps } from "./game.types";

const BUTTON_CLASS =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

const SELECT_CLASS =
  "rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

function Status({ state }: { state: GameState }) {
  if (state.status === GAME_STATUS.draw) {
    return <p className="text-lg font-semibold">Draw. The board is full.</p>;
  }

  const stone = state.status === GAME_STATUS.won ? state.winner : state.toPlay;
  if (stone === null) return null;
  const { label, kanji } = STONE_DISPLAY[stone];
  const text =
    state.status === GAME_STATUS.won
      ? `${label} wins in ${state.moves.length} moves`
      : `${label} to play`;

  return (
    <p className="flex items-center gap-2 text-lg font-semibold">
      <span className="relative flex size-6 items-center justify-center">
        <StoneMark stone={stone} />
      </span>
      <span>
        {text}
        <span className="ml-2 text-base font-normal text-zinc-500">{kanji}</span>
      </span>
    </p>
  );
}

export function GamePanel({ state, onUndo, onReset }: GamePanelProps) {
  const { size, variant } = state.settings;

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-64">
      <section aria-live="polite" className="flex flex-col gap-1">
        <Status state={state} />
        <p className="text-sm text-zinc-500">
          Move {state.moves.length + 1}
        </p>
      </section>

      <section className="flex gap-2">
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={onUndo}
          disabled={!canUndo(state)}
        >
          Undo
        </button>
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => onReset()}
        >
          New game
        </button>
      </section>

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
          Settings
        </h2>
        <label className="flex items-center justify-between gap-3 text-sm">
          Board
          <select
            className={SELECT_CLASS}
            value={size}
            onChange={(event) => onReset({ size: Number(event.target.value) })}
          >
            {BOARD_SIZES.map((option) => (
              <option key={option} value={option}>
                {option} × {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          Rules
          <select
            className={SELECT_CLASS}
            value={variant}
            onChange={(event) =>
              onReset({ variant: event.target.value as RuleVariant })
            }
          >
            {Object.values(RULE_VARIANTS).map((option) => (
              <option key={option} value={option}>
                {RULE_VARIANT_DISPLAY[option].label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-zinc-500">
          {RULE_VARIANT_DISPLAY[variant].description} Changing a setting starts
          a new game.
        </p>
      </section>
    </aside>
  );
}
