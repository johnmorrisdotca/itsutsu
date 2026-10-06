"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import type { SugorokuMove, SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { sugorokuOver, sugorokuToPlay } from "@/lib/party/sugoroku/sugorokuTable";

import { SugorokuStage } from "../sugoroku/SugorokuStage";
import type { OnlineBoardProps } from "./online.types";
import { onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * ONE OF THE SEVEN AT A TABLE ON TWO DEVICES: the same stage the table on one
 * device draws (`SugorokuStage`), for the reader's own seat, whose home board is
 * at the bottom, answering a press only on their own turn. The other seat's
 * moves arrive at the poll; a computer's seat is played by a browser at the
 * table (`useComputerTurn`), one move at a time, by the package's computer
 * player at the strength the seat was given.
 */
export function SugorokuOnline({ game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<SugorokuTable, SugorokuMove>) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const over = sugorokuOver(game);
  const mine = mySeat === 0 || mySeat === 1;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="sugoroku-game" data-kind={game.kind} data-state={over ? "finished" : "playing"} data-viewer={mine ? mySeat : undefined}>
      <SugorokuStage table={game} appearance={appearance} canAct={canMove && sugorokuToPlay(game) === mySeat} send={onMove} seat={mine ? mySeat : null} />
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={canMove && !over} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
