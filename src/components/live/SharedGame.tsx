"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import useSWR from "swr";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { cellAt, discCount, inMovePhase, pieceMoves, rulesFor, otherStone } from "@/lib/gomoku/engine";
import { PieceTray } from "@/components/game/PieceTray";
import { deadlineFor, describeRemaining, isOverdue } from "@/lib/history/deadline";
import { FORFEITS_TO_LOSE } from "@/lib/history/gameSettingsSchema";
import { Button } from "@/components/ui/Controls";
import { usePieceHand } from "@/components/game/usePieceHand";
import { GAME_STATUS, STONES, STONE_DISPLAY, VARIANT_SPECS, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import { ResignButton } from "@/components/mine/ResignButton";
import { GAME_COPY } from "@/components/game/game.constants";
import type { ReactionEmoji } from "@/lib/history/reactions.constants";
import { ReactionBar, ReactionBubbles, ReactionLog } from "./Reactions";
import type { Point, Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { TONE_CLASS } from "@/components/ui/ui.constants";

/** How often a waiting board asks whether the other side has moved. */
const POLL_MS = 2500;

const fetcher = async (url: string): Promise<GameDetail> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the game.");
  return response.json();
};

/**
 * A game played from two devices.
 *
 * The server owns the rules — this only asks it to play a move and redraws
 * whatever comes back. Polling is deliberately plain: a board changes a few
 * times a minute at most, so a short poll costs less than the machinery a
 * socket would need, and it survives a phone locking and waking up.
 */
export function SharedGame({
  initial,
  token,
  seat,
  basePath,
  opponent = null,
  muted = null,
}: {
  initial: GameDetail;
  token: string | null;
  seat: Stone | null;
  /** The match's address; the bar shows it with the move count appended, kept current as play goes on. */
  basePath?: string;
  /** Who sits across the board, and where they are, when the seat is an account with a country set. */
  opponent?: { name: string; country: string } | null;
  /** A seat whose messages the viewer has chosen not to see. */
  muted?: Stone | null;
}) {
  const [error, setError] = useState<string | null>(null);
  // Mute this opponent's messages for this game only; remembered in this browser.
  const quiet = useSyncExternalStore(
    subscribeQuiet,
    () => readQuiet(initial.id),
    () => false,
  );
  /*
   * Whether to keep asking. Driven from `onSuccess` rather than SWR's
   * function-form `refreshInterval`, which does not schedule a poll at all.
   */
  const [polling, setPolling] = useState(initial.status === "active");

  const { data: game, mutate } = useSWR(`/api/games/${initial.id}`, fetcher, {
    fallbackData: initial,
    // A finished game has nothing left to poll for.
    refreshInterval: polling ? POLL_MS : 0,
    onSuccess: (latest) => setPolling(latest.status === "active"),
    /*
     * Keep polling while the tab is in the background. This is a game played
     * over minutes on two phones — the board has to be current the moment
     * someone looks at it, not a poll interval later.
     */
    refreshWhenHidden: true,
    revalidateOnFocus: true,
  });

  const detail = game ?? initial;
  const state = replayGame(detail);

  const played = state.moves.length;
  useEffect(() => {
    if (basePath === undefined) return;
    const next = `${basePath}/${played}`;
    if (window.location.pathname !== next) window.history.replaceState(null, "", next);
  }, [basePath, played]);
  const yourTurn = seat !== null && state.toPlay === seat;
  const playable = yourTurn && state.status === GAME_STATUS.playing;
  const [selected, setSelected] = useState<Point | null>(null);
  const { hand, rotate, flip, toggleSingle } = usePieceHand(state);
  const choosesColour = VARIANT_SPECS[state.settings.variant].anyColour;
  const [placing, setPlacing] = useState<Stone>(STONES.black);

  /*
   * The deadline is the server's: it comes with the game and is only shown
   * here. A once-a-second tick keeps the countdown honest between polls.
   */
  const deadline = deadlineFor(detail);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null || state.status !== GAME_STATUS.playing) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline, state.status]);
  const overdue = isOverdue(deadline, new Date(now));
  const canClaim = overdue && seat !== null && !yourTurn && state.status === GAME_STATUS.playing;

  async function give() {
    setError(null);
    const response = await fetch(`/api/games/${detail.id}/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Time could not be given.");
      return;
    }
    await mutate((await response.json()) as GameDetail, { revalidate: false });
  }

  async function claim() {
    if (token === null) return;
    setError(null);
    const response = await fetch(`/api/games/${detail.id}/timeout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "That could not be claimed.");
      await mutate();
      return;
    }
    await mutate((await response.json()) as GameDetail, { revalidate: false });
  }

  /** Sends one move, of any of the three shapes, and takes the server's answer as the truth. */
  async function send(body: Record<string, unknown>) {
    if (token === null) return;
    setError(null);
    const response = await fetch(`/api/games/${detail.id}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(payload?.error ?? "That move could not be played.");
      await mutate();
      return;
    }
    await mutate((await response.json()) as GameDetail, { revalidate: false });
  }

  async function play(point: Point) {
    if (!playable) return;
    // The piece games: the click is the corner of the piece in hand.
    if (hand.piece !== null && !hand.layingSingle) {
      const footprint = hand.footprintFor(point);
      if (footprint !== null) await send({ cells: footprint });
      return;
    }
    // The sliding games: pick a piece up, then put it down.
    if (inMovePhase(state)) {
      const lands =
        selected !== null &&
        pieceMoves(state, selected).some((to) => to.row === point.row && to.col === point.col);
      if (lands && selected !== null) {
        const from = selected;
        setSelected(null);
        await send({ row: point.row, col: point.col, from });
        return;
      }
      if (cellAt(state, point) === state.toPlay) {
        setSelected(
          selected !== null && selected.row === point.row && selected.col === point.col
            ? null
            : point,
        );
      }
      return;
    }
    await send(
      choosesColour
        ? { row: point.row, col: point.col, stone: placing }
        : { row: point.row, col: point.col },
    );
  }

  async function twist(quadrant: number, clockwise: boolean) {
    if (!playable) return;
    await send({ twist: { quadrant, clockwise } });
  }

  async function pass() {
    if (!playable) return;
    await send({ pass: true });
  }

  /** Sends an emoji to the other player. Refusals are quiet: it is only a wave. */
  async function react(emoji: ReactionEmoji, moveNumber: number | null, text: string | null) {
    if (token === null) return;
    const response = await fetch(`/api/games/${detail.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, emoji, moveNumber, text }),
    });
    if (response.ok) {
      await mutate((await response.json()) as GameDetail, { revalidate: false });
    }
  }

  // An ignored seat's messages are simply not shown; nor are the other seat's while this game is muted.
  const silenced = muted !== null ? muted : quiet && seat !== null ? otherStone(seat) : null;
  const shown = (detail.reactions ?? []).filter((reaction) => silenced === null || reaction.stone !== silenced);

  return (
    <div className="flex w-full flex-col gap-4">
      <TurnBanner
        state={state}
        seat={seat}
        yourTurn={yourTurn}
        finished={state.status !== GAME_STATUS.playing}
      />

      {error !== null ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}>
          {error}
        </p>
      ) : null}

      {deadline !== null && state.status === GAME_STATUS.playing ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
            overdue ? TONE_CLASS.alarm : TONE_CLASS.calm
          }`}
          data-testid="deadline"
        >
          <span>
            {STONE_DISPLAY[state.toPlay].label} {GAME_COPY.mustMoveBy}{" "}
            <span className="font-mono tabular-nums">{deadline.toLocaleTimeString()}</span>
            {" · "}
            <span className="font-mono tabular-nums" data-testid="deadline-remaining">
              {describeRemaining(deadline, new Date(now))}
            </span>
            {detail.timeoutPenalty === "turn" && (detail.forfeits.black > 0 || detail.forfeits.white > 0) ? (
              <span className="ml-2 text-xs opacity-80">
                {STONE_DISPLAY[state.toPlay].label}:{" "}
                {GAME_COPY.forfeitsNote(detail.forfeits[state.toPlay], FORFEITS_TO_LOSE)}
              </span>
            ) : null}
          </span>
          {canClaim ? (
            <Button onClick={claim} strong title={GAME_COPY.claimHint} data-testid="claim-timeout">
              {detail.timeoutPenalty === "game" || detail.clockMode === "game" ? GAME_COPY.claimGame.label : GAME_COPY.claimTurn.label}
            </Button>
          ) : null}
          {seat !== null && !yourTurn && state.status === GAME_STATUS.playing ? (
            <Button onClick={give} title="Add time to the other side's clock for this move. Nobody has to win on the clock." data-testid="give-time">
              Give more time
            </Button>
          ) : null}
        </div>
      ) : null}
      {detail.clockMode === "game" && detail.moveTimeMs !== null ? (
        <p className="text-xs text-muted" data-testid="time-budgets">
          Time left for the whole game · {STONE_DISPLAY.black.label} {describeBudget(detail.blackTimeMs ?? detail.moveTimeMs)} ·{" "}
          {STONE_DISPLAY.white.label} {describeBudget(detail.whiteTimeMs ?? detail.moveTimeMs)}
        </p>
      ) : null}

      {VARIANT_SPECS[state.settings.variant].captures ? (
        <p className="text-xs text-muted" data-testid="shared-captures">
          {GAME_COPY.captures.label} · {STONE_DISPLAY.black.label} {state.captures.black} ·{" "}
          {STONE_DISPLAY.white.label} {state.captures.white} ·{" "}
          {GAME_COPY.capturesToWin(state.settings.capturesToWin)}
        </p>
      ) : null}
      {state.status === GAME_STATUS.playing &&
      rulesFor(state.settings, state.toPlay).forbidden.length > 0 ? (
        <p className="text-xs text-muted">
          {STONE_DISPLAY[state.toPlay].label} may not play the points marked ✕.
        </p>
      ) : null}

      <ReactionBubbles reactions={shown} yourStone={seat} />

      <Board
        state={state}
        appearance={DEFAULT_APPEARANCE}
        readOnly={!playable}
        onPlay={play}
        onTwist={twist}
        selected={selected}
        footprintFor={hand.piece !== null ? hand.footprintFor : undefined}
        placing={choosesColour ? placing : null}
      />

      {choosesColour && playable ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="colour-chooser">
          <span className="text-xs text-muted">{GAME_COPY.placeAs}</span>
          {Object.values(STONES).map((stone) => (
            <Button key={stone} onClick={() => setPlacing(stone)} strong={placing === stone}>
              {STONE_DISPLAY[stone].label}
            </Button>
          ))}
        </div>
      ) : null}

      {hand.piece !== null && seat !== null ? (
        <PieceTray
          hand={hand}
          disabled={!playable}
          onRotate={rotate}
          onFlip={flip}
          onToggleSingle={toggleSingle}
          onPass={pass}
        />
      ) : null}

      {seat !== null && detail.allowResign && state.status === GAME_STATUS.playing ? (
        <div className="flex justify-end">
          <ResignButton id={detail.id} onDone={() => void mutate()} />
        </div>
      ) : null}

      {seat !== null && token !== null ? (
        <ReactionBar
          lastMove={state.moves.length > 0 ? state.moves.length : null}
          disabled={false}
          onSend={react}
        />
      ) : null}
      {seat !== null && muted === null ? (
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={quiet}
            onChange={(event) => writeQuiet(initial.id, event.target.checked)}
            className="size-3.5 accent-ink"
            data-testid="mute-game"
          />
          Mute this opponent&apos;s messages in this game
        </label>
      ) : null}
      {opponent !== null && seat !== null ? (
        <p className="text-xs text-muted" data-testid="opponent-line">
          You are playing {STONE_DISPLAY[seat].label.toLowerCase()} against{" "}
          <span className="font-medium text-ink">{opponent.name}</span>
          {opponent.country !== "" ? ` from ${opponent.country}` : ""}.
        </p>
      ) : null}
      <ReactionLog reactions={shown} />
    </div>
  );
}

function TurnBanner({
  state,
  seat,
  yourTurn,
  finished,
}: {
  state: ReturnType<typeof replayGame>;
  seat: Stone | null;
  yourTurn: boolean;
  finished: boolean;
}) {
  if (finished) {
    const won = state.winner;
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${TONE_CLASS.great}`}>
        {won === null
          ? "Draw. The board is full."
          : state.winBy === WIN_REASONS.resign
            ? `${STONE_DISPLAY[won].label} wins by resignation.`
            : state.winBy === WIN_REASONS.count
              ? `${STONE_DISPLAY[won].label} wins on discs, ${discCount(state.board).black} to ${discCount(state.board).white}.`
              : `${STONE_DISPLAY[won].label} wins in ${state.moves.length} moves.`}
      </p>
    );
  }

  if (seat === null) {
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_CLASS.calm}`}>
        You are watching. {STONE_DISPLAY[state.toPlay].label} to play.
      </p>
    );
  }

  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
        yourTurn ? TONE_CLASS.good : TONE_CLASS.calm
      }`}
      data-testid="turn-banner"
    >
      {yourTurn
        ? `Your move — you are ${STONE_DISPLAY[seat].label}.`
        : `Waiting for ${STONE_DISPLAY[state.toPlay].label}…`}
    </p>
  );
}

const QUIET_KEY = (id: string) => `itsutsu.mute.${id}`;

function readQuiet(id: string): boolean {
  try {
    return window.localStorage.getItem(QUIET_KEY(id)) === "1";
  } catch {
    return false;
  }
}

const QUIET_EVENT = "itsutsu:mute";

function writeQuiet(id: string, quiet: boolean): void {
  try {
    if (quiet) window.localStorage.setItem(QUIET_KEY(id), "1");
    else window.localStorage.removeItem(QUIET_KEY(id));
  } catch {
    // Not remembered, then.
  }
  window.dispatchEvent(new Event(QUIET_EVENT));
}

function subscribeQuiet(onChange: () => void): () => void {
  window.addEventListener(QUIET_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(QUIET_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** A budget in words: "1h 20m", "45s". */
function describeBudget(ms: number): string {
  return describeRemaining(new Date(ms), new Date(0));
}
