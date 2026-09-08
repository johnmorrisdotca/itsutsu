"use client";

import { useState } from "react";
import { SUGGESTION_DISPLAY } from "@/lib/gomoku/analysis.constants";
import { pointName } from "@/lib/gomoku/notation";
import { canChooseColour, canExtendOpening, seatToPlay } from "@/lib/gomoku/engine";
import { GAME_STATUS, SEAT_DISPLAY, STONES, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { Button } from "@/components/ui/Controls";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { GameBrowserButton } from "./GameBrowser";
import { GAME_COPY, HINT_POLICIES } from "./game.constants";
import { openingPrompt } from "./openingCopy";
import type { GamePanelProps } from "./game.types";

/** Which colour the next stone will be, in the games where the mover chooses. */
function ColourChooser({ session, actions }: GamePanelProps) {
  if (session.placing === null || session.state.status !== "playing") return null;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="colour-chooser">
      <span className="text-xs text-muted">{GAME_COPY.placeAs}</span>
      {Object.values(STONES).map((stone) => (
        <Button
          key={stone}
          onClick={() => actions.setPlacing(stone)}
          strong={session.placing === stone}
          data-testid={`place-${stone}`}
        >
          {STONE_DISPLAY[stone].label}
        </Button>
      ))}
    </div>
  );
}

/**
 * The decision a swap opening pauses on: which colour the deciding seat takes,
 * and in swap2 the option of laying two more stones instead.
 */
