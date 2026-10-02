"use client";

import { TableEnding } from "@/components/play/GameEnding";
import { resignTenka } from "@/lib/party/resignTables";
import { useRef, useState } from "react";
import { tenkaPlayerName } from "@/lib/party/tenka/tenkaTurn";
import { PartySeatColour } from "../PartySeatColour";

import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { TableWallpaper } from "../TableWallpaper";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { TENKA_MOVES, TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import type { TenkaGame, TenkaMove } from "@/lib/party/tenka/tenka.types";
import { playTenka } from "@/lib/party/tenka/tenka";
import { tenkaAgain } from "@/lib/party/tenka/tenkaStart";

import { PARTY_COPY } from "../party.constants";
import { TENKA_COPY } from "./tenka.constants";
import { TenkaBar } from "./TenkaBar";
import { TenkaDice } from "./TenkaDice";
import { TenkaHand } from "./TenkaHand";
import { TenkaMap } from "./TenkaMap";
import { TenkaPlayers } from "./TenkaPlayers";
import { TenkaTurnLine } from "./TenkaTurnLine";
import type { TenkaMapHandle } from "./tenka.types";
import { NO_CHOICE, choiceNow, marksFor, tapTerritory } from "./tenkaTaps";
import { freshTenkaSeed } from "./tenkaStore";
import { PlayingNow } from "@/components/layout/PlayingNow";

/**
 * What must stay on the screen under the map at Large and Full, in pixels: the
 * row of places to look at, and the phase bar at its tallest step (a throw's
 * buttons, or the stepper and Move in) with the dice beside it. Declared rather
 * than measured (`data-scale-below`), because the bar changes height from step
 * to step and the size is worked out once. Here rather than in
 * `tenka.constants.ts`, whose every change asks for the party pictures again
 * (`partyArtFingerprint.ts`), since it draws nothing.
 */
const TENKA_BELOW_PX = 200;

/** Whose turn the device was last handed for: the round and the seat. */
const turnKey = (game: TenkaGame) => `${game.round}:${game.toPlay}`;

/**
 * A GAME OF TENKA BEING PLAYED: the map with the turn over it, the phase bar
 * and the dice under it, and under those the hand and the table.
 *
 * A WIDE BOARD (`data-scale-wide`). John, 2026-09-29, at Tenka on a desk:
 * "some games on desktop should have full width/height option. where once
 * play starts the map/board can be wider/bigger." A map of the world is twice
 * as wide as it is tall, so a column beside it takes the width the map needs
 * and gives it nothing it could use. So on a desk nothing sits beside the
 * map: it is as wide as the page at Regular, and past the page at Large and
 * Full (`BoardScale`); what is read at a glance — whose turn, the step of the
 * turn, the dice — is on the lines just above and below it, and the hand and
 * the players are a row of three under those. On a phone it is the column it
 * always was. In just the board the modal is as wide as the map, which is as
 * large as the window's height allows (globals.css).
 *
 * Everything a move does is the rules' (`playTenka`): this keeps what the
 * player has chosen on the map (`tenkaTaps.ts`), hands the rules the move,
 * and keeps the game after every one (`tenkaStore.ts`). Between turns it asks
 * for the device to be passed on by name, and shows nobody's cards until the
 * player named says they have it; the set-up placing, where nothing is
 * hidden, goes round without asking.
 */
export function TenkaPlay({ game, keep, appearance, gameHref, ready }: { game: TenkaGame; keep: (game: TenkaGame | null) => void; appearance: Appearance; gameHref: string; ready: { "data-ready": string } }) {
  const [choice, setChoice] = useState(NO_CHOICE);
  const [handedFor, setHandedFor] = useState<string | null>(null);
  const map = useRef<TenkaMapHandle>(null);
  // The cover over the map when the world is taken here (`WinCover`); never on a finished game opened again.
  const moment = useWinMoment(game.phase === TENKA_PHASES.over ? "ended" : "playing");
  const handed = game.phase === TENKA_PHASES.setUp || game.phase === TENKA_PHASES.over || handedFor === turnKey(game);

  /** The moves, one after another, kept once at the end; nothing if the rules refuse any. */
  const act = (moves: TenkaMove | readonly TenkaMove[]) => {
    let next: TenkaGame | null = game;
    for (const move of Array.isArray(moves) ? moves : [moves as TenkaMove]) {
      next = next === null ? null : playTenka(next, move);
    }
    if (next === null) return;
    const last = Array.isArray(moves) ? moves.at(-1) : moves;
    // Moved in: attack on from the territory just taken.
    if (last?.kind === TENKA_MOVES.occupy && game.occupying !== null) setChoice({ ...NO_CHOICE, from: game.occupying.to });
    // Took it: how many move in starts at all but one.
    else if (next.phase === TENKA_PHASES.occupy) setChoice({ ...NO_CHOICE, armies: next.armies[next.occupying!.from] - 1 });
    else if (next.toPlay !== game.toPlay || next.phase !== game.phase) setChoice(next.phase === TENKA_PHASES.attack ? choiceNow(next, choice) : NO_CHOICE);
    keep(next);
  };

  const onTerritory = (territory: number) => {
    if (!handed) return;
    const tapped = tapTerritory(game, choice, territory);
    setChoice(tapped.choice);
    // Where an attack or a move comes from, newly chosen: on a phone, look at it and what it can reach.
    const from = tapped.choice.from;
    if (from !== null && from !== choiceNow(game, choice).from) map.current?.frameAround([from, ...marksFor(game, tapped.choice).reach]);
    if (tapped.move !== null) act(tapped.move);
  };

  const playing = game.phase !== TENKA_PHASES.over;
  return (
    <section
      className="flex flex-col gap-4"
      data-testid="tenka-game"
      data-state={playing ? "playing" : "finished"}
      data-phase={game.phase}
      data-players={game.players.length}
      data-moves={game.moves.length}
      data-to-play={game.toPlay}
      data-handed={handed ? "true" : "false"}
      {...ready}
    >
      {/*
        The board's column (`data-scale-board`, grown at Large and Full), wide (`data-scale-wide`), and what just the board
        keeps (`data-bare-board`). What must stay in reach under the map is declared, not measured: the phase bar is as tall
        as its step, and the size is worked out once, not on every step (`TENKA_BELOW_PX`).
      */}
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-scale-wide data-bare-board data-scale-below={TENKA_BELOW_PX}>
        <TenkaTurnLine
          game={game}
          colour={
            playing ? (
              // The colour of whoever is to play, on their turn, as a small control beside whose turn it is; furniture in just the board.
              <div data-chrome>
                <PartySeatColour seat={game.toPlay} name={tenkaPlayerName(game, game.toPlay)} playing={game.players.length} align="end" />
              </div>
            ) : null
          }
        />
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names: game.players.map((_, seat) => tenkaPlayerName(game, seat)),
                  winners: game.winners,
                  you: null,
                  next: { label: PARTY_COPY.again, onPress: () => keep(tenkaAgain(game, freshTenkaSeed())) },
                })
              : null
          }
          onClose={moment.close}
        >
          <TenkaMap game={game} appearance={appearance} marks={marksFor(game, choice)} onTerritory={playing ? onTerritory : undefined} handle={map} />
        </WinCoverOver>
        {/* The phase bar and, beside it on a desk, the dice; on a phone (and in just the board) the bar carries them. */}
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start" data-bare-column>
          <TenkaBar
            game={game}
            choice={choice}
            onMove={act}
            onArmies={(armies) => setChoice({ ...choiceNow(game, choice), armies })}
            handed={handed}
            onReady={() => setHandedFor(turnKey(game))}
          />
          <div className={`hidden lg:block ${playing ? "" : "lg:col-span-2"}`} data-chrome>
            <TenkaDice game={game} />
          </div>
        </div>
      </div>

      <aside className="grid min-w-0 gap-3 lg:grid-cols-3 lg:items-start">
        <TenkaHand game={game} handed={handed} onMove={act} />
        <TenkaPlayers game={game} />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {playing ? null : (
              <button type="button" onClick={() => keep(tenkaAgain(game, freshTenkaSeed()))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="tenka-again">
                {PARTY_COPY.again}
              </button>
            )}
            <TableEnding
              prefix="tenka"
              game={game}
              playing={playing}
              toPlay={game.toPlay}
              seats={game.players.length}
              nameOf={(seat) => tenkaPlayerName(game, seat)}
              onResign={(seat) => keep(resignTenka(game, seat))}
              onNewGame={() => keep(null)}
            />
          </div>
          {playing ? null : <TableWallpaper game="tenka" result={resultLine(game.players.map((_, seat) => tenkaPlayerName(game, seat)), game.winners)} />}
          <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
          <p className="text-sm">
            <Link href={gameHref} className="underline underline-offset-4">
              {TENKA_COPY.about} →
            </Link>
          </p>
        </div>
      </aside>
      {/*
        "ARE YOU STILL THERE?", as every board a person plays on asks
        (`idleWatch.coverage.test.ts`). There is no clock to stop here and
        nothing to poll, so it only says what is true: the game waits, kept.
      */}
      <AskIfAway watching={playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}
