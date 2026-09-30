"use client";

import { useCallback, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { PlayingNow } from "@/components/layout/PlayingNow";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { pachisiAgain, pachisiMoves, pachisiPlayerName, pawnsHome, playPachisi } from "@/lib/party/pachisi/pachisi";
import type { PachisiGame, PachisiMove } from "@/lib/party/pachisi/pachisi.types";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MarbleChip } from "../MarbleChip";
import { PARTY_COPY } from "../party.constants";
import { PartySeatColour } from "../PartySeatColour";
import { TableWallpaper } from "../TableWallpaper";
import { useDiceSound } from "../yacht/diceSound";
import { YACHT_COPY } from "../yacht/yacht.constants";
import { PachisiBoard } from "./PachisiBoard";
import { PachisiDice } from "./PachisiDice";
import { PACHISI_COPY } from "./pachisi.constants";
import { PachisiTurnLine } from "./PachisiTurnLine";
import { usePachisiComputer } from "./usePachisiComputer";

/** What a person may spend next: one of the values waiting, by its place in `pending`, or both dice together to enter. */
type Pick = number | "enter";

/** Which of this throw's two dice are spent: those whose value is no longer waiting. */
function diceUsed(game: PachisiGame): boolean[] {
  if (game.phase !== "move") return [false, false];
  const waiting = [...game.pending];
  return game.dice.map((value) => {
    const at = waiting.indexOf(value);
    if (at < 0) return true;
    waiting.splice(at, 1);
    return false;
  });
}

/**
 * A GAME OF PACHISI UNDER WAY: the turn line, the board, the dice and the
 * values waiting to be used, and beside them the table's furniture. Nothing
 * is secret — every pawn is on the board — so a table of several people
 * simply passes the device.
 *
 * A throw is two values to spend, and each may move a different pawn: the
 * person chooses a value (the first that can be used is chosen for them),
 * then taps a ringed pawn. Which value is chosen is theirs until they move,
 * and is not kept.
 */
