"use client";

import { useState } from "react";
import { PartySeatColour } from "./PartySeatColour";

import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { tileWords } from "@/lib/party/mexicanTrain/dominoes";
import { TRAIN_PHASES, peopleAt, playTrain, trainAgain, trainMoves, trainPlayerName } from "@/lib/party/mexicanTrain/mexicanTrain";
import type { Domino, TrainGame as TrainGameState, TrainMove } from "@/lib/party/mexicanTrain/mexicanTrain.types";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TableWallpaper } from "./TableWallpaper";
import { resultLine } from "@/components/game/winNews";
import { MarbleChip } from "./MarbleChip";
import { PARTY_COPY, TRAIN_COPY } from "./party.constants";
import type { PartyTableGameProps } from "./party.types";
import { TrainHand } from "./TrainHand";
import { TrainRoundOver, TrainScores } from "./TrainScores";
import { TrainSetUp } from "./TrainSetUp";
import { TrainTable } from "./TrainTable";
import { TrainTurnLine } from "./TrainTurnLine";
import { useKeptTrainGame } from "./trainStore";
import { useTrainComputer } from "./useTrainComputer";
import { PlayingNow } from "@/components/layout/PlayingNow";

/**
 * MEXICAN TRAIN ROUND ONE DEVICE, at /games/mexican-train/pass-and-play.
 *
 * Set up first — the set, who is playing and the house rules — then the game,
 * kept in this browser after every move (`trainStore.ts`) and nowhere else.
 *
 * HANDS ARE SECRET. At a table of one person and computers, that person's
 * hand is always face up under the table, and laid from on their turn. With
 * two or more people, the hand of the player to move waits under a cover
 * naming who to pass the device to, and shows only once they say it is them
 * — for that turn alone: the next turn is covered again, whoever's it is. A
 * reload opens on the cover, never on somebody's tiles. A computer's turn
 * shows no hand at all, and plays itself (`useTrainComputer`).
 */
