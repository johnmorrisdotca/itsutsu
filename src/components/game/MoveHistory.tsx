"use client";

import { linesOf, pointIn } from "@/lib/record/moveFormats";
import { capturePaths, slideWord } from "@/lib/gomoku/notation";
import { MOVE_KINDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { seatName, stoneName } from "@/lib/gomoku/seatWords";
import { variantName } from "@/lib/gomoku/variantCopy";
import { slugFor } from "@/lib/gomoku/slugs";
import { MosaicDialog } from "@/components/history/MosaicDialog";
import { ReplayButtons } from "@/components/history/ReplayButtons";
import { framesOf, mosaicDraws } from "@/lib/record/mosaic";
import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import { fatalMoveCopy } from "@/lib/gomoku/analysisCopy";
import { SectionTitle, Select } from "@/components/ui/Controls";
import {
  gameCopy,
  HISTORY_MODES,
  historyModeDisplay,
} from "./game.constants";
import type { HistoryMode } from "./game.types";
import type { GamePanelProps } from "./game.types";
import { useMoveFormat } from "./MoveFormatContext";
import { MoveFormatPicker } from "./MoveFormatPicker";
import { SELECTABLE } from "@/components/ui/ui.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * The game record (棋譜). Every entry is a position to jump to, which is what
 * makes review possible: the timeline behind it holds each state, so stepping
 * back here is the same mechanism as undo.
 */
export function MoveHistory({ session, actions }: GamePanelProps) {
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const HISTORY_MODE_DISPLAY = historyModeDisplay(say);
  const fatalCopy = fatalMoveCopy(say.locale);
  const { state, fatalMoves, moveIndex, record } = session;
  // Each capture's squares so far, for a draughts jump's colon (`capturePaths`).
  const paths = capturePaths(record);
  const { format } = useMoveFormat();
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
          aria-label={say.say("gamescreen.historyAria")}
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
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs text-muted">
            <span>
              {say.count("count.move", record.length)}
            </span>
            <span className="group-open:hidden">{say.say("replay.show")}</span>
            <span className="hidden group-open:inline">{say.say("replay.hide")}</span>
          </summary>
          {/* How the moves are written, ours or the other sites' (`MoveFormatPicker`). */}
          <div className="mt-1">
            <MoveFormatPicker />
          </div>
        <ol
          className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-rule text-sm"
          data-testid="move-history"
          data-format={format}
        >
          {linesOf(format, record).map((line) => (
            <li key={line.number} className="flex items-stretch">
              <span className="w-9 shrink-0 self-center pr-1 text-right font-mono text-xs text-muted tabular-nums">
                {line.number}
                {format === "itsYourTurn" ? "." : ""}
              </span>
              {line.moves.map(({ move, index }) => {
                const number = index + 1;
                const fatal = fatalNumbers.has(number);
                const current = moveIndex === number;
                // Moves after the position on show are still there to step forward to.
                const ahead = number > moveIndex;
                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => actions.jumpTo(number)}
                    // Notation is copied, so a move stays text even though it is a button (`SELECTABLE`).
                    className={`${SELECTABLE} flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1 text-left transition-colors hover:bg-shade ${
                      current ? "bg-shade font-semibold" : ""
                    } ${ahead ? "opacity-60" : ""}`}
                    aria-current={current ? "step" : undefined}
                    data-move={number}
                  >
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
                        : move.kind === MOVE_KINDS.forfeit
                          ? GAME_COPY.forfeit.label
                          : paths[index] !== null
                            ? // A draughts capture with a colon, a multi-jump as every square it landed on.
                              slideWord(paths[index].map((point) => pointIn(format, state.settings.size, point)), true)
                            : move.kind === MOVE_KINDS.move && move.from !== undefined
                              ? slideWord([pointIn(format, state.settings.size, move.from), pointIn(format, state.settings.size, move)], false)
                              : pointIn(format, state.settings.size, move)}
                      {move.kind === MOVE_KINDS.piece && move.cells !== undefined
                        ? ` ×${move.cells.length}`
                        : ""}
                    </span>
                    <span className="sr-only">
                      {stoneName(say, move.stone)}
                    </span>
                    {move.kind === MOVE_KINDS.skip ? (
                      <span className="text-xs text-muted">
                        {say.pairsWithKanji ? GAME_COPY.skip.kanji : GAME_COPY.skip.label}
                      </span>
                    ) : null}
                    {move.captured !== undefined ? (
                      <span
                        className="text-xs text-muted"
                        title={`${GAME_COPY.captures.label}: ${move.captured.length / 2}`}
                      >
                        {say.pairsWithKanji ? GAME_COPY.captures.kanji : GAME_COPY.captures.label}×{move.captured.length / 2}
                      </span>
                    ) : null}
                    {fatal ? (
                      <span
                        className="ml-auto rounded px-1.5 py-0.5 text-[0.65rem] font-semibold text-shu ring-1 ring-shu/40"
                        title={fatalCopy.detail}
                      >
                        {fatalCopy.kanji}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </li>
          ))}
        </ol>
        </details>
      )}
      {/*
        THE SCRUBBER, from the empty board to the last move. John, on a game
        played on one screen: "Where is the scrubber to move from 1 to last
        move, for looking at a Match?" The record above steps a move at a time;
        this sweeps. It goes through the same door as clicking a move, so the
        record's own rule — read only, or play from here — decides what it does.
      */}
      {session.moveTotal > 0 ? (
        <input
          type="range"
          min={0}
          max={session.moveTotal}
          value={moveIndex}
          onChange={(event) => actions.jumpTo(Number(event.target.value))}
          className="w-full accent-ink"
          aria-label={say.say("replay.scrubber")}
          data-testid="history-scrubber"
        />
      ) : null}
      {session.moveTotal > 0 ? (
        <ReplayButtons index={moveIndex} last={session.moveTotal} onGo={actions.jumpTo} testId="history" />
      ) : null}
      {/* And the whole line as one picture, in a window on demand — see `MosaicDialog`. */}
      {mosaicDraws(state.settings.variant) ? (
        <MosaicDialog
          id={`practice-${state.settings.variant}`}
          count={record.length}
          frames={() => framesOf(session.timeline)}
          size={state.settings.size}
          grid={VARIANT_SPECS[state.settings.variant].grid}
          title={() => ({
            name: say.say("mosaic.vs", { black: session.names.one || seatName(say, "one"), white: session.names.two || seatName(say, "two") }),
            details: [
              `${variantName(state.settings.variant, say)} ${state.settings.size}×${state.settings.size}`,
              say.count("count.move", record.length),
              MOSAIC_COPY.site,
            ],
          })}
          fileName={`itsutsu-${slugFor(state.settings.variant)}-${record.length}-moves.png`}
          alt={say.say("mosaic.altGame", { count: say.count("count.move", record.length) })}
        />
      ) : null}
    </section>
  );
}
