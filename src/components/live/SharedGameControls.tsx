import { writeTurned } from "@/components/board/turned";
import { GAME_COPY } from "@/components/game/game.constants";
import { Button } from "@/components/ui/Controls";
import { rulesFor } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONES, STONE_DISPLAY, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";

import type { ColourChooserProps, GoPassProps, RuleNotesProps, TurnBoardProps } from "./sharedGame.types";

/**
 * THE NOTES AND SMALL CONTROLS BESIDE A SHARED BOARD.
 *
 * Split out of `SharedGame.tsx` when it reached the file-size gate. The board
 * decides WHETHER each of these is offered — the conditions stay there, beside
 * the state they read — and these draw what is offered, exactly as they were
 * drawn inline.
 */

/** What the rules say about the position that the stones alone do not. */
export function RuleNotes({ state }: RuleNotesProps) {
  return (
    <>
      {VARIANT_SPECS[state.settings.variant].captures ? (
        <p className="text-xs text-muted" data-testid="shared-captures">
          {GAME_COPY.captures.label} · {STONE_DISPLAY.black.label}{" "}
          {state.captures.black} · {STONE_DISPLAY.white.label}{" "}
          {state.captures.white} ·{" "}
          {GAME_COPY.capturesToWin(state.settings.capturesToWin)}
        </p>
      ) : null}
      {state.status === GAME_STATUS.playing &&
      rulesFor(state.settings, state.toPlay).forbidden.length > 0 ? (
        <p className="text-xs text-muted">
          {STONE_DISPLAY[state.toPlay].label} may not play the points marked ✕.
        </p>
      ) : null}
    </>
  );
}

export function TurnBoardButton({ gameId, turned }: TurnBoardProps) {
  return (
    <>
      {/*
        This game's own way up. Above the board rather than buried in the
        settings, because it is answering a question the board is asking right
        now — you are looking at your camp from the wrong end — and it must be
        one press away from the position that prompted it.
      */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => writeTurned(gameId, !turned)}
          className="rounded-full border border-rule bg-ivory/70 px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-ivory"
          aria-pressed={turned}
          title="Your own view of this board. The other player's board does not move."
          data-testid="turn-board"
        >
          {turned ? "Turn the board back" : "Turn the board round"}{" "}
          <span className="font-mincho">盤反転</span>
        </button>
      </div>
    </>
  );
}

export function ColourChooser({ placing, onChoose }: ColourChooserProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="colour-chooser"
    >
      <span className="text-xs text-muted">{GAME_COPY.placeAs}</span>
      {Object.values(STONES).map((stone) => (
        <Button
          key={stone}
          onClick={() => onChoose(stone)}
          strong={placing === stone}
        >
          {STONE_DISPLAY[stone].label}
        </Button>
      ))}
    </div>
  );
}

export function GoPassButton({ disabled, onPass }: GoPassProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={onPass}
        disabled={disabled}
        title={GAME_COPY.passHint}
      >
        {GAME_COPY.pass.label}
      </Button>
    </div>
  );
}