export function TrainGame({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptTrainGame();
  const [shownTurn, setShownTurn] = useState<number | null>(null);
  const [chosen, setChosen] = useState<Domino | null>(null);
  const [dragging, setDragging] = useState<Domino | null>(null);
  const [confirming, setConfirming] = useState(false);
  useTrainComputer(game, keep);
  // The cover over the table when the last round is scored here (`WinCover`); never on a finished game opened again.
  const moment = useWinMoment(game === undefined || game === null ? "unknown" : game.phase === TRAIN_PHASES.finished ? "ended" : "playing");

  // Not read yet: the server has no browser to ask, so it keeps the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[32rem]" data-testid="train-game" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="train-game" data-state="set-up">
        <TrainSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  const play = (move: TrainMove) => {
    const next = playTrain(game, move);
    if (next === null) return;
    setChosen(null);
    keep(next);
  };
  const people = peopleAt(game);
  const playing = game.phase === TRAIN_PHASES.playing;
  const personToMove = playing && !game.computers[game.toPlay];
  /* Whose hand is face up: the one person's always; at a table of several, the player to move's once they say it is them. */
  const lonePerson = people.length === 1 ? people[0]! : null;
  const uncovered = personToMove && (lonePerson !== null || shownTurn === game.turn);
  const handSeat = lonePerson ?? (uncovered ? game.toPlay : null);
  const active = uncovered && handSeat === game.toPlay;
  const covered = personToMove && !uncovered;
  const moves = active ? trainMoves(game) : [];
  const mustDraw = moves.length === 1 && moves[0]!.kind === "draw";
  const mustPass = moves.length === 1 && moves[0]!.kind === "pass";
  const holding = active ? (dragging ?? chosen) : null;

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the table takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="train-game"
      data-state={game.phase}
      data-turn={game.turn}
      data-to-play={game.toPlay}
      data-covered={covered ? "true" : "false"}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <TrainTurnLine game={game} />
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names: game.players.map((_, seat) => trainPlayerName(game, seat)),
                  winners: game.winners,
                  // One person among computers is "you"; several people at the device are each named.
                  you: lonePerson,
                  next: { label: `${PARTY_COPY.again} →`, onPress: () => keep(trainAgain(game, freshSeed())) },
                })
              : null
          }
          onClose={moment.close}
        >
          <TrainTable game={game} appearance={appearance} holding={holding} onTrain={(train) => holding !== null && play({ kind: "play", tile: holding, train })} />
        </WinCoverOver>
        {game.phase === TRAIN_PHASES.playing ? null : (
          <>
            <TrainRoundOver game={game} onNext={() => play({ kind: "next" })} />
            {game.phase === TRAIN_PHASES.finished ? (
              <button type="button" onClick={() => keep(trainAgain(game, freshSeed()))} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="train-again">
                {PARTY_COPY.again} →
              </button>
            ) : null}
          </>
        )}
        {covered ? <TrainCover game={game} onReveal={() => setShownTurn(game.turn)} /> : null}
        {handSeat === null || !playing ? null : (
          // Beside the table in just the board on a desk, where under it would run past the window's foot (globals.css).
          <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="train-desk" data-bare-beside>
            <TrainHand game={game} seat={handSeat} active={active} chosen={active ? chosen : null} onChoose={setChosen} onLay={(tile, train) => play({ kind: "play", tile, train })} onDragging={setDragging} />
            <p className="min-h-10 text-xs text-muted" data-testid="train-hint">
              {!active ? "" : mustDraw ? TRAIN_COPY.mustDraw : mustPass ? TRAIN_COPY.mustPass(game.drew) : chosen !== null ? TRAIN_COPY.pick(tileWords(chosen)) : TRAIN_COPY.tap}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => play({ kind: "draw" })} disabled={!mustDraw} className={`${BUTTON_BASE} ${mustDraw ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="train-draw">
                {TRAIN_COPY.draw}
              </button>
              <button type="button" onClick={() => play({ kind: "pass" })} disabled={!mustPass} className={`${BUTTON_BASE} ${mustPass ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="train-pass">
                {TRAIN_COPY.passTurn}
              </button>
              {lonePerson === null && active ? (
                <button type="button" onClick={() => setShownTurn(null)} className={`${BUTTON_BASE} ${BUTTON_QUIET} ml-auto`} data-testid="train-hide">
                  {TRAIN_COPY.hide}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`); a computer's seat keeps its table colour. Furniture in just the board. */}
        {personToMove ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={trainPlayerName(game, game.toPlay)} playing={game.players.length} />
          </div>
        ) : null}
        <TrainScores game={game} />
        <div className="flex flex-wrap gap-2">
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="train-confirm-new">
              <span>{PARTY_COPY.confirmNew}</span>
              <button
                type="button"
                onClick={() => {
                  keep(null);
                  setConfirming(false);
                }}
                className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                data-testid="train-new-yes"
              >
                {PARTY_COPY.confirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PARTY_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => (game.phase === TRAIN_PHASES.finished ? keep(null) : setConfirming(true))} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="train-new">
              {PARTY_COPY.newGame}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
        {game.phase === TRAIN_PHASES.finished ? (
          <TableWallpaper game="mexicanTrain" result={resultLine(game.players.map((_, seat) => trainPlayerName(game, seat)), game.winners)} />
        ) : null}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {TRAIN_COPY.about} →
          </Link>
        </p>
      </aside>
      <AskIfAway watching={game.phase !== TRAIN_PHASES.finished} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}

/**
 * THE COVER between two people's turns: who to pass the device to, and the
 * press that shows their tiles once they have it. Nothing of anybody's hand is
 * drawn while it is up.
 */
function TrainCover({ game, onReveal }: { game: TrainGameState; onReveal: () => void }) {
  const name = trainPlayerName(game, game.toPlay);
  return (
    <div className={`${PANEL_CLASS} flex flex-col items-center gap-3 text-center`} data-testid="train-cover" data-seat={game.toPlay}>
      <p className="flex items-center gap-2 text-lg font-semibold">
        <MarbleChip player={game.toPlay} />
        {TRAIN_COPY.pass(name)}
      </p>
      <p className="text-sm text-muted">{TRAIN_COPY.passNote}</p>
      <button type="button" onClick={onReveal} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="train-reveal">
        <PressLabel words={TRAIN_COPY.iAm(name)} kanji="私" />
      </button>
    </div>
  );
}
