"use client";

import { STONE_SETS } from "@/components/board/Board.constants";
import { StoneMark } from "@/components/board/StoneMark";
import { seatStones } from "@/components/board/seatStones";
import { useStoneColours } from "@/components/board/seatColourContext";

import type { PairStoneProps } from "./party.types";

/** A team's colour beside its names: the reader's own stone, or the colour the team chose, the height of a line of text. */
export function PairStone({ stone, appearance }: PairStoneProps) {
  const colours = useStoneColours();
  return (
    <span className="relative flex size-5 shrink-0 items-center justify-center" data-testid="pairgo-stone" data-stone={stone}>
      <StoneMark stone={stone} stones={seatStones(STONE_SETS[appearance.stoneSet], colours)} />
    </span>
  );
}
