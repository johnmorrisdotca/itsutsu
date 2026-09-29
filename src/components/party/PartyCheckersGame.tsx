"use client";

import { useState } from "react";

import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import type { Point } from "@/lib/gomoku/gomoku.types";
import {
  PARTY_RADIUS,
  PARTY_SIZE,
  PARTY_STATUS,
  partyDestinations,
  partyMove,
  partyPiecesHome,
  partyPlayerName,
  startPartyGame,
} from "@/lib/gomoku/party/partyCheckers";
import type { PartyCheckersState, PartyPlayerCount } from "@/lib/gomoku/party/partyCheckers.types";
import { starCampSize } from "@/lib/gomoku/engine";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MarbleChip } from "./MarbleChip";
import { PartySetUp } from "./PartySetUp";
import { PartyStarBoard } from "./PartyStarBoard";
import { PARTY_COPY, PARTY_MARBLES } from "./party.constants";
import type { PartyCheckersGameProps } from "./party.types";
import { useKeptPartyGame } from "./partyCheckersStore";

/** How many pieces fill a point: ten on the standard star. */
const PIECES = starCampSize(PARTY_RADIUS);

/**
 * CHINESE CHECKERS PASSED ROUND THE TABLE.
 *
 * Nothing is hidden in this game, so there is no screen to cover the board
 * between turns as there is in a game of hidden tiles: whoever holds the
 * device plays the colour the turn line names, and hands it on. The game is
 * kept in this browser after every move (`partyCheckersStore.ts`), so it is
 * never lost to a closed tab — and never anywhere else: no account is asked,
 * nothing is rated, and no server is told.
 *
 * The rules are all in `lib/gomoku/party/partyCheckers.ts`. This asks it where
 * a piece may go and what the board is after a move, and draws the answer.
 */
export function PartyCheckersGame({ appearance, gameHref }: PartyCheckersGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptPartyGame();
  const [selected, setSelected] = useState<Point | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="party-checkers" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="party-checkers" data-state="set-up">
        <PartySetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} />
      </section>
    );
  }

  // A piece picked up stays picked only while it is still the mover's (another tab may have moved).
  const picked = selected !== null && game.board[selected.row * PARTY_SIZE + selected.col] === game.toPlay ? selected : null;
  const targets = picked === null ? [] : partyDestinations(game, picked);

  const onHole = (point: Point) => {
    if (picked !== null && targets.some((one) => one.row === point.row && one.col === point.col)) {
      const next = partyMove(game, picked, point);
      if (next !== null) keep(next);
      setSelected(null);
      return;
    }
    const mine = game.board[point.row * PARTY_SIZE + point.col] === game.toPlay;
    setSelected(mine && !(picked?.row === point.row && picked.col === point.col) ? point : null);
  };

  const again = () => {
    keep(startPartyGame(game.players.length as PartyPlayerCount, game.players.map((player) => player.name)));
    setSelected(null);
  };

  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start"
      data-testid="party-checkers"
      data-state={game.status}
      data-players={game.players.length}
      data-moves={game.moves.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <TurnLine game={game} />
        <PartyStarBoard game={game} appearance={appearance} selected={picked} targets={targets} onHole={onHole} />
        {game.status === PARTY_STATUS.playing ? <p className="text-xs text-muted">{PARTY_COPY.pick}</p> : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="party-players">
          <h2 className={SECTION_TITLE}>
            At the table <span className="font-mincho normal-case tracking-normal">席</span>
          </h2>
          <ol className="flex flex-col gap-1.5">
            {game.players.map((player, index) => (
              <li
                key={player.tip}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${index === game.toPlay && game.status === PARTY_STATUS.playing ? "bg-rule/60 font-semibold" : ""}`}
                data-testid="party-player"
                data-player={index}
              >
                <MarbleChip player={index} />
                <span className="min-w-0 flex-1 truncate">{partyPlayerName(game.players, index)}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {partyPiecesHome(game, index)} of {PIECES} home
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
            About Chinese Checkers, its rules and its rated game for two →
          </Link>
        </p>
      </aside>
    </section>
  );
}

/** Whose turn it is, by name and colour — or who has won. */
function TurnLine({ game }: { game: PartyCheckersState }) {
  if (game.status === PARTY_STATUS.won && game.winner !== null) {
    return (
      <p className={`${PANEL_CLASS} flex items-center gap-2 text-base font-semibold`} data-testid="party-winner" data-player={game.winner}>
        <MarbleChip player={game.winner} />
        <span>
          {partyPlayerName(game.players, game.winner)} wins, the first to fill the far point.
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
  const marble = PARTY_MARBLES[game.toPlay];
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
