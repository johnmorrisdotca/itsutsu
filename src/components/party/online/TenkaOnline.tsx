"use client";

import { useRef, useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { TENKA_MOVES, TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import type { TenkaGame, TenkaMove } from "@/lib/party/tenka/tenka.types";
import { playTenka } from "@/lib/party/tenka/tenka";
import { writeTenkaMove } from "@/lib/party/tenka/tenkaKeep";
import { territoriesHeld } from "@/lib/party/tenka/tenkaTurn";

import { TenkaBar } from "../tenka/TenkaBar";
import { TenkaDice } from "../tenka/TenkaDice";
import { TenkaHand } from "../tenka/TenkaHand";
import { TenkaMap } from "../tenka/TenkaMap";
import { TenkaPlayers } from "../tenka/TenkaPlayers";
import { TenkaTurnLine } from "../tenka/TenkaTurnLine";
import type { TenkaChoice, TenkaMapHandle } from "../tenka/tenka.types";
import { NO_CHOICE, choiceNow, marksFor, tapTerritory } from "../tenka/tenkaTaps";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineBoardProps } from "./online.types";

/** A press as it is sent: the short lists a game is kept as (`writeTenkaMove`), which the table's rules read back. */
type SentPress = readonly (string | number)[][];

/**
 * TENKA AT A TABLE ON SEVERAL DEVICES: the map, the turn line, the phase bar
 * and the dice the table on one device draws, with the reader's own cards
 * under them. The map answers a tap and the bar is drawn only on the reader's
 * own turn; between turns the map is looked at, the dice and the players read.
 *
 * What the reader has chosen on the map (`tenkaTaps.ts`) stays on this device
 * until it is a move. A press is played here first by the same rules
 * (`playTenka`) only to know what to choose next — the territory just taken
 * to attack on from, how many to move in — and is then sent; the game drawn is
 * always the table's answer. A choice is kept for the game it was made on, so
 * a move arriving from elsewhere never leaves a stale one lit.
 *
 * The cards: everybody's own, face up, and only a count of anybody else's
 * (`TenkaPlayers`), as a hand held at a real table is.
 */
export function TenkaOnline({ game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<TenkaGame, SentPress>) {
  const [held, setHeld] = useState<{ at: number; choice: TenkaChoice }>({
    at: -1,
    choice: NO_CHOICE,
  });
  const map = useRef<TenkaMapHandle>(null);
  const choice = held.at === game.moves.length ? held.choice : NO_CHOICE;
  const setChoice = (next: TenkaChoice, at = game.moves.length) => setHeld({ at, choice: next });
  const playing = game.phase !== TENKA_PHASES.over;
  const mine = canMove && playing;

  const act = (moves: TenkaMove | readonly TenkaMove[], base: TenkaChoice = choice) => {
    if (!mine) return;
    const list = Array.isArray(moves) ? (moves as readonly TenkaMove[]) : [moves as TenkaMove];
    let next: TenkaGame | null = game;
    for (const move of list) next = next === null ? null : playTenka(next, move);
    if (next === null) return;
    const last = list.at(-1);
    // Moved in: attack on from the territory just taken. Took it: how many move in starts at all but one.
    if (last?.kind === TENKA_MOVES.occupy && game.occupying !== null) setChoice({ ...NO_CHOICE, from: game.occupying.to }, next.moves.length);
    else if (next.phase === TENKA_PHASES.occupy) setChoice({ ...NO_CHOICE, armies: next.armies[next.occupying!.from] - 1 }, next.moves.length);
    else if (next.toPlay === game.toPlay && next.phase === game.phase) setChoice(base, next.moves.length);
    else setChoice(next.phase === TENKA_PHASES.attack ? choiceNow(next, base) : NO_CHOICE, next.moves.length);
    onMove(list.map(writeTenkaMove));
  };

  const onTerritory = (territory: number) => {
    if (!mine) return;
    const tapped = tapTerritory(game, choice, territory);
    setChoice(tapped.choice);
    // Where an attack or a move comes from, newly chosen: on a phone, look at it and what it can reach.
    const from = tapped.choice.from;
    if (from !== null && from !== choiceNow(game, choice).from) map.current?.frameAround([from, ...marksFor(game, tapped.choice).reach]);
    if (tapped.move !== null) act(tapped.move, tapped.choice);
  };

  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      data-testid="tenka-game"
      data-state={playing ? "playing" : "finished"}
      data-phase={game.phase}
      data-players={game.players.length}
      data-moves={game.moves.length}
      data-to-play={game.toPlay}
      data-handed={mine ? "true" : "false"}
    >
      <TenkaTurnLine game={game} />
      <TenkaMap game={game} appearance={appearance} marks={marksFor(game, mine ? choice : NO_CHOICE)} onTerritory={mine ? onTerritory : undefined} handle={map} />
      {mine ? (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start" data-bare-column>
          <TenkaBar game={game} choice={choice} onMove={(moves) => act(moves)} onArmies={(armies) => setChoice({ ...choiceNow(game, choice), armies })} handed onReady={() => undefined} />
          <div className="hidden lg:block" data-chrome>
            <TenkaDice game={game} />
          </div>
        </div>
      ) : (
        // Not the reader's turn: the last throw, whoever threw it, on every size of screen.
        <TenkaDice game={game} />
      )}
      <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:items-start" data-chrome>
        <TenkaHand game={game} handed seat={mySeat} mayTrade={mine} onMove={(move) => act(move)} />
        <TenkaPlayers game={game} />
      </div>
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={mine} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Tenka: the territories it holds, or that it is out. */
export function tenkaStanding(game: TenkaGame, seat: number): string {
  if (game.out[seat]) return "Out";
  const held = territoriesHeld(game.owners, seat);
  return `${held} ${held === 1 ? "territory" : "territories"}`;
}
