"use client";

import { MosaicMaker } from "@/components/history/MosaicMaker";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { famousFrames } from "@/lib/famous/famous";
import type { FamousGame } from "@/lib/famous/famous.types";
import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * One famous game's picture of every position, made in the reader's browser.
 * The game is replayed only when somebody presses — a gallery of twenty games
 * costs nothing until one of them is wanted, and nothing on the server ever.
 */
export function FamousMosaic({ game }: { game: FamousGame }) {
  const hydrated = useHydrated();
  const count = game.moves.split(" ").filter((token) => token !== "").length;
  return (
    <div className="flex flex-col gap-3" data-testid="famous-mosaic" {...readyMark(hydrated)}>
    <MosaicMaker
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
    />
    </div>
  );
}
