"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import { MANCALA_STATUS } from "@/lib/party/mancala/mancala";
import type { MancalaGame } from "@/lib/party/mancala/mancala.types";
import { storeOf } from "@/lib/party/mancala/sowing";

import { MancalaBoard } from "../MancalaBoard";
import { MancalaTurnLine } from "../MancalaTurnLine";
import type { OnlineBoardProps } from "./online.types";
import { mancalaWords, onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";

/**
 * MANCALA AT A TABLE ON SEVERAL DEVICES: the turn line and board the table on
 * one device draws, the pits answering a tap only on the reader's own turn. A
 * pit tapped is sent; the table's answer is the board, drawn as it stands
 * rather than sown seed by seed.
 */
export function MancalaOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<MancalaGame, number>) {
  const say = useSpeaker();
  const MANCALA_COPY = mancalaWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const playing = game.status === MANCALA_STATUS.playing;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="mancala-game" data-state={game.status} data-rules={game.ruleSet} data-moves={game.moves.length}>
      <MancalaTurnLine game={game} sowing={false} />
      <MancalaBoard game={game} appearance={appearance} onPit={onMove} readOnly={!canMove} />
      {canMove && playing ? <p className="text-xs text-muted">{MANCALA_COPY.tap}</p> : null}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={canMove && playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Mancala: the seeds in its store. */
export function mancalaStanding(game: MancalaGame, seat: number, say: Speaker): string {
  return say.say("party.mancala.inStore", { seeds: String(game.holes[storeOf(seat)] ?? 0) });
}
