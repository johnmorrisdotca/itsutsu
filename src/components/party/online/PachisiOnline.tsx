"use client";

import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { pachisiMoves, pawnsHome } from "@/lib/party/pachisi/pachisi";
import type { PachisiGame, PachisiMove } from "@/lib/party/pachisi/pachisi.types";
import { seatedName } from "@/lib/party/partyNames";

import { MarbleChip } from "../MarbleChip";
import { PachisiBoard } from "../pachisi/PachisiBoard";
import { PachisiDice } from "../pachisi/PachisiDice";
import { PachisiTurnLine } from "../pachisi/PachisiTurnLine";
import { onlineWords, pachisiWords } from "../partyWords";
import type { OnlineBoardProps } from "./online.types";

/** Which of this throw's two dice are spent: those whose value is no longer waiting. */
function spent(game: PachisiGame): boolean[] {
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
 * PACHISI AT A TABLE ON SEVERAL DEVICES: the turn line, board and dice the table on one
 * device draws, pressed only on the reader's own turn. A throw is a press with nothing
 * in it, and the two dice are the server's; a value chosen and a ringed pawn tapped is a
 * move, which the server plays by the same rules.
 */
export function PachisiOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<PachisiGame, PachisiMove>) {
  const say = useSpeaker();
  const PACHISI_COPY = pachisiWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const [choice, setChoice] = useState<{ at: number; pick: number | "enter" } | null>(null);
  const playing = game.phase !== "finished";
  const offered = canMove && playing ? pachisiMoves(game) : [];
  const usable = game.pending.map((_, use) => offered.some((move) => move.kind === "move" && move.use === use));
  const enterable = offered.some((move) => move.kind === "enter");
  const first = usable.indexOf(true) >= 0 ? usable.indexOf(true) : enterable ? ("enter" as const) : null;
  const at = game.thrown * 100 + game.pending.length;
  const chosen = choice !== null && choice.at === at ? choice.pick : first;
  const movable = offered.filter((move) => (chosen === "enter" ? move.kind === "enter" : move.kind === "move" && move.use === chosen)).flatMap((move) => (move.kind === "roll" ? [] : [move.pawn]));
  const canRoll = canMove && game.phase === "roll";
  const diceLeft = spent(game).filter((used) => !used).length;
  const onPawn = (pawn: number) => {
    if (chosen === "enter") onMove({ kind: "enter", pawn });
    else if (chosen !== null) onMove({ kind: "move", pawn, use: chosen });
  };
  const pickClass = (on: boolean) => `${BUTTON_BASE} ${on ? BUTTON_STRONG : BUTTON_QUIET} tabular-nums`;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="pachisi-game" data-state={game.phase} data-to-play={game.toPlay} data-thrown={game.thrown}>
      <PachisiTurnLine game={game} />
      <PachisiBoard game={game} appearance={appearance} movable={movable} onPawn={canMove && game.phase === "move" ? onPawn : undefined} />
      <div className="flex min-w-0 flex-col gap-3" data-bare-beside>
        <div className="flex flex-wrap items-center gap-3">
          <PachisiDice dice={game.dice} used={spent(game)} thrown={game.thrown} />
          {playing ? (
            <button type="button" onClick={() => canRoll && onMove({ kind: "roll" })} disabled={!canRoll} className={`${BUTTON_LEAD} ${canRoll ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="pachisi-roll">
              {PACHISI_COPY.roll}
            </button>
          ) : null}
        </div>
        {canMove && game.phase === "move" ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label={say.say("party.pachisi.valuesAria")}>
              {game.pending.map((value, use) =>
                usable[use] ? (
                  <button key={use} type="button" onClick={() => setChoice({ at, pick: use })} aria-pressed={chosen === use} className={pickClass(chosen === use)} data-testid="pachisi-value" data-value={value}>
                    {use >= diceLeft ? PACHISI_COPY.bonus(value) : value}
                  </button>
                ) : null,
              )}
              {enterable ? (
                <button type="button" onClick={() => setChoice({ at, pick: "enter" })} aria-pressed={chosen === "enter"} className={pickClass(chosen === "enter")} data-testid="pachisi-both">
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
              <span className="min-w-0 truncate">{seatedName(game, seat, say)}</span>
              <span className="ml-auto text-muted tabular-nums">{PACHISI_COPY.home4(pawnsHome(game, seat))}</span>
            </li>
          ))}
        </ul>
      </div>
      <AskIfAway watching={canMove && playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
