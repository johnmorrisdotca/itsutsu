"use client";

import { pointName } from "@/lib/gomoku/notation";
import { MOVE_KINDS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { FATAL_MOVE_DISPLAY } from "@/lib/gomoku/analysis.constants";
import { SectionTitle, Select } from "@/components/ui/Controls";
import {
  GAME_COPY,
  HISTORY_MODES,
  HISTORY_MODE_DISPLAY,
} from "./game.constants";
import type { HistoryMode } from "./game.types";
import type { GamePanelProps } from "./game.types";

/**
 * The game record (棋譜). Every entry is a position to jump to, which is what
 * makes review possible: the timeline behind it holds each state, so stepping
 * back here is the same mechanism as undo.
 */
export function MoveHistory({ session, actions }: GamePanelProps) {
  const { state, fatalMoves, moveIndex, record } = session;
  const fatalNumbers = new Set(fatalMoves.map((move) => move.moveNumber));

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle kanji={GAME_COPY.moveHistory.kanji}>
          {GAME_COPY.moveHistory.label}
        </SectionTitle>
        <Select
          value={session.settings.historyMode}
          onChange={(event) =>
            actions.setSessionSettings({
              historyMode: event.target.value as HistoryMode,
            })
          }
          aria-label="What clicking a move does"
          data-testid="history-mode"
        >
          {Object.values(HISTORY_MODES).map((option) => (
            <option key={option} value={option}>
              {HISTORY_MODE_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-muted">
        {HISTORY_MODE_DISPLAY[session.settings.historyMode].description}
      </p>

      {record.length === 0 ? (
        <p className="text-xs text-muted">
          {GAME_COPY.emptyRecord}
        </p>
      ) : (
        <details className="group" open data-testid="move-history-fold">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs text-muted">
            <span>
              {record.length} {record.length === 1 ? "move" : "moves"}
            </span>
            <span className="group-open:hidden">show</span>
            <span className="hidden group-open:inline">hide</span>
          </summary>
        <ol
          className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-rule text-sm"
          data-testid="move-history"
        >
          {record.map((move, index) => {
            const number = index + 1;
            const fatal = fatalNumbers.has(number);
            const current = moveIndex === number;
            // Moves after the position on show are still there to step forward to.
            const ahead = number > moveIndex;

            return (
              <li key={number}>
                <button
                  type="button"
                  onClick={() => actions.jumpTo(number)}
                  className={`flex w-full items-center gap-2 px-2.5 py-1 text-left transition-colors hover:bg-shade ${
                    current ? "bg-shade font-semibold" : ""
                  } ${ahead ? "opacity-60" : ""}`}
                  aria-current={current ? "step" : undefined}
                >
                  <span className="w-7 shrink-0 text-right font-mono text-xs text-muted tabular-nums">
                    {number}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`size-2.5 shrink-0 rounded-full ${
                      move.stone === "black"
                        ? "bg-ink"
                        : "border border-rule-strong bg-ivory"
                    }`}
                  />
                  <span className="font-mono">
                    {move.kind === MOVE_KINDS.pass
                      ? GAME_COPY.pass.label
                      : pointName(state.settings.size, move)}
                    {move.kind === MOVE_KINDS.piece && move.cells !== undefined
                      ? ` ×${move.cells.length}`
                      : ""}
                  </span>
                  <span className="sr-only">
                    {STONE_DISPLAY[move.stone].label}
                  </span>
                  {move.kind === MOVE_KINDS.skip ? (
                    <span className="text-xs text-muted">
                      {GAME_COPY.skip.kanji}
                    </span>
                  ) : null}
                  {move.captured !== undefined ? (
                    <span
                      className="text-xs text-muted"
                      title={`${GAME_COPY.captures.label}: ${move.captured.length / 2}`}
                    >
                      {GAME_COPY.captures.kanji}×{move.captured.length / 2}
                    </span>
                  ) : null}
                  {fatal ? (
                    <span
                      className="ml-auto rounded px-1.5 py-0.5 text-[0.65rem] font-semibold text-shu ring-1 ring-shu/40"
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
        </details>
      )}
    </section>
  );
}
