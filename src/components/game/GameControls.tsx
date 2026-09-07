"use client";

import { SUGGESTION_DISPLAY } from "@/lib/gomoku/analysis.constants";
import { pointName } from "@/lib/gomoku/notation";
import { seatToPlay } from "@/lib/gomoku/engine";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { Button } from "@/components/ui/Controls";
import { GAME_COPY, HINT_POLICIES } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/** What the engine suggested, once a hint has been spent on this position. */
function HintLine({ session }: Pick<GamePanelProps, "session">) {
  const { hint, state } = session;
  if (hint === null) return null;

  const { label, kanji } = SUGGESTION_DISPLAY[hint.reason];
  return (
    <p className="text-xs text-sky-700 dark:text-sky-300" data-testid="hint-line">
      <span className="font-mono font-semibold">
        {pointName(state.settings.size, hint.point)}
      </span>{" "}
      — {label} <span className="opacity-70">{kanji}</span>
    </p>
  );
}

export function GameControls({ session, actions }: GamePanelProps) {
  const { state, settings, hintsLeft, helpRequest } = session;
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
        <Button onClick={() => actions.reset()} strong>
          {GAME_COPY.newGame.label}
        </Button>
      </div>

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

      <div className="flex flex-col gap-2">
        {helpRequest === null ? (
          <Button onClick={actions.requestHelp} title={GAME_COPY.askHelpHint}>
            {GAME_COPY.askHelp.label}
          </Button>
        ) : (
          <div
            className="flex flex-col gap-2 rounded-xl border border-purple-300/80 bg-purple-50 px-3 py-2.5 text-purple-950 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-100"
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
