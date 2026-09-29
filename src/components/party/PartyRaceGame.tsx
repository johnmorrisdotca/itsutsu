"use client";

import { usePartyMarbles } from "./partyMarbles";
import { PartySeatColour } from "./PartySeatColour";
import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE, PLAY_SURFACE } from "@/components/ui/ui.constants";
import type { Point } from "@/lib/gomoku/gomoku.types";
import { PARTY_STATUS, partyPlayerName } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MarbleChip } from "./MarbleChip";
import { PartySetUp } from "./PartySetUp";
import { PARTY_COPY } from "./party.constants";
import type { PartyRaceKind, PartyTableGameProps } from "./party.types";

/**
 * A RACE PASSED ROUND THE TABLE: Chinese Checkers on the star, or Halma on
 * its square board — whichever `kind` says (`partyRaces.ts`).
 *
 * Nothing is hidden in these games, so there is no screen to cover the board
 * between turns as there is in a game of hidden tiles: whoever holds the
 * device plays the colour the turn line names, and hands it on. The game is
 * kept in this browser after every move (the kind's own store, on
 * `keptInBrowser.ts`), so it is never lost
 * to a closed tab — and never anywhere else: no account is asked, nothing is
 * rated, and no server is told.
 *
 * The rules are all in the kind's own module under `lib/gomoku/party/`. This
 * asks it where a piece may go and what the board is after a move, and hands
 * the answer to the kind's board to draw.
 */
export function PartyRaceGame<S extends PartyRaceState, C extends number>({ kind, appearance, gameHref, online }: PartyTableGameProps & { kind: PartyRaceKind<S, C> }) {
  const hydrated = useHydrated();
  const [game, keep] = kind.useKept();
  const [selected, setSelected] = useState<Point | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { rules, Board } = kind;
  // The cover over the board, when the race is won here (`WinCover`); a race nobody can finish ends without one.
  const moment = useWinMoment(game === undefined || game === null ? "unknown" : game.status === PARTY_STATUS.playing ? "playing" : "ended");

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid={kind.testId} {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid={kind.testId} data-state="set-up">
        <PartySetUp kind={kind} appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  // A piece picked up stays picked only while it is still the mover's (another tab may have moved).
  const picked = selected !== null && game.board[selected.row * rules.size + selected.col] === game.toPlay ? selected : null;
  const targets = picked === null ? [] : rules.destinations(game, picked);

  const onHole = (point: Point) => {
    if (picked !== null && targets.some((one) => one.row === point.row && one.col === point.col)) {
      const next = rules.move(game, picked, point);
      if (next !== null) keep(next);
      setSelected(null);
      return;
    }
    const mine = game.board[point.row * rules.size + point.col] === game.toPlay;
    setSelected(mine && !(picked?.row === point.row && picked.col === point.col) ? point : null);
  };

  const again = () => {
    keep(rules.again(game));
    setSelected(null);
  };

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid={kind.testId}
      data-state={game.status}
      data-players={game.players.length}
      data-moves={game.moves.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <RaceTurnLine game={game} farCamp={kind.copy.farCamp} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names: game.players.map((_, index) => partyPlayerName(game.players, index)),
                  winners: game.status === PARTY_STATUS.won && game.winner !== null ? [game.winner] : [],
                  you: null,
                  next: { label: PARTY_COPY.again, onPress: again },
                })
              : null
          }
          onClose={moment.close}
        >
          <Board game={game} appearance={appearance} selected={picked} targets={targets} onHole={onHole} />
        </WinCoverOver>
        {game.status === PARTY_STATUS.playing ? <p className="text-xs text-muted">{PARTY_COPY.pick}</p> : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`); furniture in just the board. */}
        {game.status === PARTY_STATUS.playing ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={partyPlayerName(game.players, game.toPlay)} playing={game.players.length} />
          </div>
        ) : null}
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="party-players">
          <h2 className={SECTION_TITLE}>
            Players <span className="font-mincho normal-case tracking-normal">席</span>
          </h2>
          <ol className="flex flex-col gap-1.5">
            {game.players.map((_, index) => (
              <li
                key={rules.seatOf(game, index)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${index === game.toPlay && game.status === PARTY_STATUS.playing ? "bg-rule/60 font-semibold" : ""}`}
                data-testid="party-player"
                data-player={index}
              >
                <MarbleChip player={index} />
                <span className="min-w-0 flex-1 truncate">{partyPlayerName(game.players, index)}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {rules.piecesHome(game, index)} of {rules.piecesEach(game)} home
                </span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted">
            {game.moves.length} {game.moves.length === 1 ? "move" : "moves"} played. {PARTY_COPY.kept}
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          {game.status === PARTY_STATUS.playing ? null : (
            <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="party-again">
              {PARTY_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="party-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                  setSelected(null);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="party-new-yes"
              >
                {PARTY_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PARTY_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (game.status === PARTY_STATUS.playing ? setConfirming(true) : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="party-new"
            >
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {kind.copy.about} →
          </Link>
        </p>
      </aside>
      {/*
        "ARE YOU STILL THERE?", as every board a person plays on asks
        (`idleWatch.coverage.test.ts`). There is no clock to stop here and
        nothing to poll, so it only says what is true: the game waits, kept.
      */}
      <AskIfAway watching={game.status === PARTY_STATUS.playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}

/** Whose turn it is, by name and colour — or who has won. The same line at a table on several devices (`RaceOnline`). */
export function RaceTurnLine({ game, farCamp }: { game: PartyRaceState; farCamp: string }) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  if (game.status === PARTY_STATUS.won && game.winner !== null) {
    return (
      <p className={`${PANEL_CLASS} flex items-center gap-2 text-base font-semibold`} data-testid="party-winner" data-player={game.winner}>
        <MarbleChip player={game.winner} />
        <span>
          {partyPlayerName(game.players, game.winner)} wins, the first to fill {farCamp}.
        </span>
      </p>
    );
  }
  if (game.status === PARTY_STATUS.stuck) {
    return (
      <p className={`${PANEL_CLASS} text-sm`} data-testid="party-stuck">
        {PARTY_COPY.stuck}
      </p>
    );
  }
  const marble = marbles[game.toPlay];
  return (
    <p className={`${PANEL_CLASS} flex items-center gap-2 text-base`} data-testid="party-turn" data-player={game.toPlay} aria-live="polite">
      <MarbleChip player={game.toPlay} />
      <span className="min-w-0">
        <span className="font-semibold" data-testid="party-turn-name">
          {partyPlayerName(game.players, game.toPlay)}
        </span>
        <span className="text-muted">
          {"’s turn"} · {marble.label} ({marble.letter})
        </span>
      </span>
    </p>
  );
}
