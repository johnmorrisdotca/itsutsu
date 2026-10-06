"use client";

import { GameEnding, NewGameButton } from "@/components/play/GameEnding";
import { useCallback } from "react";

import type { Appearance } from "@/components/board/board.types";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE } from "@/components/ui/ui.constants";
import type { SugorokuMove, SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { playSugoroku, startSugoroku, sugorokuOver, sugorokuWinners } from "@/lib/party/sugoroku/sugorokuTable";
import { sugorokuEnding, sugorokuNames } from "@/lib/party/sugoroku/sugorokuWords";
import { freshSeed } from "@/lib/puzzles/random";

import { TableWallpaper } from "../TableWallpaper";
import { useDiceSound } from "../yacht/diceSound";
import { SugorokuStage } from "./SugorokuStage";
import { useSugorokuComputer } from "./useSugorokuComputer";
import { sugorokuScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A MATCH OF ONE OF THE SEVEN ROUND ONE DEVICE, with the computer in either
 * seat if the set-up put it there: the board lies across on a desk with
 * nothing beside it (a wide board, `data-scale-wide`) and stands up on a phone,
 * and the presses sit under it (`SugorokuStage`, which the table on two devices
 * draws too). Kept in this browser after every move, so the game is here when
 * the page is left and come back to.
 *
 * TWO PEOPLE ROUND ONE DEVICE need no cover between turns: nothing is hidden,
 * the whole board is on the table, so the device is simply passed, and the
 * board keeps white at the bottom whoever is to play.
 */
export function SugorokuPlay({ table, keep, appearance, gameHref, ready }: { table: SugorokuTable; keep: (table: SugorokuTable | null) => void; appearance: Appearance; gameHref: string; ready: { "data-ready": string } }) {
  const say = useSpeaker();
  const SUGOROKU_COPY = sugorokuScreenWords(say.locale);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const sound = useDiceSound();
  const throwDice = useCallback(() => sound.play(2), [sound]);
  const advance = useCallback((next: SugorokuTable) => keep(next), [keep]);
  const thinking = useSugorokuComputer(table, advance, say, throwDice);
  const over = sugorokuOver(table);
  const moment = useWinMoment(over ? "ended" : "playing");
  const names = sugorokuNames(table, say);
  const winners = over ? sugorokuWinners(table) : [];
  const people = table.computers.map((computer, seat) => (computer ? -1 : seat)).filter((seat) => seat >= 0);
  // The seat the reader sits in when exactly one person plays: their home board is at the bottom, and "you" is theirs.
  const alone = people.length === 1 ? people[0]! : null;

  const send = (move: SugorokuMove) => {
    const next = playSugoroku(table, move);
    if (next === null) return;
    if (move.t === "play") sound.play(2);
    keep(next);
  };
  const again = () => {
    const fresh = startSugoroku(table.kind, table.points, table.players, freshSeed(), table.computers, table.levels);
    if (fresh !== null) keep(fresh);
  };
  // Whoever holds the device plays the seat that is to play, unless a computer is: then they wait.
  const toPlayIsPerson = !over && thinking === null;

  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-3`}
      data-testid="sugoroku-game"
      data-kind={table.kind}
      data-state={over ? "finished" : "playing"}
      data-points={table.points}
      data-thinking={thinking === null ? undefined : "true"}
      {...ready}
    >
      {/* The board's column: laid out wide on a desk (nothing beside it), standing up on a phone, and the whole of the just-the-board modal. */}
      <div className="mx-auto flex w-full min-w-0 flex-col gap-3" data-scale-board data-scale-wide data-bare-board data-scale-tables data-testid="sugoroku-board-column">
        <SugorokuStage
          table={table}
          appearance={{ ...appearance, felt }}
          canAct={toPlayIsPerson}
          send={send}
          seat={alone}
          thinking={thinking}
          wrap={(board) => (
            <WinCoverOver
              news={
                moment.open
                  ? tableNews({
                      names,
                      winners,
                      you: alone,
                      draw: winners.length === 2,
                      detail: sugorokuEnding(table, say),
                      next: { label: `${SUGOROKU_COPY.again} →`, onPress: again },
                    })
                  : null
              }
              onClose={moment.close}
            >
              {board}
            </WinCoverOver>
          )}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2" data-chrome>
        {over ? (
          <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="sugoroku-again">
            {SUGOROKU_COPY.again}
          </button>
        ) : null}
        <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
        <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="dice-sound" data-on={sound.on ? "true" : "false"}>
          {sound.on ? SUGOROKU_COPY.soundOn : SUGOROKU_COPY.soundOff}
        </button>
        <GameEnding>
          <NewGameButton going={!over} onNewGame={() => keep(null)} testId="sugoroku-new" />
        </GameEnding>
      </div>
      {over ? <TableWallpaper game={table.kind} result={resultLine(names, winners, winners.length === 2)} /> : null}
      <p className="text-xs text-muted">{SUGOROKU_COPY.kept}</p>
      <p className="text-sm">
        <Link href={gameHref} className="underline underline-offset-4">
          {SUGOROKU_COPY.about} →
        </Link>
      </p>
      <AskIfAway watching={!over} detail={SUGOROKU_COPY.idleDetail} kept={SUGOROKU_COPY.idleKept} />
    </section>
  );
}
