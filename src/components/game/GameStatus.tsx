"use client";

import { fatalMoveCopy, outlookCopy } from "@/lib/gomoku/analysisCopy";
import { useLocale, useSpeaker } from "@/components/i18n/LocaleProvider";
import { pairedText, seatName, stoneName } from "@/lib/gomoku/seatWords";
import { handicapCopy, secondStoneLabel } from "@/lib/gomoku/openingCopy";
import { stalledDrawOf } from "@/lib/gomoku/rules/noProgress";
import { endingRanOut, repeatedTooOften } from "@/lib/gomoku/rules/checkersDraws";
import { endedWithNoMoves } from "@/lib/gomoku/rules/forcedPass";
import { passedTurnWords } from "./passedTurn";
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
  STONES,
  STONE_DISPLAY,
  VARIANT_SPECS,
  WIN_REASONS,
} from "@/lib/gomoku/gomoku.constants";
import { describeHeadStart } from "@/lib/gomoku/headStartWords";
import { FORBIDDEN_PATTERN_DISPLAY } from "@/lib/gomoku/openings.constants";
import { StoneMark } from "@/components/board/StoneMark";
import { STONE_SETS } from "@/components/board/Board.constants";
import { seatStones } from "@/components/board/seatStones";
import { useStoneColours } from "@/components/board/seatColourContext";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { AWARENESS_LEVELS, gameCopy } from "./game.constants";
import { openingPrompt } from "./openingCopy";
import type { GameSession } from "./game.types";

