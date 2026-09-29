"use client";

import { useState } from "react";

import { Board } from "@/components/board/Board";
import { AskIfAway } from "@/components/game/AskIfAway";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { canPass } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { boardWords } from "@/lib/gomoku/boardWords";
import { againPairGo, pairPass, pairPlay, pairPlayerToMove, pairPlayers, pairResign } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame as PairGoGameState } from "@/lib/gomoku/party/pairGo.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PairGoSetUp } from "./PairGoSetUp";
import { PairGoTurnLine, teamWords } from "./PairGoStatus";
import { PairStone } from "./PairStone";
import { PAIR_GO_COPY } from "./pairGo.constants";
import { useKeptPairGo } from "./pairGoStore";
import type { PartyTableGameProps } from "./party.types";

/** What a press on the table is waiting to be sure of, if anything. */
type Confirming = "resign" | "new" | null;

/**
 * PAIR GO, PASSED ROUND THE TABLE: two teams of two on one device.
 *
 * The board is the site's own `Board`, given the engine's own state for Go:
 * every stone, capture, ko and pass is the engine's decision, asked through
 * `lib/gomoku/party/pairGo.ts`, and nothing here reads the board to decide
 * anything. What this adds is the table: the turn line names the player whose
 * move it is ("Aiko (Black)"), the four are listed in the order they play, and
 * the game is kept in this browser after every move (`pairGoStore.ts`) — never
 * rated, never on an account, never sent to a server.
 */
export function PairGoGame({ appearance, gameHref }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptPairGo();
  const [confirming, setConfirming] = useState<Confirming>(null);
  const playing = game !== undefined && game !== null && game.state.status === GAME_STATUS.playing;

  // Not read yet: the server has no browser to ask, so it keeps the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="pairgo" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="pairgo" data-state="set-up">
        <PairGoSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} />
      </section>
    );
  }

  const toMove = pairPlayerToMove(game);
  const act = (next: PairGoGameState | null) => {
    if (next !== null) keep(next);
    setConfirming(null);
  };

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="pairgo"
      data-state={game.state.status}
      data-moves={game.state.moves.length}
      data-size={game.state.settings.size}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <PairGoTurnLine game={game} appearance={appearance} />
        <Board
          state={game.state}
          appearance={appearance}
          readOnly={!playing}
          onPlay={(point) => act(pairPlay(game, point))}
          viewer={null}
        />
        {playing ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => act(pairPass(game))}
              disabled={!canPass(game.state)}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="pairgo-pass"
            >
              {PAIR_GO_COPY.pass}
            </button>
            {confirming === "resign" && toMove !== null ? (
              <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="pairgo-confirm-resign">
                <span>{PAIR_GO_COPY.confirmResign(teamWords(game, toMove.stone))}</span>
                <button type="button" onClick={() => act(pairResign(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="pairgo-resign-yes">
                  {PAIR_GO_COPY.resignYes}
                </button>
                <button type="button" onClick={() => setConfirming(null)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                  {PAIR_GO_COPY.confirmNo}
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirming("resign")} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="pairgo-resign">
                {PAIR_GO_COPY.resign}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="pairgo-players">
          <h2 className={SECTION_TITLE}>
            At the board <span className="font-mincho normal-case tracking-normal">席</span>
          </h2>
          <ol className="flex flex-col gap-1.5">
            {pairPlayers(game).map((player) => (
              <li
                key={player.turnOrder}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                  toMove !== null && toMove.turnOrder === player.turnOrder ? "bg-rule/60 font-semibold" : ""
                }`}
                data-testid="pairgo-player"
                data-turn={player.turnOrder}
                data-to-move={toMove !== null && toMove.turnOrder === player.turnOrder ? "true" : "false"}
              >
                <PairStone stone={player.stone} appearance={appearance} />
                <span className="min-w-0 flex-1 truncate">{player.name}</span>
                <span className="shrink-0 text-xs text-muted">{STONE_DISPLAY[player.stone].label}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted">
            {boardWords(game.state.settings.variant, game.state.settings.size)} · {game.state.moves.length}{" "}
            {game.state.moves.length === 1 ? "move" : "moves"} · captured: Black {game.state.captures.black}, White{" "}
            {game.state.captures.white}. {PAIR_GO_COPY.kept}
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          {playing ? null : (
            <button type="button" onClick={() => act(againPairGo(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="pairgo-again">
              {PAIR_GO_COPY.again}
            </button>
          )}
          {confirming === "new" ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="pairgo-confirm-new">
              <span>{PAIR_GO_COPY.confirmNew}</span>
              <button type="button" onClick={() => { keep(null); setConfirming(null); }} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="pairgo-new-yes">
                {PAIR_GO_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(null)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PAIR_GO_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (playing ? setConfirming("new") : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="pairgo-new"
            >
              {PAIR_GO_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {PAIR_GO_COPY.about}
          </Link>
        </p>
      </aside>
      {/* Asked on every surface a person plays on; nothing here is timed, so being away loses nothing. */}
      <AskIfAway watching={playing} detail={PAIR_GO_COPY.idleDetail} kept={PAIR_GO_COPY.away} />
    </section>
  );
}
