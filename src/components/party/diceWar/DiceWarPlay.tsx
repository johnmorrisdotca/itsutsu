"use client";

import { GameEnding, NewGameButton } from "@/components/play/GameEnding";
import { useCallback } from "react";

import { diceWarWinners, type DiceWarGame } from "@johnmorrisdotca/korokoro";

import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { PlayingNow } from "@/components/layout/PlayingNow";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { diceWarSeatName } from "@/lib/party/diceWar/diceWar.constants";
import { DICE_WAR_RULES } from "@/lib/party/diceWar/diceWarRules";
import { throwDiceWar, waitsOnPerson } from "@/lib/party/diceWar/diceWarThrow";
import { diceWarEnding, diceWarNext, diceWarRoundLine, diceWarSaid } from "@/lib/party/diceWar/diceWarWords";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { useDiceSound } from "../yacht/diceSound";
import { TableWallpaper } from "../TableWallpaper";
import { DICE_WAR_COPY } from "./diceWar.constants";
import { DiceWarBoard } from "./DiceWarBoard";
import { useDiceWarComputer } from "./useDiceWarComputer";

/**
 * A GAME OF DICE WAR UNDER WAY: the round and what the last throw did, the
 * table of throws, and one Roll button for every person at the table. Nothing
 * is secret — every die is on the table — so people at one device simply take
 * turns pressing it, and there is no cover between throws. A computer rolls
 * for itself with the person's press, and a war left to computers alone is
 * thrown for them after a pause (`useDiceWarComputer`).
 */
export function DiceWarPlay({ game, keep, gameHref }: { game: DiceWarGame; keep: (game: DiceWarGame | null) => void; gameHref: string }) {
  const hydrated = useHydrated();
  const sound = useDiceSound();
  const keepGame = useCallback((next: DiceWarGame) => keep(next), [keep]);
  useDiceWarComputer(game, keepGame, sound.play);

  const over = game.phase === "over";
  const moment = useWinMoment(over ? "ended" : "playing");
  const names = game.players.map((_, seat) => diceWarSeatName(game.players, game.computers, seat));
  const name = (seat: number) => names[seat] ?? `Player ${seat + 1}`;
  const winners = over ? diceWarWinners(game) : [];
  const people = game.computers.map((computer, seat) => (computer ? -1 : seat)).filter((seat) => seat >= 0);
  const canRoll = !over && waitsOnPerson(game);

  const roll = () => {
    if (!canRoll) return;
    const next = throwDiceWar(game);
    if (next === null) return;
    sound.play(game.rollers.length * game.dice);
    keep(next);
  };
  const again = () => {
    const fresh = DICE_WAR_RULES.startWith({ players: game.players, computers: game.computers, dice: game.dice, sides: game.sides, goal: game.goal, to: game.to, seed: String(freshSeed()) });
    if (fresh !== null) keep(fresh);
  };
  const said = diceWarSaid(game, name);
  const next = canRoll ? DICE_WAR_COPY.yourTurn : over ? "" : DICE_WAR_COPY.thinking;

  return (
    <section
      className="mx-auto flex w-full max-w-2xl flex-col gap-3"
      data-testid="dicewar-game"
      data-state={over ? "finished" : "playing"}
      data-throws={game.throws.length}
      data-round={game.round}
      data-war={game.wars}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board data-testid="dicewar-board">
        <div className="flex min-h-[4.5rem] flex-col gap-0.5" aria-live="polite">
          <p className="text-base font-semibold" data-testid="dicewar-status">
            {over ? <ResultMark kind={winners.length === 0 ? RESULT_MARKS.other : RESULT_MARKS.success} className="mr-1.5" /> : null}
            {over ? `${DICE_WAR_COPY.over}: ${diceWarEnding(game, winners, name)}` : diceWarRoundLine(game)}
            {!over && game.wars > 0 ? <span className="ml-2 text-shu" data-testid="dicewar-stake">{DICE_WAR_COPY.war}: {DICE_WAR_COPY.stake(game.stake)}</span> : null}
          </p>
          <p className="text-sm text-muted" data-testid="dicewar-said">
            {said}
          </p>
          <p className="text-sm" data-testid="dicewar-next">
            {over ? "" : diceWarNext(game, name)} {next}
          </p>
        </div>
        {/* Above the rows, not under them: with eight players the rows run past a phone's window, and the press is the one thing a turn asks. */}
        <div className="flex flex-wrap items-center gap-3" data-bare-beside>
          {over ? (
            <button type="button" onClick={again} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="dicewar-again">
              {DICE_WAR_COPY.again} →
            </button>
          ) : (
            <button type="button" onClick={roll} disabled={!canRoll} className={`${BUTTON_LEAD} ${canRoll ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="dicewar-roll">
              {canRoll ? DICE_WAR_COPY.rollDice : DICE_WAR_COPY.rolling}
            </button>
          )}
        </div>
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names,
                  winners,
                  // One person among computers is "you"; several people round the device are each named.
                  you: people.length === 1 ? people[0] : null,
                  detail: diceWarEnding(game, winners, name),
                  next: { label: `${DICE_WAR_COPY.again} →`, onPress: again },
                })
              : null
          }
          onClose={moment.close}
        >
          <DiceWarBoard game={game} />
        </WinCoverOver>
      </div>

      <div className="flex flex-wrap items-center gap-2" data-chrome>
        <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="dice-sound" data-on={sound.on ? "true" : "false"}>
          {sound.on ? DICE_WAR_COPY.soundOn : DICE_WAR_COPY.soundOff}
        </button>
        <GameEnding>
          <NewGameButton going={!over} onNewGame={() => keep(null)} testId="dicewar-new" />
        </GameEnding>
      </div>
      <p className="text-xs text-muted">{DICE_WAR_COPY.kept}</p>
      {over ? <TableWallpaper game="diceWar" result={resultLine(names, winners)} /> : null}
      <p className="text-sm">
        <Link href={gameHref} className="underline underline-offset-4">
          {DICE_WAR_COPY.about} →
        </Link>
      </p>
      <AskIfAway watching={!over} detail={DICE_WAR_COPY.idleDetail} kept={DICE_WAR_COPY.idleKept} />
    </section>
  );
}
