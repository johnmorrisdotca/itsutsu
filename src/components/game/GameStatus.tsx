"use client";

import {
  FATAL_MOVE_DISPLAY,
  OUTLOOK_DISPLAY,
} from "@/lib/gomoku/analysis.constants";
import {
  campSize,
  discCount,
  drawnByLength,
  inMovePhase,
  piecesHome,
  rulesFor,
  STAR_RADIUS,
  starCampSize,
  starPiecesHome,
  stonesLeft,
} from "@/lib/gomoku/engine";
import {
  GAME_STATUS,
  HANDICAP_RULES,
  PLACEMENTS,
  SEAT_DISPLAY,
  STONES,
  STONE_DISPLAY,
  VARIANT_SPECS,
  WIN_REASONS,
} from "@/lib/gomoku/gomoku.constants";
import { SECOND_STONE_EXCLUSION_DISPLAY } from "@/lib/gomoku/variants.constants";
import { FORBIDDEN_PATTERN_DISPLAY, HANDICAP_RULE_DISPLAY } from "@/lib/gomoku/openings.constants";
import { StoneMark } from "@/components/board/StoneMark";
import { STONE_SETS } from "@/components/board/Board.constants";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { AWARENESS_LEVELS, GAME_COPY } from "./game.constants";
import { openingPrompt } from "./openingCopy";
import type { GameSession } from "./game.types";

