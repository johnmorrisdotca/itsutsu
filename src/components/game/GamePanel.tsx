"use client";

import { StartSharedGame } from "@/components/live/StartSharedGame";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { AppearancePanel } from "./AppearancePanel";
import { GameClock } from "./GameClock";
import { GameControls } from "./GameControls";
import { GameReviewPanel, type WinStreaks } from "./GameReviewPanel";
import { GameStatsPanel } from "./GameStatsPanel";
import { WinChanceBar } from "./WinChanceBar";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { GameStatus } from "./GameStatus";
import { MoveHistory } from "./MoveHistory";
import { NotesPanel } from "./NotesPanel";
import { PieceTray } from "./PieceTray";
import { PlayerNames } from "./PlayerNames";
import type { GamePanelProps } from "./game.types";

/**
 * What you need while a stone is in your hand: how the game stands, the
 * controls, and the record. It sits beside the board and sticks to the top, so
 * none of it scrolls away mid-game.
 */
export function GameSidebar({ postSeat = false, ...props }: GamePanelProps & { postSeat?: boolean }) {
  return (
    <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:w-80">
      <div className={PANEL_CLASS}>
        <GameStatus session={props.session} />
      </div>
      {props.session.settings.timeControl !== "none" ? (
        <div className={PANEL_CLASS}>
          <GameClock session={props.session} />
        </div>
      ) : null}
      {props.session.settings.showWinChance ? (
        <div className={PANEL_CLASS}>
          <WinChanceBar session={props.session} />
        </div>
      ) : null}
      {props.session.hand.piece !== null ? (
        <div className={PANEL_CLASS}>
          <PieceTray
            hand={props.session.hand}
            disabled={props.session.reviewing || props.session.state.status !== "playing"}
            onRotate={props.actions.rotatePiece}
            onFlip={props.actions.flipPiece}
            onToggleSingle={props.actions.toggleSingle}
            onPass={props.actions.pass}
          />
        </div>
      ) : null}
      <div className={PANEL_CLASS}>
        <GameControls {...props} />
      </div>
      <div className={PANEL_CLASS}>
        <StartSharedGame settings={props.session.state.settings} postSeat={postSeat} />
      </div>
      <div className={PANEL_CLASS}>
        <MoveHistory {...props} />
      </div>
      <div className={PANEL_CLASS}>
        <NotesPanel gameKey={`local:${props.session.state.settings.seed}`} />
      </div>
    </aside>
  );
}

/**
 * Everything you set once and then leave alone. It lives below the board
 * rather than beside it, which keeps the board as large as the screen allows.
 *
 * The set-up — rules and appearance — is open while the board is empty and
 * folds away once a stone is down, so a game in progress shows the players,
 * the numbers and the review, and the settings are a click away rather than
 * a screen away. The operator's own panels are on /admin, not here.
 */
export function GameOptions({
  streaks,
  ...props
}: GamePanelProps & { streaks: WinStreaks }) {
  const untouched = props.session.state.moves.length === 0;
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={PANEL_CLASS}>
          <PlayerNames {...props} />
        </div>
        <div className={PANEL_CLASS}>
          <GameStatsPanel session={props.session} />
        </div>
        <div className={PANEL_CLASS}>
          <GameReviewPanel session={props.session} streaks={streaks} />
        </div>
      </div>
      <details className={`${PANEL_CLASS} group`} open={untouched} data-testid="game-setup">
        <summary className={`flex cursor-pointer list-none items-baseline justify-between gap-3 ${SECTION_TITLE}`}>
          <span>
            Set up <span className="font-mincho text-[0.8rem] font-normal tracking-normal">設定</span>
          </span>
          <span className="font-normal tracking-normal group-open:hidden">show</span>
          <span className="hidden font-normal tracking-normal group-open:inline">hide</span>
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <GameSettingsPanel {...props} />
          <AppearancePanel {...props} />
        </div>
      </details>
    </section>
  );
}
