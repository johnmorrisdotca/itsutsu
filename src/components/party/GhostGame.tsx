"use client";

import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { ghostJudge } from "@/lib/party/superghost/ghostWords";
import { GHOST_PHASE, ghostAgain, playGhost } from "@/lib/party/superghost/superghost";
import type { GhostEnd, GhostMove } from "@/lib/party/superghost/superghost.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { GhostFragment } from "./GhostFragment";
import { GhostKeys } from "./GhostKeys";
import { GhostPlayers } from "./GhostPlayers";
import { GhostSetUp } from "./GhostSetUp";
import { GhostRoundOver, GhostTurnLine } from "./GhostTurnLine";
import { useKeptGhostGame } from "./ghostStore";
import { GHOST_COPY, PARTY_COPY } from "./party.constants";
import type { PartyTableGameProps } from "./party.types";
import { useGhostWords } from "./useGhostWords";

/**
 * SUPERGHOST PASSED ROUND THE TABLE, at /games/superghost/pass-and-play.
 *
 * Set up first — how many, which language, names — then the game, kept in
 * this browser after every move (`ghostStore.ts`, on `keptInBrowser`) and
 * nowhere else: no account is asked, nothing is rated, no server is told.
 * The words are checked here too, against the list for the game's language
 * (`useGhostWords`), fetched once when the table opens. Leave half way and it
 * is here when you come back, and waiting on My games meanwhile.
 *
 * Nothing is hidden in this game but the word a player has in mind, which
 * they keep in their head, so there is no screen to cover between turns. The
 * rules are all in `lib/party/superghost/superghost.ts`; this asks them what a
 * move does, and draws the answer.
 */
export function GhostGame({ gameHref }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptGhostGame();
  const [pending, setPending] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const words = useGhostWords(game === undefined || game === null ? null : game.language);

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="ghost-game" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="ghost-game" data-state="set-up">
        <GhostSetUp onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} />
      </section>
    );
  }

  const judge = words === "ready" ? ghostJudge(game.language) : null;
  const move = (made: GhostMove) => {
    if (judge === null) return;
    const next = playGhost(game, made, judge);
    if (next === null) return;
    setPending(null);
    keep(next);
  };
  const onEnd = (end: GhostEnd) => {
    if (pending !== null) move({ kind: "letter", letter: pending, end });
  };
  const playing = game.phase !== GHOST_PHASE.finished;

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      data-testid="ghost-game"
      data-state={game.phase}
      data-language={game.language}
      data-players={game.players.length}
      data-rounds={game.rounds.length}
      data-words={words}
      {...readyMark(hydrated && words === "ready")}
    >
      <div className="flex min-w-0 flex-col gap-3">
        {/* The turn line and the letters: what the whole table watches, and the game's picture (`party-screenshots.spec.ts`). */}
        <div className="flex flex-col gap-3" data-testid="ghost-stage">
          <GhostTurnLine game={game} judge={judge} />
          <GhostFragment game={game} pending={playing ? pending : null} onEnd={onEnd} note={<GhostRoundOver game={game} judge={judge} />} />
        </div>
        {words === "loading" ? <p className="text-sm text-muted" data-testid="ghost-words-loading">{GHOST_COPY.loading}</p> : null}
        {words === "failed" ? (
          <p className="text-sm font-semibold" role="alert" data-testid="ghost-words-failed">
            {GHOST_COPY.failed}
          </p>
        ) : null}
        {playing ? (
          <GhostKeys key={`${game.rounds.length}:${game.record}`} game={game} pending={pending} onPending={setPending} onMove={move} judge={judge} />
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <GhostPlayers game={game} />
        <div className="flex flex-wrap gap-2">
          {playing ? null : (
            <button type="button" onClick={() => keep(ghostAgain(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="ghost-again">
              {PARTY_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="ghost-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="ghost-new-yes"
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
              onClick={() => (playing ? setConfirming(true) : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="ghost-new"
            >
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {GHOST_COPY.about} →
          </Link>
        </p>
      </aside>
      {/*
        "ARE YOU STILL THERE?", as every surface a person plays on asks
        (`idleWatch.coverage.test.ts`). There is no clock to stop here and
        nothing to poll, so it only says what is true: the game waits, kept.
      */}
      <AskIfAway watching={playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}
