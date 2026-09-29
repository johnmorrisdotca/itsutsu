"use client";

import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { PartySeatColour } from "./PartySeatColour";
import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { MANCALA_STATUS, mancalaAgain, mustFeed, sowMancala } from "@/lib/party/mancala/mancala";
import { partyPlayerName } from "@/lib/party/partyNames";
import type { MancalaGame as MancalaGameState } from "@/lib/party/mancala/mancala.types";
import { storeOf } from "@/lib/party/mancala/sowing";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MancalaBoard } from "./MancalaBoard";
import { MancalaSetUp } from "./MancalaSetUp";
import { MancalaTurnLine } from "./MancalaTurnLine";
import { MarbleChip } from "./MarbleChip";
import { useKeptMancalaGame } from "./mancalaStore";
import { MANCALA_COPY, PARTY_COPY } from "./party.constants";
import type { PartyTableGameProps } from "./party.types";
import { useSowing } from "./useSowing";

/**
 * MANCALA PASSED ACROSS THE TABLE, at /games/mancala/pass-and-play.
 *
 * Set up first — which rules, and names — then the game, kept in this browser
 * after every sowing (`mancalaStore.ts`, on `keptInBrowser`) and nowhere
 * else: no account is asked, nothing is rated, no server is told. Leave half
 * way and it is here when you come back, and waiting on My games meanwhile.
 *
 * Nothing is hidden in this game, so there is no screen to cover the board
 * between turns: whoever holds the device sows for the name the turn line
 * says, and hands it across. The rules are all in `lib/party/mancala/`; this
 * asks them what a sowing does, keeps the answer at once, and draws the seeds
 * falling (`useSowing`) on the way to it.
 */
export function MancalaGame({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptMancalaGame();
  const [confirming, setConfirming] = useState(false);
  const shown = useSowing(game);

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="mancala-game" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="mancala-game" data-state="set-up">
        <MancalaSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  const onPit = (pit: number) => {
    const next = sowMancala(game, pit);
    if (next === null) return;
    keep(next);
    shown.start(game, next);
  };
  const hungry = mustFeed(game) ? partyPlayerName(game, game.toPlay === 0 ? 1 : 0) : null;

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="mancala-game"
      data-state={game.status}
      data-rules={game.ruleSet}
      data-moves={game.moves.length}
      data-sowing={shown.sowing ? "true" : undefined}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <MancalaTurnLine game={game} sowing={shown.sowing} />
        <MancalaBoard game={game} appearance={appearance} holes={shown.holes} landing={shown.landing} onPit={onPit} />
        {game.status === MANCALA_STATUS.playing ? (
          <p className="text-xs text-muted" data-testid="mancala-hint" data-feed={hungry === null ? undefined : "true"}>
            {hungry === null ? MANCALA_COPY.tap : MANCALA_COPY.feed(hungry)}
          </p>
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`); furniture in just the board. */}
        {game.status === MANCALA_STATUS.playing ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={partyPlayerName(game, game.toPlay)} playing={2} />
          </div>
        ) : null}
        <TableStores game={game} />
        <div className="flex flex-wrap gap-2">
          {game.status === MANCALA_STATUS.playing ? null : (
            <button type="button" onClick={() => keep(mancalaAgain(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="mancala-again">
              {PARTY_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="mancala-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="mancala-new-yes"
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
              onClick={() => (game.status === MANCALA_STATUS.playing ? setConfirming(true) : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="mancala-new"
            >
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {MANCALA_COPY.about} →
          </Link>
        </p>
      </aside>
      {/*
        "ARE YOU STILL THERE?", as every board a person plays on asks
        (`idleWatch.coverage.test.ts`). There is no clock to stop here and
        nothing to poll, so it only says what is true: the game waits, kept.
      */}
      <AskIfAway watching={game.status === MANCALA_STATUS.playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}

/** The two at the table, the one whose turn it is marked, with what each has in their store. */
function TableStores({ game }: { game: MancalaGameState }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="mancala-players">
      <h2 className={SECTION_TITLE}>
        Players <span className="font-mincho normal-case tracking-normal">席</span>
      </h2>
      <ol className="flex flex-col gap-1.5">
        {game.players.map((_, seat) => (
          <li
            key={seat}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
              seat === game.toPlay && game.status === MANCALA_STATUS.playing ? "bg-rule/60 font-semibold" : ""
            }`}
            data-testid="mancala-player"
            data-player={seat}
            data-store={game.holes[storeOf(seat)]}
          >
            <MarbleChip player={seat} />
            <span className="min-w-0 flex-1 truncate">{partyPlayerName(game, seat)}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">{MANCALA_COPY.seeds(game.holes[storeOf(seat)])}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        {MANCALA_COPY.sowings(game.moves.length)}. {PARTY_COPY.kept}
      </p>
    </section>
  );
}
