"use client";

import type { ReactNode } from "react";

import { MosaicDialog } from "@/components/history/MosaicDialog";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { famousFrames } from "@/lib/famous/famous";
import type { FamousGame } from "@/lib/famous/famous.types";
import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";

/**
 * One famous game's picture of every position, in a window. John, 2026-09-25:
 * the pictures were drawn inline under each card, and he had asked for
 * windows — a small picture with an expand icon, the picture full size on a
 * press, Close and Esc to come back. So the card's own small picture of the
 * final position (`thumb`) is the press, and the picture is made in the
 * reader's browser only then: a gallery of long Go games costs nothing until
 * one of them is wanted, and nothing on the server ever.
 */
export function FamousMosaic({ game, thumb }: { game: FamousGame; thumb: ReactNode }) {
  const count = game.moves.split(" ").filter((token) => token !== "").length;
  return (
    <MosaicDialog
      id={game.id}
      count={count}
      frames={() => famousFrames(game)}
      size={game.size}
      grid={VARIANT_SPECS[game.variant].grid}
      details={() => [
        `${game.black} vs ${game.white}`,
        game.round === null ? game.event : `${game.event} · ${game.round}`,
        `${RULE_VARIANT_DISPLAY[game.variant].label} · ${game.result}`,
        game.date,
        MOSAIC_COPY.site,
      ]}
      fileName={`itsutsu-famous-${game.id}.png`}
      alt={`Every position of ${game.black} against ${game.white}, ${game.event}`}
      thumb={thumb}
    />
  );
}
