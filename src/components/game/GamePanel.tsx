"use client";

import { AdminEmbeds } from "@/components/auth/AdminEmbeds";
import { AdminInvites } from "@/components/auth/AdminInvites";
import { StartSharedGame } from "@/components/live/StartSharedGame";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
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
export function GameSidebar(props: GamePanelProps) {
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
        <StartSharedGame settings={props.session.state.settings} />
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
 */
export function GameOptions({
  streaks,
  ...props
}: GamePanelProps & { streaks: WinStreaks }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className={PANEL_CLASS}>
        <PlayerNames {...props} />
      </div>
      <div className={PANEL_CLASS}>
        <GameStatsPanel session={props.session} />
      </div>
      <div className={PANEL_CLASS}>
        <AdminInvites />
      </div>
      <div className={PANEL_CLASS}>
        <AdminEmbeds />
      </div>
      <div className={PANEL_CLASS}>
        <GameReviewPanel session={props.session} streaks={streaks} />
      </div>
      <div className={PANEL_CLASS}>
        <GameSettingsPanel {...props} />
      </div>
      <div className={PANEL_CLASS}>
        <AppearancePanel {...props} />
      </div>
    </section>
  );
}
