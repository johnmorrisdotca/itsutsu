"use client";

import { TableEnding } from "@/components/play/GameEnding";
import { resignYacht } from "@/lib/party/resignTables";
import { useCallback, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { PlayingNow } from "@/components/layout/PlayingNow";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { YACHT_ROLLS } from "@/lib/party/yacht/yacht.constants";
import { YACHT_PHASES, isHeld, playYacht, yachtAgain, yachtPeople, yachtPlayerName } from "@/lib/party/yacht/yacht";
import type { YachtGame, YachtMove } from "@/lib/party/yacht/yacht.types";
import { sheetTotal } from "@/lib/party/yacht/yachtScore";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PARTY_COPY } from "../party.constants";
import { PartySeatColour } from "../PartySeatColour";
import { TableWallpaper } from "../TableWallpaper";
import { DiceTray } from "./DiceTray";
import { useDiceSound } from "./diceSound";
import { useYachtComputer } from "./useYachtComputer";
import { YACHT_COPY } from "./yacht.constants";
import { YachtSheet } from "./YachtSheet";
import { YachtTurnLine } from "./YachtTurnLine";

/** The dice a mask holds, one flag a die. */
const flags = (game: YachtGame, mask: number) => game.dice.map((_, at) => isHeld(mask, at));

/**
 * A GAME OF YACHT UNDER WAY: the turn line, the tray, the Roll button and the
 * sheet, and beside them the table's furniture. Nothing is secret — every die
 * is on the table — so a table of several people simply passes the device;
 * there is no cover between turns.
 *
 * Which dice a person holds is theirs to choose until they roll, and is not
 * kept: the roll that follows keeps them (`hold`), and a reload opens on the
 * dice as the last roll left them, held ones still held.
 */
export function YachtPlay({ game, keep, appearance, gameHref }: { game: YachtGame; keep: (game: YachtGame | null) => void; appearance: Appearance; gameHref: string }) {
  const hydrated = useHydrated();
  const sound = useDiceSound();
  const [choice, setChoice] = useState<{ at: string; mask: number } | null>(null);
  const keepGame = useCallback((next: YachtGame) => keep(next), [keep]);
  useYachtComputer(game, keepGame, sound.play);
  const moment = useWinMoment(game.phase === YACHT_PHASES.finished ? "ended" : "playing");

  const playing = game.phase === YACHT_PHASES.playing;
  const personToMove = playing && !game.computers[game.toPlay];
  const at = `${game.turn}.${game.rolls}`;
  const mask = choice !== null && choice.at === at ? choice.mask : game.held;
  const canRoll = personToMove && game.rolls < YACHT_ROLLS;
  const canHold = personToMove && game.rolls > 0 && game.rolls < YACHT_ROLLS;
  const people = yachtPeople(game);
  const lonePerson = people.length === 1 ? people[0]! : null;
  const names = game.players.map((_, seat) => yachtPlayerName(game, seat));
  // The dice the last roll threw tumble; the ones it held lie still.
  const lastRoll = game.last !== null && game.last.move.kind === "roll" ? game.last.move.hold : null;
  const rolled = game.dice.map((_, die) => lastRoll !== null && !isHeld(lastRoll, die));

  const play = (move: YachtMove) => {
    const next = playYacht(game, move);
    if (next === null) return;
    if (move.kind === "roll") sound.play(rolled.length - flags(game, move.hold).filter(Boolean).length);
    setChoice(null);
    keep(next);
  };
  const roll = () => {
    if (canRoll) play({ kind: "roll", hold: game.rolls === 0 ? 0 : mask });
  };
  const hold = (die: number) => {
    if (canHold) setChoice({ at, mask: mask ^ (1 << die) });
  };
  const again = () => keep(yachtAgain(game, freshSeed()));

  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start"
      data-testid="yacht-game"
      data-state={game.phase}
      data-turn={game.turn}
      data-to-play={game.toPlay}
      data-rolls={game.rolls}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <YachtTurnLine game={game} />
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names,
                  winners: game.winners,
                  you: lonePerson,
                  detail: game.players.length === 1 ? YACHT_COPY.aloneScored(sheetTotal(game.sheets[0])) : null,
                  next: { label: `${PARTY_COPY.again} →`, onPress: again },
                })
              : null
          }
          onClose={moment.close}
        >
          <DiceTray
            dice={game.dice}
            held={flags(game, mask)}
            rolled={rolled}
            rollKey={game.thrown}
            appearance={appearance}
            onDie={canHold ? hold : undefined}
            onTray={canRoll ? roll : undefined}
            label={canRoll ? YACHT_COPY.tapTray : YACHT_COPY.noRolls}
          />
        </WinCoverOver>
        {/* Beside the tray in just the board on a desk, where under it would run past the window's foot (globals.css). */}
        <div className="flex min-w-0 flex-col gap-3" data-bare-beside>
          {playing ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={roll} disabled={!canRoll} className={`${BUTTON_LEAD} ${canRoll ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="yacht-roll">
                {game.rolls === 0 ? YACHT_COPY.rollFirst : YACHT_COPY.roll}
              </button>
              <p className="min-h-10 flex-1 text-xs text-muted" data-testid="yacht-hint">
                {!personToMove ? "" : game.rolls === 0 ? YACHT_COPY.tapTray : `${YACHT_COPY.rollsLeft(YACHT_ROLLS - game.rolls)}. ${YACHT_COPY.tapToHold}`}
              </p>
            </div>
          ) : (
            <button type="button" onClick={again} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="yacht-again">
              {PARTY_COPY.again} →
            </button>
          )}
          <YachtSheet game={game} onBox={personToMove ? (box) => play({ kind: "score", box }) : undefined} />
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`); a computer's seat keeps its table colour. Furniture in just the board. */}
        {personToMove && game.players.length > 1 ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={yachtPlayerName(game, game.toPlay)} playing={game.players.length} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="dice-sound" data-on={sound.on ? "true" : "false"}>
            {sound.on ? YACHT_COPY.soundOn : YACHT_COPY.soundOff}
          </button>
          <TableEnding
            prefix="yacht"
            game={game}
            playing={playing}
            toPlay={game.toPlay}
            seats={game.players.length}
            nameOf={(seat) => yachtPlayerName(game, seat)}
            onResign={(seat) => keep(resignYacht(game, seat))}
            onNewGame={() => keep(null)}
          />
        </div>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
        {playing ? null : <TableWallpaper game="yacht" result={resultLine(names, game.winners)} />}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {YACHT_COPY.about} →
          </Link>
        </p>
      </aside>
      <AskIfAway watching={playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}
