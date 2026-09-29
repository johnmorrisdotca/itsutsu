"use client";

import { useRef, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
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

/** Whose turn the device was last handed for: the round and the seat. */
const turnKey = (game: TenkaGame) => `${game.round}:${game.toPlay}`;

/**
 * A GAME OF TENKA BEING PLAYED: the map with the turn over it, the phase bar
 * under it, and beside them (under them on a phone) the dice, the hand and
 * the table.
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
  const [confirming, setConfirming] = useState(false);
  const map = useRef<TenkaMapHandle>(null);
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
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      data-testid="tenka-game"
      data-state={playing ? "playing" : "finished"}
      data-phase={game.phase}
      data-players={game.players.length}
      data-moves={game.moves.length}
      data-to-play={game.toPlay}
      data-handed={handed ? "true" : "false"}
      {...ready}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <TenkaTurnLine game={game} />
        <TenkaMap game={game} appearance={appearance} marks={marksFor(game, choice)} onTerritory={playing ? onTerritory : undefined} handle={map} />
        <TenkaBar
          game={game}
          choice={choice}
          onMove={act}
          onArmies={(armies) => setChoice({ ...choiceNow(game, choice), armies })}
          handed={handed}
          onReady={() => setHandedFor(turnKey(game))}
        />
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        {/* On a phone the phase bar carries the dice, where the thumb and the eye already are. */}
        <div className="hidden lg:contents">
          <TenkaDice game={game} />
        </div>
        <TenkaHand game={game} handed={handed} onMove={act} />
        <TenkaPlayers game={game} />
        <div className="flex flex-wrap gap-2">
          {playing ? null : (
            <button type="button" onClick={() => keep(tenkaAgain(game, freshTenkaSeed()))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="tenka-again">
              {PARTY_COPY.again}
            </button>
          )}
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="tenka-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="tenka-new-yes"
              >
                {PARTY_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PARTY_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => (playing ? setConfirming(true) : keep(null))} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="tenka-new">
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {TENKA_COPY.about} →
          </Link>
        </p>
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
