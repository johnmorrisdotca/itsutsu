"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import { useState } from "react";

import type { Point } from "@/lib/gomoku/gomoku.types";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";
import type { RaceMove } from "@/lib/party/online/onlineGames";

import { RaceTurnLine } from "../PartyRaceGame";
import type { PartyRaceKind } from "../party.types";
import type { OnlineBoardProps } from "./online.types";
import { onlineWords, partyScreenWords, raceWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { RaceVariant } from "@/lib/gomoku/party/partyRace.types";

/**
 * A RACE AT A TABLE ON SEVERAL DEVICES — Chinese Checkers round the star,
 * Halma round the square: the turn line and board the table on one device
 * draws. On the reader's own turn a piece is picked up and put down exactly as
 * there, and the move is sent rather than kept.
 */
export function RaceOnline<S extends PartyRaceState, C extends number>({
  kind,
  game,
  appearance,
  canMove,
  onMove,
}: OnlineBoardProps<S, RaceMove> & { kind: PartyRaceKind<S, C> }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [selected, setSelected] = useState<Point | null>(null);
  const { rules, Board } = kind;
  // A piece picked up stays picked only while it is still the mover's and the reader may move.
  const picked = canMove && selected !== null && game.board[selected.row * rules.size + selected.col] === game.toPlay ? selected : null;
  const targets = picked === null ? [] : rules.destinations(game, picked);

  const onHole = (point: Point) => {
    if (!canMove) return;
    if (picked !== null && targets.some((one) => one.row === point.row && one.col === point.col)) {
      onMove({ from: picked, to: point });
      setSelected(null);
      return;
    }
    const mine = game.board[point.row * rules.size + point.col] === game.toPlay;
    setSelected(mine && !(picked?.row === point.row && picked.col === point.col) ? point : null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid={kind.testId} data-state={game.status} data-moves={game.moves.length}>
      <RaceTurnLine game={game} farCamp={raceWords(say.locale)[kind.variant as RaceVariant].farCamp} />
      <Board game={game} appearance={appearance} selected={picked} targets={targets} onHole={onHole} readOnly={!canMove} />
      {canMove && game.status === PARTY_STATUS.playing ? <p className="text-xs text-muted">{PARTY_COPY.pick}</p> : null}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks (`idleWatch.coverage.test.ts`). */}
      <AskIfAway watching={canMove && game.status === PARTY_STATUS.playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