/** Whose move it is, drawn with the stone they are actually holding. */
function ToPlay({ session }: { session: GameSession }) {
  const { state, names } = session;
  const stones = STONE_SETS[session.appearance.stoneSet];

  if (state.status === GAME_STATUS.draw) {
    /*
     * Three ways to draw, and they are not interchangeable: the board filled,
     * both colours made a line on the same move, or the game ran to the
     * length its players agreed to. Which one it was is the engine's to say.
     */
    const why = drawnByLength(state)
      ? GAME_COPY.drawByLength
      : state.board.includes(null)
        ? GAME_COPY.drawBothLines
        : "Draw. The board is full.";
    return (
      <p className="text-lg font-semibold" data-testid="to-play">
        {why}
      </p>
    );
  }

  const stone = state.status === GAME_STATUS.won ? state.winner : state.toPlay;
  if (stone === null) return null;

  const { label, kanji } = STONE_DISPLAY[stone];
  const seat = state.seats[stone];
  const who = names[seat].trim() || SEAT_DISPLAY[seat].label;
  const text =
    state.status === GAME_STATUS.won
      ? state.winBy === WIN_REASONS.time || session.lostOnTime !== null
        ? `${who} wins on time`
        : state.winBy === WIN_REASONS.captures
          ? `${who} ${GAME_COPY.winsByCaptures(state.settings.capturesToWin)}`
          : state.winBy === WIN_REASONS.trap
            ? GAME_COPY.winsByTrap(
                who,
                names[state.seats[state.winner === STONES.black ? STONES.white : STONES.black]].trim() ||
                  SEAT_DISPLAY[state.seats[state.winner === STONES.black ? STONES.white : STONES.black]].label,
              )
            : state.winBy === WIN_REASONS.square
              ? GAME_COPY.winsBySquare(who)
              : state.winBy === WIN_REASONS.count
                ? `${who} wins on discs, ${discCount(state.board).black} to ${discCount(state.board).white}`
                : state.winBy === WIN_REASONS.camp
                  ? `${who} wins: the far camp is full`
                : state.winBy === WIN_REASONS.connection
                  ? `${who} wins: ${state.winner === STONES.black ? "top and bottom are joined" : "left and right are joined"}`
                : state.winBy === WIN_REASONS.blocked
                  ? `${who} wins: the other side has no move left`
                : state.winBy === WIN_REASONS.resign
                  ? `${who} wins by resignation`
                  : `${who} wins in ${state.moves.length} moves`
      : `${who} to play`;

  return (
    <p className="flex items-center gap-2.5 text-lg font-semibold" data-testid="to-play">
      <span className="relative flex size-6 items-center justify-center">
        <StoneMark stone={stone} stones={stones} />
      </span>
      <span className="leading-tight">
        {text}
        <span className="ml-2 text-sm font-normal text-muted">
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

/**
 * What the variant adds to the plain turn line: the stone count in a two-stone
 * turn, the capture tally, and which shapes the colour to move may not make.
 * All of it is read from the engine; nothing here decides anything.
 */
function VariantLine({ session }: { session: GameSession }) {
  const { state } = session;
  const { settings } = state;
  const spec = VARIANT_SPECS[settings.variant];
  const rules = rulesFor(settings, state.toPlay);
  const lines: string[] = [];

  if (state.status === GAME_STATUS.playing) {
    if (session.hand.piece !== null) {
      lines.push(
        session.hand.mustPass
          ? GAME_COPY.mustPass
          : session.hand.layingSingle
            ? GAME_COPY.singlePrompt
            : GAME_COPY.piecePrompt,
      );
    }
    if (state.pendingTwist) lines.push(GAME_COPY.twistPrompt);
    else if (inMovePhase(state)) {
      lines.push(
        session.selected === null
          ? spec.camps || spec.chineseCheckers
            ? GAME_COPY.pickRacer
            : GAME_COPY.pickPiece
          : spec.camps || spec.chineseCheckers
            ? GAME_COPY.placeRacer
            : GAME_COPY.placePiece,
      );
    } else if (spec.placement === PLACEMENTS.drop) lines.push(GAME_COPY.dropPrompt);
  }

  if (spec.stonesPerTurn > 1 && state.status === GAME_STATUS.playing) {
    const left = stonesLeft(state);
    const total = state.moves.length === 0 ? spec.firstTurnStones : rules.stonesPerTurn;
    lines.push(GAME_COPY.stoneOfTurn(total - left + 1, total));
  }
  if (spec.captures) {
    lines.push(
      `${GAME_COPY.captures.label} · ${STONE_DISPLAY.black.label} ${state.captures.black} · ${STONE_DISPLAY.white.label} ${state.captures.white} · ${GAME_COPY.capturesToWin(settings.capturesToWin)}`,
    );
  }
  if (spec.makerBreaker) {
    const nameOf = (stone: "black" | "white") =>
      session.names[state.seats[stone]].trim() || SEAT_DISPLAY[state.seats[stone]].label;
    lines.push(GAME_COPY.makerBreakerRoles(nameOf(STONES.black), nameOf(STONES.white)));
  }
  const { handicap } = settings;
  if (handicap.stone !== null) {
    const parts = HANDICAP_RULES.filter((rule) => handicap[rule]).map(
      (rule) => HANDICAP_RULE_DISPLAY[rule].label.toLowerCase(),
    );
    if (handicap.secondStoneExclusion > 0) {
      parts.push(
        `second stone ${SECOND_STONE_EXCLUSION_DISPLAY[handicap.secondStoneExclusion].label.toLowerCase()}`,
      );
    }
    lines.push(
      `${GAME_COPY.handicapFor(STONE_DISPLAY[handicap.stone].label)}${parts.length > 0 ? `: ${parts.join(", ")}` : ""}.`,
    );
  }
  const forbidden = rules.forbidden;
  if (forbidden.length > 0 && state.status === GAME_STATUS.playing) {
    const shapes = forbidden
      .map((pattern) => `${FORBIDDEN_PATTERN_DISPLAY[pattern].label} ${FORBIDDEN_PATTERN_DISPLAY[pattern].kanji}`)
      .join(", ");
    lines.push(GAME_COPY.forbiddenNote(STONE_DISPLAY[state.toPlay].label, shapes));
  }

  if (lines.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5" data-testid="variant-line">
      {lines.map((line) => (
        <p key={line} className="text-xs text-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

/** What the opening asks for right now, while it still asks for anything. */
function OpeningNotice({ session }: { session: GameSession }) {
  const { state, names } = session;
  if (state.status !== GAME_STATUS.playing) return null;
  const prompt = openingPrompt(state, names);
  if (prompt === null) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${TONE_CLASS.calm}`}
      role="status"
      data-testid="opening-notice"
    >
      <span aria-hidden="true" className="font-mincho mt-0.5 text-xl leading-none font-semibold">
        {GAME_COPY.opening.kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{GAME_COPY.opening.label}</span>
        <span className="text-xs leading-snug opacity-85">{prompt}</span>
      </span>
    </div>
  );
}

export function GameStatus({ session }: { session: GameSession }) {
  return (
    <section aria-live="polite" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <ToPlay session={session} />
        {VARIANT_SPECS[session.state.settings.variant].camps ? (
          <p className="text-sm" data-testid="home-count">
            <span className="font-mono tabular-nums">● {piecesHome(session.state.board, session.state.settings.size, STONES.black)}</span>
            <span className="px-2 text-muted">·</span>
            <span className="font-mono tabular-nums">○ {piecesHome(session.state.board, session.state.settings.size, STONES.white)}</span>
            <span className="ml-2 text-muted">of {campSize(session.state.settings.size)} home</span>
          </p>
        ) : null}
        {VARIANT_SPECS[session.state.settings.variant].chineseCheckers ? (
          <p className="text-sm" data-testid="home-count">
            <span className="font-mono tabular-nums">
              ● {starPiecesHome(session.state.board, session.state.settings.size, STAR_RADIUS, STONES.black)}
            </span>
            <span className="px-2 text-muted">·</span>
            <span className="font-mono tabular-nums">
              ○ {starPiecesHome(session.state.board, session.state.settings.size, STAR_RADIUS, STONES.white)}
            </span>
            <span className="ml-2 text-muted">of {starCampSize(STAR_RADIUS)} home</span>
          </p>
        ) : null}
        {VARIANT_SPECS[session.state.settings.variant].flips ? (
          <p className="text-sm" data-testid="disc-count">
            <span className="font-mono tabular-nums">● {discCount(session.state.board).black}</span>
            <span className="px-2 text-muted">·</span>
            <span className="font-mono tabular-nums">○ {discCount(session.state.board).white}</span>
          </p>
        ) : null}
        <p className="text-sm text-muted">
          Move {session.state.moves.length + 1}
          {session.moveIndex < session.moveTotal
            ? ` · reviewing ${session.moveIndex} of ${session.moveTotal}`
            : ""}
        </p>
        <VariantLine session={session} />
      </div>
      <OpeningNotice session={session} />
      <Outlook session={session} />
      <BuildingNotice session={session} />
      <FatalNotice session={session} />
    </section>
  );
}