/** Whose move it is, drawn with the stone they are actually holding. */
function ToPlay({ session }: { session: GameSession }) {
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const { state, names } = session;
  // The reader's stones with each seat's chosen colour over its side, as the board draws them (`seatStones`).
  const stones = seatStones(STONE_SETS[session.appearance.stoneSet], useStoneColours());

  if (state.status === GAME_STATUS.draw) {
    /*
     * The ways to draw are not interchangeable: a no-progress rule drew it,
     * neither side had a move, a position came round too often, an ending ran
     * out of the moves its rules allow, the game ran to the length its players
     * agreed to, both colours made a line on the same move, or the board
     * filled. Which one it was is the engine's to say.
     *
     * A stall names the rule that drew it, with that rule's count — "draw by
     * the forty-move rule", the way chess says the fifty-move rule — because a
     * stalled Halma, Chinese Checkers or draughts game is an ordinary draw by a
     * rule the players can read.
     */
    const stall = stalledDrawOf(state);
    const why = stall !== null
        ? GAME_COPY.drawNoProgress[stall.measure](stall.plies)
      : endedWithNoMoves(state)
        ? GAME_COPY.drawNoMoves
      : repeatedTooOften(state)
        ? GAME_COPY.drawByRepetition
        : endingRanOut(state)
          ? GAME_COPY.drawByEndgameCount
          : drawnByLength(state)
            ? GAME_COPY.drawByLength
            : state.board.includes(null)
              ? GAME_COPY.drawBothLines
              : say.say("gamescreen.drawFull");
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
  const loserSeat = state.seats[state.winner === STONES.black ? STONES.white : STONES.black];
  const who = names[seat].trim() || seatName(say, seat);
  const winLine = (): string => {
    if (state.winBy === WIN_REASONS.time || session.lostOnTime !== null) return say.say("gamescreen.winsOnTime", { who });
    if (state.winBy === WIN_REASONS.captures) return GAME_COPY.winsByCaptures(who, state.settings.capturesToWin);
    if (state.winBy === WIN_REASONS.trap) return GAME_COPY.winsByTrap(who, names[loserSeat].trim() || seatName(say, loserSeat));
    if (state.winBy === WIN_REASONS.square) return GAME_COPY.winsBySquare(who);
    if (state.winBy === WIN_REASONS.count) {
      const discs = discCount(state.board);
      return say.say("gamescreen.winsOnDiscs", { who, black: String(discs.black), white: String(discs.white) });
    }
    if (state.winBy === WIN_REASONS.camp) return say.say("gamescreen.winsCamp", { who });
    if (state.winBy === WIN_REASONS.connection) {
      return say.say(state.winner === STONES.black ? "gamescreen.winsTopBottom" : "gamescreen.winsLeftRight", { who });
    }
    if (state.winBy === WIN_REASONS.blocked) return say.say("gamescreen.winsBlocked", { who });
    if (state.winBy === WIN_REASONS.resign) return say.say("gamescreen.winsResign", { who });
    return say.say("gamescreen.winsIn", { who, moves: say.count("count.move", state.moves.length) });
  };
  const text = state.status === GAME_STATUS.won ? winLine() : say.say("gamescreen.whoToPlay", { who });

  return (
    <p className="flex items-center gap-2.5 text-lg font-semibold" data-testid="to-play">
      <span className="relative flex size-6 items-center justify-center">
        <StoneMark stone={stone} stones={stones} />
      </span>
      <span className="leading-tight">
        {text}
        {say.pairsWithKanji ? (
          <span className="ml-2 text-sm font-normal text-muted">
            {label} {kanji}
          </span>
        ) : null}
        {/* Two people at one screen, or one against the computer: whose turn passed, by colour. */}
        {passedTurnWords(state, null, say) !== null ? (
          <span className="block text-sm font-normal" data-testid="turn-passed">
            {passedTurnWords(state, null, say)}
          </span>
        ) : null}
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
  const locale = useLocale();
  const { assessment, settings, state } = session;
  if (settings.awareness === AWARENESS_LEVELS.off) return null;
  if (state.status !== GAME_STATUS.playing) return null;

  const outlook = assessment.outlook[state.toPlay];
  const { label, kanji, tone, detail } = outlookCopy(outlook, locale);

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
  const GAME_COPY = gameCopy(useSpeaker());
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
  const say = useSpeaker();
  const fatal = fatalMoveCopy(say.locale);
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
        {fatal.kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">
          {say.say("gamescreen.fatalLine", { label: fatal.label, colour: stoneName(say, latest.stone), move: String(latest.moveNumber) })}
        </span>
        <span className="text-xs leading-snug opacity-85">
          {fatal.detail}
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const { state } = session;
  const { settings } = state;
  const spec = VARIANT_SPECS[settings.variant];
  const rules = rulesFor(settings, state.toPlay);
  const lines: string[] = [];

  if (state.status === GAME_STATUS.playing) {
    if (session.hand.piece !== null) {
      lines.push(
        session.hand.mustPass
          ? GAME_COPY.noMoveLeft
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
      say.say("gamescreen.captureLine", {
        label: GAME_COPY.captures.label,
        black: stoneName(say, "black"),
        blackCount: String(state.captures.black),
        white: stoneName(say, "white"),
        whiteCount: String(state.captures.white),
        rule: GAME_COPY.capturesToWin(settings.capturesToWin),
      }),
    );
  }
  if (spec.makerBreaker) {
    const nameOf = (stone: "black" | "white") =>
      session.names[state.seats[stone]].trim() || seatName(say, state.seats[stone]);
    lines.push(GAME_COPY.makerBreakerRoles(nameOf(STONES.black), nameOf(STONES.white)));
  }
  const { handicap } = settings;
  if (handicap.stone !== null) {
    const parts = HANDICAP_RULES.filter((rule) => handicap[rule]).map(
      (rule) => handicapCopy(rule, say.locale).label.toLowerCase(),
    );
    if (handicap.secondStoneExclusion > 0) {
      parts.push(
        say.say("gamescreen.secondStone", { name: secondStoneLabel(handicap.secondStoneExclusion, say.locale).toLowerCase() }),
      );
    }
    const lead = GAME_COPY.handicapFor(stoneName(say, handicap.stone));
    lines.push(parts.length > 0 ? say.say("gamescreen.handicapLead", { lead, parts: say.joined(parts) }) : say.sentence(lead));
  }
  const given = describeHeadStart(settings, say);
  if (given !== null) lines.push(say.sentence(given));
  const forbidden = rules.forbidden;
  if (forbidden.length > 0 && state.status === GAME_STATUS.playing) {
    const shapes = say.joined(
      forbidden.map((pattern) => pairedText(say, FORBIDDEN_PATTERN_DISPLAY[pattern].label, FORBIDDEN_PATTERN_DISPLAY[pattern].kanji)),
    );
    lines.push(GAME_COPY.forbiddenNote(stoneName(say, state.toPlay), shapes));
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const { state, names } = session;
  if (state.status !== GAME_STATUS.playing) return null;
  const prompt = openingPrompt(state, names, say);
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
  const say = useSpeaker();
  return (
    /*
      ROOM FOR TWO NOTES WHETHER OR NOT THEY ARE THERE. The outlook and a
      fatal-move note come and go as the record is stepped through, and every
      time they did the record and its scrubber moved under the pointer. John,
      2026-09-25: "Using the scrubber sucks when the content above the scrubber
      changes height." The panel keeps the height two notes take.
    */
    <section aria-live="polite" className="flex min-h-[14.5rem] flex-col gap-3" data-testid="game-status-panel">
      <div className="flex flex-col gap-1">
        <ToPlay session={session} />
        {VARIANT_SPECS[session.state.settings.variant].camps ? (
          <p className="text-sm" data-testid="home-count">
            <span className="font-mono tabular-nums">● {piecesHome(session.state.board, session.state.settings.size, STONES.black)}</span>
            <span className="px-2 text-muted">·</span>
            <span className="font-mono tabular-nums">○ {piecesHome(session.state.board, session.state.settings.size, STONES.white)}</span>
            <span className="ml-2 text-muted">{say.say("gamescreen.homeOf", { count: String(campSize(session.state.settings.size)) })}</span>
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
            <span className="ml-2 text-muted">{say.say("gamescreen.homeOf", { count: String(starCampSize(STAR_RADIUS)) })}</span>
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
          {session.moveIndex < session.moveTotal
            ? say.say("gamescreen.reviewingAt", {
                move: say.say("gamescreen.nextMove", { move: String(session.state.moves.length + 1) }),
                index: String(session.moveIndex),
                total: String(session.moveTotal),
              })
            : say.say("gamescreen.nextMove", { move: String(session.state.moves.length + 1) })}
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