export function PachisiPlay({ game, keep, appearance, gameHref }: { game: PachisiGame; keep: (game: PachisiGame | null) => void; appearance: Appearance; gameHref: string }) {
  const hydrated = useHydrated();
  const sound = useDiceSound();
  const [choice, setChoice] = useState<{ at: number; pick: Pick } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const keepGame = useCallback((next: PachisiGame) => keep(next), [keep]);
  const rolled = useCallback(() => sound.play(2), [sound]);
  usePachisiComputer(game, keepGame, rolled);
  const moment = useWinMoment(game.phase === "finished" ? "ended" : "playing");

  const playing = game.phase !== "finished";
  const personToMove = playing && !game.computers[game.toPlay];
  const offered = personToMove ? pachisiMoves(game) : [];
  const usable = game.pending.map((_, use) => offered.some((move) => move.kind === "move" && move.use === use));
  const enterable = offered.find((move) => move.kind === "enter");
  const first: Pick | null = usable.indexOf(true) >= 0 ? usable.indexOf(true) : enterable !== undefined ? "enter" : null;
  const chosen = choice !== null && choice.at === game.moves.length ? choice.pick : first;
  const movable = offered.filter((move) => (chosen === "enter" ? move.kind === "enter" : move.kind === "move" && move.use === chosen)).flatMap((move) => (move.kind === "roll" ? [] : [move.pawn]));
  const people = game.computers.flatMap((computer, seat) => (computer ? [] : [seat]));
  const names = game.players.map((_, seat) => pachisiPlayerName(game, seat));
  const canRoll = personToMove && game.phase === "roll";
  // The dice not yet spent come first in `pending`; what follows them is a bonus.
  const diceLeft = diceUsed(game).filter((used) => !used).length;

  const play = (move: PachisiMove) => {
    const next = playPachisi(game, move);
    if (next === null) return;
    if (move.kind === "roll") sound.play(2);
    setChoice(null);
    keep(next);
  };
  const onPawn = (pawn: number) => {
    if (chosen === "enter") play({ kind: "enter", pawn });
    else if (chosen !== null) play({ kind: "move", pawn, use: chosen });
  };
  const again = () => keep(pachisiAgain(game, freshSeed()));
  const pickClass = (on: boolean) => `${BUTTON_BASE} ${on ? BUTTON_STRONG : BUTTON_QUIET} tabular-nums`;

  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start"
      data-testid="pachisi-game"
      data-state={game.phase}
      data-turn={game.turn}
      data-to-play={game.toPlay}
      data-moves={game.moves.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <PachisiTurnLine game={game} />
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={moment.open ? tableNews({ names, winners: game.winners, you: people.length === 1 ? people[0]! : null, next: { label: `${PARTY_COPY.again} →`, onPress: again } }) : null}
          onClose={moment.close}
        >
          <PachisiBoard game={game} appearance={appearance} movable={movable} onPawn={personToMove && game.phase === "move" ? onPawn : undefined} />
        </WinCoverOver>
        {/* Beside the board in just the board on a desk, where under it would run past the window's foot (globals.css). */}
        <div className="flex min-w-0 flex-col gap-3" data-bare-beside>
          <div className="flex flex-wrap items-center gap-3">
            <PachisiDice dice={game.dice} used={diceUsed(game)} thrown={game.thrown} />
            {playing ? (
              <button type="button" onClick={() => canRoll && play({ kind: "roll" })} disabled={!canRoll} className={`${BUTTON_LEAD} ${canRoll ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="pachisi-roll">
                {PACHISI_COPY.roll}
              </button>
            ) : (
              <button type="button" onClick={again} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="pachisi-again">
                {PARTY_COPY.again} →
              </button>
            )}
          </div>
          {personToMove && game.phase === "move" ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Values to move by">
                {game.pending.map((value, use) =>
                  usable[use] ? (
                    <button key={use} type="button" onClick={() => setChoice({ at: game.moves.length, pick: use })} aria-pressed={chosen === use} className={pickClass(chosen === use)} data-testid="pachisi-value" data-value={value} data-use={use}>
                      {use >= diceLeft ? PACHISI_COPY.bonus(value) : value}
                    </button>
                  ) : null,
                )}
                {enterable !== undefined ? (
                  <button type="button" onClick={() => setChoice({ at: game.moves.length, pick: "enter" })} aria-pressed={chosen === "enter"} className={pickClass(chosen === "enter")} data-testid="pachisi-value" data-value="enter">
                    {PACHISI_COPY.both(game.dice[0] + game.dice[1])}
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-muted" data-testid="pachisi-hint" data-pachisi-hint>
                {PACHISI_COPY.choose}
              </p>
            </div>
          ) : null}
          <ul className="flex flex-col gap-1 text-sm" data-testid="pachisi-home-counts">
            {game.players.map((_, seat) => (
              <li key={seat} className="flex items-center gap-2" data-testid="pachisi-home-count" data-seat={seat} data-home={pawnsHome(game, seat)}>
                <MarbleChip player={seat} />
                <span className="min-w-0 truncate">{names[seat]}</span>
                <span className="ml-auto text-muted tabular-nums">{PACHISI_COPY.home4(pawnsHome(game, seat))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`). Furniture in just the board. */}
        {personToMove ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={pachisiPlayerName(game, game.toPlay)} playing={game.players.length} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="dice-sound" data-on={sound.on ? "true" : "false"}>
            {sound.on ? YACHT_COPY.soundOn : YACHT_COPY.soundOff}
          </button>
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="pachisi-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="pachisi-new-yes"
              >
                {PARTY_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PARTY_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => (playing ? setConfirming(true) : keep(null))} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="pachisi-new">
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
        {playing ? null : <TableWallpaper game="pachisi" result={resultLine(names, game.winners)} />}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {PACHISI_COPY.about} →
          </Link>
        </p>
      </aside>
      <AskIfAway watching={playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}
