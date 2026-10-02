"use client";

import { useState, type ReactNode } from "react";

import type { Appearance } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { SUGOROKU_SEATS } from "@/lib/party/sugoroku/sugoroku.constants";
import type { SugorokuMove, SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { sugorokuToPlay, viewOf } from "@/lib/party/sugoroku/sugorokuTable";
import { sugorokuCubeWords, sugorokuEnding, sugorokuNames, sugorokuNews, sugorokuScoreWords, sugorokuStatus } from "@/lib/party/sugoroku/sugorokuWords";

import { SUGOROKU_COPY } from "./sugoroku.constants";
import { SugorokuBoard } from "./SugorokuBoard";
import { useSugorokuTurn } from "./useSugorokuTurn";

/**
 * A MATCH OF ONE OF THE SEVEN IN PLAY: what the table waits on and what last
 * happened, the score and the cube, the board, and three presses in the same
 * three places whatever they say (Roll, Double and Give up; Done, Undo and Give
 * up; Take, Drop and Give up), so the page never shifts as the game goes on.
 * The table on one device and the table on two both draw this, so they cannot
 * disagree about a turn: `canAct` says whether this page moves for the seat to
 * play, `send` is how a move is made, and `wrap` lets the page lay its win
 * cover over the board alone.
 */
export function SugorokuStage({
  table,
  appearance,
  canAct,
  send,
  seat,
  thinking = null,
  wrap = (board) => board,
}: {
  table: SugorokuTable;
  appearance: Appearance;
  /** Whether this page moves for the seat to play: a person's seat, no move on its way. */
  canAct: boolean;
  send: (move: SugorokuMove) => void;
  /** The seat the reader sits in, whose home board is at the bottom; null for a table of people round one device, where white is. */
  seat: number | null;
  /** Who a computer is working out a move for, said in the status line. */
  thinking?: string | null;
  wrap?: (board: ReactNode) => ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const turn = useSugorokuTurn(table, canAct, (move) => {
    setConfirming(false);
    send(move);
  });
  const { game, settings, match } = viewOf(table);
  const names = sugorokuNames(table);
  const to = sugorokuToPlay(table);
  const over = match.over;
  const phase = turn.phase;
  const view = seat === 1 ? "black" : "white";
  const position = turn.game?.position ?? game?.position ?? viewOf(table).last?.position;
  const status = over ? sugorokuEnding(table) : thinking !== null ? SUGOROKU_COPY.thinking(thinking) : sugorokuStatus(table);
  const hint = confirming
    ? SUGOROKU_COPY.giveUpAsk
    : phase === "move"
      ? turn.blocked
        ? SUGOROKU_COPY.noMove
        : turn.canDone
          ? ""
          : `${SUGOROKU_COPY.moreToPlay(turn.left)} ${SUGOROKU_COPY.chooseChecker}`
      : "";
  const primary =
    phase === "roll"
      ? { label: SUGOROKU_COPY.roll, test: "sugoroku-roll", on: turn.canRoll, press: turn.roll }
      : phase === "move"
        ? { label: SUGOROKU_COPY.done, test: "sugoroku-done", on: turn.canDone, press: turn.done }
        : phase === "answer"
          ? { label: SUGOROKU_COPY.take, test: "sugoroku-take", on: turn.canAnswer, press: turn.take }
          : { label: over ? SUGOROKU_COPY.over : SUGOROKU_COPY.rolling, test: "sugoroku-wait", on: false, press: () => undefined };
  const second =
    phase === "roll"
      ? { label: SUGOROKU_COPY.double, test: "sugoroku-double", on: turn.canDouble, press: turn.double }
      : phase === "move"
        ? { label: SUGOROKU_COPY.undo, test: "sugoroku-undo", on: turn.canUndo, press: turn.undo }
        : phase === "answer"
          ? { label: SUGOROKU_COPY.drop, test: "sugoroku-drop", on: turn.canAnswer, press: turn.drop }
          : { label: "", test: "sugoroku-spare", on: false, press: () => undefined };
  const mover = turn.highlight === null ? null : turn.highlight.side;

  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      data-testid="sugoroku-stage"
      data-state={over ? "finished" : "playing"}
      data-phase={phase}
      data-to-play={to ?? undefined}
      data-seat={seat ?? undefined}
      data-turn-side={to === null ? undefined : SUGOROKU_SEATS[to]}
      data-score={`${match.score[0]}-${match.score[1]}`}
      data-cube={game?.cube.value ?? undefined}
      data-cube-owner={game?.cube.owner ?? "none"}
      data-games={match.results.length}
      data-dice={turn.dice?.values.join("") ?? undefined}
      data-left={phase === "move" ? turn.left : undefined}
    >
      <div className="flex min-h-[5.75rem] flex-col gap-0.5" aria-live="polite">
        <p className="text-base font-semibold" data-testid="sugoroku-status">
          {status}
        </p>
        <p className="text-sm text-muted" data-testid="sugoroku-news">
          {sugorokuNews(table)}
        </p>
        <p className="text-sm" data-testid="sugoroku-score">
          {sugorokuScoreWords(table)}
          {settings.rules.cube ? ` · ${sugorokuCubeWords(table)}` : ""}
        </p>
      </div>
      {wrap(
        position === undefined ? null : (
          <SugorokuBoard
            position={position}
            variant={settings.variant}
            view={view}
            mover={canAct ? mover : null}
            cube={settings.rules.cube ? { value: game?.cube.value ?? 1, owner: game?.cube.owner ?? null } : null}
            dice={turn.dice}
            highlight={canAct ? turn.highlight : null}
            appearance={appearance}
            label={`${names[0]} white, ${names[1]} black`}
            onPress={turn.press}
          />
        ),
      )}
      <div className="grid grid-cols-3 gap-2" data-testid="sugoroku-presses" data-bare-beside>
        <button type="button" onClick={primary.press} disabled={!primary.on} className={`${BUTTON_BASE} min-h-11 ${primary.on ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid={primary.test}>
          {primary.label}
        </button>
        <button type="button" onClick={second.press} disabled={!second.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid={second.test} aria-hidden={second.label === "" ? "true" : undefined}>
          {second.label === "" ? " " : second.label}
        </button>
        {confirming ? (
          <button type="button" onClick={turn.giveUp} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="sugoroku-give-up-yes">
            {SUGOROKU_COPY.giveUpYes}
          </button>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={!canAct || over || phase === "answer"} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="sugoroku-give-up">
            {SUGOROKU_COPY.giveUp}
          </button>
        )}
      </div>
      <p className="min-h-8 text-sm text-muted" data-testid="sugoroku-hint">
        {hint}
        {confirming ? (
          <button type="button" onClick={() => setConfirming(false)} className="ml-2 underline underline-offset-4" data-testid="sugoroku-give-up-no">
            {SUGOROKU_COPY.giveUpNo}
          </button>
        ) : null}
      </p>
    </div>
  );
}
