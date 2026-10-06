"use client";

import { STONE_SETS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { PieceColourPicker } from "@/components/board/PieceColourPicker";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { STONES, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { PieceColour } from "@/lib/pieces/pieceColours";
import { refusalWords, seatColourRefusal, type SeatColours } from "@/lib/pieces/seatColours";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * BOTH SEATS' COLOURS ON A BOARD PLAYED AT ONE SCREEN: a row for Black and a
 * row for White, each the one picker every game uses (`PieceColourPicker`),
 * each refusing the other's colour or one too like the other's pieces. Any
 * time — before the first stone or forty moves in — and optional: the first
 * circle is the side's ordinary stone.
 */
export function SeatColoursPanel({
  colours,
  appearance,
  onChoose,
}: {
  colours: SeatColours;
  appearance: Appearance;
  onChoose: (side: Stone, colour: PieceColour | null) => void;
}) {
  const say = useSpeaker();
  const set = STONE_SETS[appearance.stoneSet];
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="seat-colours">
      <h2 className={SECTION_TITLE}>
        Piece colours <span className="font-mincho normal-case tracking-normal">色</span>
      </h2>
      {([STONES.black, STONES.white] as Stone[]).map((side) => (
        <div key={side} className="flex flex-col gap-1" data-testid="seat-colours-side" data-side={side} data-colour={colours[side] ?? "usual"}>
          <span className="text-xs text-muted">
            {STONE_DISPLAY[side].label} <span className="font-mincho">{STONE_DISPLAY[side].kanji}</span>
          </span>
          <PieceColourPicker
            value={colours[side] ?? null}
            onChoose={(colour) => onChoose(side, colour)}
            usual={{ face: side === STONES.black ? set.black : set.white, name: `${STONE_DISPLAY[side].label} stones, as usual` }}
            label={`${STONE_DISPLAY[side].label}'s colour`}
            unavailable={(colour) => {
              const refusal = seatColourRefusal(side, colour, colours);
              return refusal === null ? null : refusalWords(refusal, say);
            }}
            testId={`seat-colours-${side}`}
          />
        </div>
      ))}
    </div>
  );
}
