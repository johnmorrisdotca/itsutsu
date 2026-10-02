"use client";

import { EndGameButton, GameEnding, NewGameButton } from "@/components/play/GameEnding";
import { useLocalSeatColours } from "@/components/game/useLocalSeatColours";
import { SeatColoursPanel } from "@/components/game/SeatColoursPanel";
import { StoneColoursProvider } from "@/components/board/seatColourContext";

import { Board } from "@/components/board/Board";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { canPass } from "@/lib/gomoku/engine";
import { GAME_STATUS, RULE_VARIANTS, STONES, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { boardWords } from "@/lib/gomoku/boardWords";
import { againPairGo, pairPass, pairPlay, pairPlayerToMove, pairPlayers, pairResign } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame as PairGoGameState } from "@/lib/gomoku/party/pairGo.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TableWallpaper } from "./TableWallpaper";
import { resultLine } from "@/components/game/winNews";
import { PairGoSetUp } from "./PairGoSetUp";
import { PairGoTurnLine, teamWords } from "./PairGoStatus";
import { PairStone } from "./PairStone";
import { PAIR_GO_COPY } from "./pairGo.constants";
import { useKeptPairGo } from "./pairGoStore";
import type { PartyTableGameProps } from "./party.types";
import { PlayingNow } from "@/components/layout/PlayingNow";

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
export function PairGoGame({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptPairGo();
  const teams = useLocalSeatColours("pairgo");
  const playing = game !== undefined && game !== null && game.state.status === GAME_STATUS.playing;
  // The cover over the board, when the game ends here (`WinCover`), naming the winning team; never on a finished table opened again.
  const moment = useWinMoment(game === undefined || game === null ? "unknown" : playing ? "playing" : "ended");

  // Not read yet: the server has no browser to ask, so it keeps the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="pairgo" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="pairgo" data-state="set-up">
        <PairGoSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  const toMove = pairPlayerToMove(game);
  const act = (next: PairGoGameState | null) => {
    if (next !== null) keep(next);
  };

  return (
    // Each team's stone colour, chosen at this one table and kept in this browser (`useLocalSeatColours`).
    <StoneColoursProvider colours={teams.colours}>
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
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names: [teamWords(game, STONES.black), teamWords(game, STONES.white)],
                  winners: game.state.winner === null ? [] : [game.state.winner === STONES.black ? 0 : 1],
                  you: null,
                  next: { label: PAIR_GO_COPY.again, onPress: () => act(againPairGo(game)) },
                })
              : null
          }
          onClose={moment.close}
        >
          <Board
            state={game.state}
            appearance={appearance}
            readOnly={!playing}
            onPlay={(point) => act(pairPlay(game, point))}
            viewer={null}
            colours={teams.colours}
          />
        </WinCoverOver>
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
          </div>
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* Each team's colour, any time; furniture in just the board. */}
        <div data-chrome>
          <SeatColoursPanel colours={teams.colours} appearance={appearance} onChoose={teams.choose} />
        </div>
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="pairgo-players">
          <h2 className={SECTION_TITLE}>
            Players <span className="font-mincho normal-case tracking-normal">席</span>
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
          <GameEnding>
            {playing && toMove !== null ? (
              <EndGameButton onEnd={() => act(pairResign(game))} question={PAIR_GO_COPY.confirmResign(teamWords(game, toMove.stone))} testId="pairgo-resign" />
            ) : null}
            <NewGameButton going={playing} onNewGame={() => keep(null)} testId="pairgo-new" />
          </GameEnding>
        </div>
        {playing || game.state.winner === null ? null : (
          <TableWallpaper game={RULE_VARIANTS.go} result={resultLine([teamWords(game, STONES.black), teamWords(game, STONES.white)], [game.state.winner === STONES.black ? 0 : 1])} />
        )}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {PAIR_GO_COPY.about}
          </Link>
        </p>
      </aside>
      {/* Asked on every surface a person plays on; nothing here is timed, so being away loses nothing. */}
      <AskIfAway watching={playing} detail={PAIR_GO_COPY.idleDetail} kept={PAIR_GO_COPY.away} />
    </section>
    </StoneColoursProvider>
  );
}