function OpeningChoice({ session, actions }: GamePanelProps) {
  const { state, names } = session;
  if (!canChooseColour(state) || session.reviewing) return null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 ${TONE_CLASS.good}`}
      data-testid="opening-choice"
    >
      <p className="text-sm font-semibold">{openingPrompt(state, names)}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => actions.chooseColour(STONES.black)} data-testid="take-black">
          {GAME_COPY.takeBlack.label}
        </Button>
        <Button onClick={() => actions.chooseColour(STONES.white)} data-testid="take-white">
          {GAME_COPY.takeWhite.label}
        </Button>
        {canExtendOpening(state) ? (
          <Button
            onClick={actions.extendOpening}
            title={GAME_COPY.extendOpeningHint}
            data-testid="extend-opening"
          >
            {GAME_COPY.extendOpening.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** What the engine suggested, once a hint has been spent on this position. */
function HintLine({ session }: Pick<GamePanelProps, "session">) {
  const { hint, state } = session;
  if (hint === null) return null;

  const { label, kanji } = SUGGESTION_DISPLAY[hint.reason];
  return (
    <p className="text-xs text-moss" data-testid="hint-line">
      <span className="font-mono font-semibold">
        {pointName(state.settings.size, hint.point)}
      </span>{" "}
      — {label} <span className="opacity-70">{kanji}</span>
    </p>
  );
}

export function GameControls({ session, actions }: GamePanelProps) {
  const { state, settings, hintsLeft, helpRequest } = session;
  /*
   * A board with stones on it and no result is somebody's game. Starting a new
   * one throws it away, and this is the only control here that can, so it asks
   * first — in the panel, the way asking for advice does, not in a dialog.
   */
  const underway = state.moves.length > 0 && state.status === GAME_STATUS.playing;
  const [askingNew, setAskingNew] = useState(false);
  const seat = seatToPlay(state);
  const limited = settings.hintPolicy === HINT_POLICIES.limited;
  const hintsAvailable =
    settings.hintPolicy === HINT_POLICIES.unlimited || hintsLeft[seat] > 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={actions.undo}
          disabled={!session.canUndo}
          title={
            state.settings.allowUndo ? undefined : "Undo is switched off for this game."
          }
        >
          {GAME_COPY.undo.label}
        </Button>
        <Button onClick={actions.redo} disabled={!session.canRedo}>
          {GAME_COPY.redo.label}
        </Button>
        <Button onClick={() => (underway ? setAskingNew(true) : actions.reset())} strong>
          {GAME_COPY.newGame.label}
        </Button>
        <GameBrowserButton session={session} actions={actions} />
      </div>

      {askingNew ? (
        <div
          className="flex flex-col gap-2 rounded-xl border border-moss/40 bg-moss-soft px-3 py-2.5 text-ink"
          data-testid="new-game-confirm"
        >
          <p className="text-sm font-semibold">{GAME_COPY.newGameConfirm}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setAskingNew(false);
                actions.reset();
              }}
              strong
              data-testid="new-game-yes"
            >
              {GAME_COPY.newGameYes.label}
            </Button>
            <Button onClick={() => setAskingNew(false)}>{GAME_COPY.newGameNo.label}</Button>
          </div>
        </div>
      ) : null}

      <OpeningChoice session={session} actions={actions} />
      <ColourChooser session={session} actions={actions} />

      {state.settings.allowSkip || state.settings.allowSwap ? (
        <div className="flex flex-wrap gap-2">
          {state.settings.allowSkip ? (
            <Button
              onClick={actions.skip}
              disabled={!session.canSkip}
              title={GAME_COPY.skipHint}
            >
              {GAME_COPY.skip.label}
            </Button>
          ) : null}
          {state.settings.allowSwap ? (
            <Button
              onClick={actions.swap}
              disabled={!session.canSwap}
              title={session.swapBlockedReason ?? GAME_COPY.swapHint}
            >
              {GAME_COPY.swap.label}
            </Button>
          ) : null}
        </div>
      ) : null}

      {settings.hintPolicy !== HINT_POLICIES.off ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={actions.askHint}
              disabled={!hintsAvailable}
              title={hintsAvailable ? undefined : GAME_COPY.noHintsLeft}
              data-testid="ask-hint"
            >
              {GAME_COPY.hint.label}
              {limited ? (
                <span className="font-mono text-xs opacity-70">
                  {hintsLeft[seat]}
                </span>
              ) : null}
            </Button>
            {limited ? (
              <Button
                onClick={actions.grantHint}
                disabled={hintsLeft[seat] <= 0}
                title={GAME_COPY.grantHint}
              >
                {GAME_COPY.grant.label}
              </Button>
            ) : null}
          </div>
          <HintLine session={session} />
        </div>
      ) : null}

      {session.resizeProposal !== null ? (
        <div
          className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 ${TONE_CLASS.warn}`}
          role="alertdialog"
          data-testid="resize-proposal"
        >
          <p className="text-sm font-semibold">
            {SEAT_DISPLAY[session.resizeProposal.from].label} wants a{" "}
            {session.resizeProposal.direction === "grow" ? "bigger" : "smaller"}{" "}
            board — {session.resizeProposal.size}×{session.resizeProposal.size}.
          </p>
          <p className="text-xs leading-snug opacity-85">
            The stones keep their positions, and nobody loses a turn.
          </p>
          <div className="flex gap-2">
            <Button onClick={actions.acceptResize} strong data-testid="accept-resize">
              {GAME_COPY.resizeAgree.label}
            </Button>
            <Button onClick={actions.declineResize} data-testid="decline-resize">
              {GAME_COPY.resizeDecline.label}
            </Button>
          </div>
        </div>
      ) : session.canProposeGrow || session.canProposeShrink ? (
        <div className="flex flex-wrap gap-2">
          {session.canProposeGrow ? (
            <Button
              onClick={() => actions.proposeResize("grow")}
              title={GAME_COPY.resizeHint}
              data-testid="propose-grow"
            >
              {GAME_COPY.grow.label}
            </Button>
          ) : null}
          {session.canProposeShrink ? (
            <Button
              onClick={() => actions.proposeResize("shrink")}
              title={GAME_COPY.resizeHint}
              data-testid="propose-shrink"
            >
              {GAME_COPY.shrink.label}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {helpRequest === null ? (
          <Button onClick={actions.requestHelp} title={GAME_COPY.askHelpHint}>
            {GAME_COPY.askHelp.label}
          </Button>
        ) : (
          <div
            className="flex flex-col gap-2 rounded-xl border border-moss/40 bg-moss-soft px-3 py-2.5 text-ink"
            data-testid="help-request"
          >
            <p className="text-sm font-semibold">
              {SEAT_DISPLAY[helpRequest === "one" ? "two" : "one"].label},{" "}
              {GAME_COPY.helpWaiting}
            </p>
            <Button onClick={actions.cancelHelp}>{GAME_COPY.cancelHelp.label}</Button>
          </div>
        )}
      </div>
    </section>
  );
}
