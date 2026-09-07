"use client";

import {
  FATAL_MOVE_DISPLAY,
  OUTLOOK_DISPLAY,
} from "@/lib/gomoku/analysis.constants";
import { GAME_STATUS, SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { StoneMark } from "@/components/board/StoneMark";
import { STONE_SETS } from "@/components/board/Board.constants";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { AWARENESS_LEVELS, GAME_COPY } from "./game.constants";
import type { GameSession } from "./game.types";

/** Whose move it is, drawn with the stone they are actually holding. */
function ToPlay({ session }: { session: GameSession }) {
  const { state, names } = session;
  const stones = STONE_SETS[session.appearance.stoneSet];

  if (state.status === GAME_STATUS.draw) {
    return <p className="text-lg font-semibold">Draw. The board is full.</p>;
  }

  const stone = state.status === GAME_STATUS.won ? state.winner : state.toPlay;
  if (stone === null) return null;

  const { label, kanji } = STONE_DISPLAY[stone];
  const seat = state.seats[stone];
  const who = names[seat].trim() || SEAT_DISPLAY[seat].label;
  const text =
    state.status === GAME_STATUS.won
      ? session.lostOnTime !== null
        ? `${who} wins on time`
        : `${who} wins in ${state.moves.length} moves`
      : `${who} to play`;

  return (
    <p className="flex items-center gap-2.5 text-lg font-semibold">
      <span className="relative flex size-6 items-center justify-center">
        <StoneMark stone={stone} stones={stones} />
      </span>
      <span className="leading-tight">
        {text}
        <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
          {label} {kanji}
        </span>
      </span>
    </p>
  );
}

/**
 * The awareness banner. It reports how the game stands for the player to move
 * and never changes what they are allowed to do — at `outlook` it deliberately
 * says what is happening without saying where.
 */
function Outlook({ session }: { session: GameSession }) {
  const { assessment, settings, state } = session;
  if (settings.awareness === AWARENESS_LEVELS.off) return null;
  if (state.status !== GAME_STATUS.playing) return null;

  const outlook = assessment.outlook[state.toPlay];
  const { label, kanji, tone, detail } = OUTLOOK_DISPLAY[outlook];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${TONE_CLASS[tone]}`}
      role="status"
      data-outlook={outlook}
    >
      <span aria-hidden="true" className="mt-0.5 text-xl leading-none font-semibold">
        {kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs leading-snug opacity-85">{detail}</span>
      </span>
    </div>
  );
}

/**
 * The early warning: something is forming, but nothing is forced yet.
 *
 * It only appears when a game has opted in, and it appears for both players
 * on the same terms — a warning given to one side would just be an advantage.
 */
function BuildingNotice({ session }: { session: GameSession }) {
  const { assessment, settings, state } = session;
  if (!settings.earlyWarning) return null;
  if (settings.awareness === AWARENESS_LEVELS.off) return null;
  if (state.status !== GAME_STATUS.playing) return null;
  if (assessment.buildingPoints.length === 0) return null;
  // A real threat outranks a warning about a future one.
  if (assessment.forcedPoints.length > 0) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${TONE_CLASS.warn}`}
      role="status"
      data-testid="building-warning"
    >
      <span aria-hidden="true" className="font-mincho mt-0.5 text-xl leading-none font-semibold">
        {GAME_COPY.building.kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{GAME_COPY.building.label}</span>
        <span className="text-xs leading-snug opacity-85">
          {GAME_COPY.buildingDetail}
        </span>
      </span>
    </div>
  );
}

/** 敗着 — the move the analysis says threw the game away. */
function FatalNotice({ session }: { session: GameSession }) {
  const latest = session.fatalMoves[session.fatalMoves.length - 1];
  if (latest === undefined) return null;
  if (session.settings.awareness === AWARENESS_LEVELS.off) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${TONE_CLASS.alarm}`}
      role="status"
      data-fatal-move={latest.moveNumber}
    >
      <span aria-hidden="true" className="mt-0.5 text-xl leading-none font-semibold">
        {FATAL_MOVE_DISPLAY.kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">
          {FATAL_MOVE_DISPLAY.label} — {STONE_DISPLAY[latest.stone].label}, move{" "}
          {latest.moveNumber}
        </span>
        <span className="text-xs leading-snug opacity-85">
          {FATAL_MOVE_DISPLAY.detail}
        </span>
      </span>
    </div>
  );
}

export function GameStatus({ session }: { session: GameSession }) {
  return (
    <section aria-live="polite" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <ToPlay session={session} />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Move {session.state.moves.length + 1}
          {session.moveIndex < session.moveTotal
            ? ` · reviewing ${session.moveIndex} of ${session.moveTotal}`
            : ""}
        </p>
      </div>
      <Outlook session={session} />
      <BuildingNotice session={session} />
      <FatalNotice session={session} />
    </section>
  );
}
