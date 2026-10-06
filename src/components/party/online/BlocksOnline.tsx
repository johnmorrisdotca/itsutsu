"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import { blocksScores } from "@/lib/gomoku/party/partyBlocks";
import type { PartyBlocksState } from "@/lib/gomoku/party/partyBlocks.types";
import type { BlocksLay } from "@/lib/party/online/onlineGames";

import { PartyBlocksBoard } from "../PartyBlocksBoard";
import { PartyBlocksTurnLine } from "../PartyBlocksStatus";
import { PartyBlocksTray } from "../PartyBlocksTray";
import { useBlocksHand } from "../useBlocksHand";
import type { OnlineBoardProps } from "./online.types";
import { blocksWords, onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";

/**
 * BLOCK FIVE AT A TABLE ON SEVERAL DEVICES: the turn line, board and tray the
 * table on one device draws, with the same hand (`useBlocksHand`). The tray is
 * offered only on the reader's own turn, under the board; a piece laid is
 * sent rather than kept.
 */
export function BlocksOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<PartyBlocksState, BlocksLay>) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const PARTY_BLOCKS_COPY = blocksWords(say.locale);
  const hand = useBlocksHand(game, canMove, (piece, cells) => onMove({ piece, cells }));
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="party-blocks" data-state={game.status} data-moves={game.moves.length}>
      <PartyBlocksTurnLine game={game} />
      <PartyBlocksBoard
        game={game}
        appearance={appearance}
        preview={hand.preview}
        starts={hand.starts}
        onSquare={hand.onSquare}
        onAim={hand.onAim}
        readOnly={!canMove}
      />
      {hand.playing && hand.hold !== null ? (
        <PartyBlocksTray
          game={game}
          hold={hand.hold}
          onHold={hand.onHold}
          onRotate={hand.onRotate}
          onFlip={hand.onFlip}
          refusal={hand.preview?.refusal == null ? null : PARTY_BLOCKS_COPY.refusals[hand.preview.refusal]}
        />
      ) : null}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={hand.playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Block Five: squares covered, and pieces still in hand. */
export function blocksStanding(game: PartyBlocksState, seat: number, say: Speaker): string {
  const score = blocksScores(game)[seat];
  return score === undefined ? "" : say.say("party.blocks.standing", { squares: String(score.squares), left: String(score.piecesLeft) });
}
