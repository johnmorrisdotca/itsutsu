import { SectionTitle } from "@/components/ui/Controls";
import type { GameDetail } from "@/lib/history/gameHistory.types";

import { PlayedMoves } from "@/components/history/PlayedMoves";

/**
 * What has been played, in a game that is still being played.
 *
 * No scrubber here — this board is live and shows the position as it stands —
 * so the list is a record rather than a way to move about. It was missing
 * entirely: a match showed a board and a move count, and John asked twice
 * where the moves had gone. Lifted out of `SharedGame.tsx` at the file-size
 * gate.
 */
export function LiveMoves({ detail }: { detail: GameDetail }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle kanji="棋譜">Moves</SectionTitle>
      <PlayedMoves size={detail.size} moves={detail.moves} emptyNote="Nothing played yet." testId="live-moves" />
    </div>
  );
}
