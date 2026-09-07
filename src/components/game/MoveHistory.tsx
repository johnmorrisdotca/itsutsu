"use client";

import { pointName } from "@/lib/gomoku/notation";
import { MOVE_KINDS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { FATAL_MOVE_DISPLAY } from "@/lib/gomoku/analysis.constants";
import { SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/**
 * The game record (棋譜). Every entry is a position to jump to, which is what
 * makes review possible: the timeline behind it holds each state, so stepping
 * back here is the same mechanism as undo.
 */
export function MoveHistory({ session, actions }: GamePanelProps) {
  const { state, fatalMoves, moveIndex } = session;
  const fatalNumbers = new Set(fatalMoves.map((move) => move.moveNumber));

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle kanji={GAME_COPY.moveHistory.kanji}>
        {GAME_COPY.moveHistory.label}
      </SectionTitle>

      {state.moves.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {GAME_COPY.emptyRecord}
        </p>
      ) : (
        <ol
          className="max-h-56 overflow-y-auto rounded-lg border border-zinc-200/70 text-sm dark:border-zinc-800"
          data-testid="move-history"
        >
          {state.moves.map((move, index) => {
            const number = index + 1;
            const fatal = fatalNumbers.has(number);
            const current = moveIndex === number;

            return (
              <li key={number}>
                <button
                  type="button"
                  onClick={() => actions.jumpTo(number)}
                  className={`flex w-full items-center gap-2 px-2.5 py-1 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    current ? "bg-zinc-100 font-semibold dark:bg-zinc-800" : ""
                  }`}
                >
                  <span className="w-7 shrink-0 text-right font-mono text-xs text-zinc-400 tabular-nums">
                    {number}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`size-2.5 shrink-0 rounded-full ${
                      move.stone === "black"
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "border border-zinc-400 bg-white"
                    }`}
                  />
                  <span className="font-mono">
                    {pointName(state.settings.size, move)}
                  </span>
                  <span className="sr-only">
                    {STONE_DISPLAY[move.stone].label}
                  </span>
                  {move.kind === MOVE_KINDS.skip ? (
                    <span className="text-xs text-zinc-500">
                      {GAME_COPY.skip.kanji}
                    </span>
                  ) : null}
                  {fatal ? (
                    <span
                      className="ml-auto rounded px-1.5 py-0.5 text-[0.65rem] font-semibold text-rose-700 ring-1 ring-rose-300 dark:text-rose-300 dark:ring-rose-800"
                      title={FATAL_MOVE_DISPLAY.detail}
                    >
                      {FATAL_MOVE_DISPLAY.kanji}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
