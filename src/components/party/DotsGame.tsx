"use client";

import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { DOTS_STATUS, dotsAgain, dotsLineCount, dotsPlayerName, drawLine } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame as DotsGameState } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { DotsBoard } from "./DotsBoard";
import { DotsSetUp } from "./DotsSetUp";
import { DotsTurnLine } from "./DotsTurnLine";
import { MarbleChip } from "./MarbleChip";
import { useKeptDotsGame } from "./dotsStore";
import { DOTS_COPY, PARTY_COPY } from "./party.constants";
import type { PartyTableGameProps } from "./party.types";

/**
 * DOTS AND BOXES PASSED ROUND THE TABLE, at /games/dots-and-boxes/pass-and-play.
 *
 * Set up first — how many, which board, names — then the game, kept in this
 * browser after every line (`dotsStore.ts`, on `keptInBrowser`) and nowhere
 * else: no account is asked, nothing is rated, no server is told. Leave half
 * way and it is here when you come back, and waiting on My games meanwhile.
 *
 * Nothing is hidden in this game, so there is no screen to cover the board
 * between turns: whoever holds the device draws for the name the turn line
 * says, and hands it on — or keeps it, when they have just closed a box. The
 * rules are all in `lib/party/dotsAndBoxes/dotsAndBoxes.ts`; this asks it what
 * a line does, and draws the answer.
 */
export function DotsGame({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptDotsGame();
  const [confirming, setConfirming] = useState(false);

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="dots-game" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="dots-game" data-state="set-up">
        <DotsSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  const onLine = (line: number) => {
    const next = drawLine(game, line);
    if (next !== null) keep(next);
  };

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="dots-game"
      data-state={game.status}
      data-players={game.players.length}
      data-lines={game.lines.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <DotsTurnLine game={game} />
        <DotsBoard game={game} appearance={appearance} onLine={onLine} />
        {game.status === DOTS_STATUS.playing ? <p className="text-xs text-muted">{DOTS_COPY.tap}</p> : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <TableScores game={game} />
        <div className="flex flex-wrap gap-2">
          {game.status === DOTS_STATUS.playing ? null : (
            <button type="button" onClick={() => keep(dotsAgain(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="dots-again">
              {PARTY_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="dots-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="dots-new-yes"
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
              onClick={() => (game.status === DOTS_STATUS.playing ? setConfirming(true) : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="dots-new"
            >
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {DOTS_COPY.about} →
          </Link>
        </p>
      </aside>
      {/*
        "ARE YOU STILL THERE?", as every board a person plays on asks
        (`idleWatch.coverage.test.ts`). There is no clock to stop here and
        nothing to poll, so it only says what is true: the game waits, kept.
      */}
      <AskIfAway watching={game.status === DOTS_STATUS.playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}

/** Who is at the table, in turn order, with the boxes each holds — the one whose turn it is marked. */
function TableScores({ game }: { game: DotsGameState }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="dots-players">
      <h2 className={SECTION_TITLE}>
        Players <span className="font-mincho normal-case tracking-normal">席</span>
      </h2>
      <ol className="flex flex-col gap-1.5">
        {game.players.map((_, seat) => (
          <li
            key={seat}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
              seat === game.toPlay && game.status === DOTS_STATUS.playing ? "bg-rule/60 font-semibold" : ""
            }`}
            data-testid="dots-player"
            data-player={seat}
            data-boxes={game.scores[seat]}
          >
            <MarbleChip player={seat} />
            <span className="min-w-0 flex-1 truncate">{dotsPlayerName(game, seat)}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">{DOTS_COPY.boxes(game.scores[seat])}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        {DOTS_COPY.drawn(game.lines.length, dotsLineCount(game.size))} {PARTY_COPY.kept}
      </p>
    </section>
  );
}
