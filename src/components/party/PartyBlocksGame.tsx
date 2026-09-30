"use client";

import { useState } from "react";
import { partyPlayerName } from "@/lib/gomoku/party/partyRace";
import { PartySeatColour } from "./PartySeatColour";

import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { BLOCKS_STATUS, againBlocksParty, blocksLeaders, layBlocks } from "@/lib/gomoku/party/partyBlocks";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TableWallpaper } from "./TableWallpaper";
import { resultLine } from "@/components/game/winNews";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { PartyBlocksBoard } from "./PartyBlocksBoard";
import { PartyBlocksSetUp } from "./PartyBlocksSetUp";
import { PartyBlocksPlayers, PartyBlocksTurnLine } from "./PartyBlocksStatus";
import { PartyBlocksTray } from "./PartyBlocksTray";
import type { PartyTableGameProps } from "./party.types";
import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";
import { useKeptBlocksParty } from "./partyBlocksStore";
import { useBlocksHand } from "./useBlocksHand";
import { PlayingNow } from "@/components/layout/PlayingNow";

/**
 * BLOCK FIVE FOR FOUR, PASSED ROUND THE TABLE.
 *
 * Nothing is hidden in this game, so whoever holds the device plays the
 * colour the turn line names and hands it on. The player chooses a piece from
 * their tray, turns or flips it (the buttons, or R and F as on Block Five's
 * own board), and taps the board: the piece is shown where it would lie —
 * slid over the tapped square to the first place the rules allow, or ringed
 * red with the reason when there is none — and a second tap on it lays it.
 * A mouse shows it under the pointer, so one click lays it.
 *
 * Every rule is asked of `lib/gomoku/party/partyBlocks.ts`; nothing here reads
 * the board to decide anything. The game is kept in this browser after every
 * piece (`partyBlocksStore.ts`), and nowhere else.
 */
export function PartyBlocksGame({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptBlocksParty();
  const [confirming, setConfirming] = useState(false);
  const hand = useBlocksHand(game ?? null, true, (piece, cells) => {
    const next = game === undefined || game === null ? null : layBlocks(game, piece, cells);
    if (next !== null) keep(next);
  });
  const { playing, hold, preview } = hand;
  // The cover over the board, when the last piece is laid here (`WinCover`); never on a finished table opened again.
  const moment = useWinMoment(game === undefined || game === null ? "unknown" : game.status === BLOCKS_STATUS.over ? "ended" : "playing");

  // Not read yet: the server has no browser to ask, so it keeps the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="party-blocks" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="party-blocks" data-state="set-up">
        <PartyBlocksSetUp appearance={appearance} onStart={(started) => keep(started)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="party-blocks"
      data-state={game.status}
      data-moves={game.moves.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <PartyBlocksTurnLine game={game} />
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names: game.players.map((_, player) => partyPlayerName(game.players, player)),
                  winners: blocksLeaders(game),
                  you: null,
                  next: { label: PARTY_BLOCKS_COPY.again, onPress: () => keep(againBlocksParty(game)) },
                })
              : null
          }
          onClose={moment.close}
        >
          <PartyBlocksBoard
            game={game}
            appearance={appearance}
            preview={preview}
            starts={hand.starts}
            onSquare={hand.onSquare}
            onAim={hand.onAim}
          />
        </WinCoverOver>
      </div>

      {/* In just the board the tray stays, being how a shape is laid; who is at the table and the new game go (`data-chrome`). */}
      <aside className="flex min-w-0 flex-col gap-4" data-bare-keep>
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`); furniture in just the board. */}
        {playing ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={partyPlayerName(game.players, game.toPlay)} playing={game.players.length} />
          </div>
        ) : null}
        {playing && hold !== null ? (
          <PartyBlocksTray
            game={game}
            hold={hold}
            onHold={hand.onHold}
            onRotate={hand.onRotate}
            onFlip={hand.onFlip}
            refusal={preview?.refusal == null ? null : PARTY_BLOCKS_COPY.refusals[preview.refusal]}
          />
        ) : null}
        <div data-chrome>
          <PartyBlocksPlayers game={game} />
        </div>
        <div className="flex flex-wrap gap-2" data-chrome>
          {playing ? null : (
            <button type="button" onClick={() => keep(againBlocksParty(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="blocks-again">
              {PARTY_BLOCKS_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="blocks-confirm-new">
              <span>{PARTY_BLOCKS_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="blocks-new-yes"
              >
                {PARTY_BLOCKS_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PARTY_BLOCKS_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (playing ? setConfirming(true) : keep(null))}
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              data-testid="blocks-new"
            >
              {PARTY_BLOCKS_COPY.newGame}
            </button>
          )}
        </div>
        {playing ? null : (
          <TableWallpaper game={RULE_VARIANTS.blockFive} result={resultLine(game.players.map((_, player) => partyPlayerName(game.players, player)), blocksLeaders(game))} />
        )}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {PARTY_BLOCKS_COPY.about} →
          </Link>
        </p>
      </aside>
      {/* "ARE YOU STILL THERE?", as every board a person plays on asks: nothing is timed here, so the game simply waits, kept. */}
      <AskIfAway watching={playing} detail={PARTY_BLOCKS_COPY.idleDetail} kept={PARTY_BLOCKS_COPY.idleKept} />
    </section>
  );
}
