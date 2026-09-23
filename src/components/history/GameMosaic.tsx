"use client";

import { useMemo } from "react";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { slugFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { framesOf, mosaicDraws } from "@/lib/record/mosaic";
import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MosaicMaker } from "./MosaicMaker";
/**
 * The game's own lines for the card after the last move: who played, what,
 * how it ended, and the day in THIS reader's calendar — worked out in the
 * handler, where there is only the browser (see `SgfDownload` for why).
 */
function detailsOf(game: GameDetail, variant: RuleVariant): string[] {
  const at = new Date(game.lastMoveAt ?? game.playedAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = Number.isNaN(at.getTime()) ? null : `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  return [
    `${game.blackName || "Black"} vs ${game.whiteName || "White"}`,
    `${RULE_VARIANT_DISPLAY[variant].label} · ${game.size}×${game.size}`,
    `${GAME_RESULT_DISPLAY[game.result].label} · ${game.moveCount} moves`,
    ...(day === null ? [] : [day]),
    MOSAIC_COPY.site,
  ];
}

/**
 * A FINISHED GAME AS ONE PICTURE, made in the reader's browser and theirs to
 * keep. John, 2026-09-23: "don't do them on the server if possible… async so
 * that it doesn't block the user."
 *
 * Nothing here asks the site for anything. The positions are the replay's own
 * timeline, already in memory for the board above; the drawing is
 * `mosaicSvg`, a string; the PNG is the browser's canvas. The first press
 * draws it, and the picture then sits here to look at and download.
 *
 * Offered for the square-grid games only — see `mosaicDraws`. A hexagon board
 * drawn on a square grid would be a wrong picture, which is worse than none.
 */
/**
 * A FINISHED GAME AS ONE PICTURE, made in the reader's browser and theirs to
 * keep. John, 2026-09-23: "don't do them on the server if possible… async so
 * that it doesn't block the user."
 *
 * Nothing here asks the site for anything. The positions are the replay's own
 * timeline, already in memory for the board above; the drawing and the file
 * are `MosaicMaker`'s.
 *
 * Offered for the square-grid games only — see `mosaicDraws`. A hexagon board
 * drawn on a square grid would be a wrong picture, which is worse than none.
 */
export function GameMosaic({ game, timeline }: { game: GameDetail; timeline: readonly GameState[] }) {
  const hydrated = useHydrated();
  const frames = useMemo(() => framesOf(timeline), [timeline]);
  const variant = game.variant as RuleVariant;
  if (!mosaicDraws(variant) || frames.length === 0) return null;

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="game-mosaic" {...readyMark(hydrated)}>
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {MOSAIC_COPY.heading} <span className="font-mincho normal-case tracking-normal">{MOSAIC_COPY.kanji}</span>
      </h2>
      <p className="text-sm text-ink-soft">{MOSAIC_COPY.blurb}</p>
      <MosaicMaker
        id={game.id}
        count={frames.length}
        frames={() => frames}
        size={game.size}
        grid={VARIANT_SPECS[variant].grid}
        details={() => detailsOf(game, variant)}
        fileName={`itsutsu-${slugFor(variant)}-${game.id}.png`}
        alt={`Every position of this game, ${frames.length} moves`}
      />
    </section>
  );
}
