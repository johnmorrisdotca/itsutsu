"use client";

import { useMemo } from "react";

import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { slugFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { framesOf, mosaicDraws } from "@/lib/record/mosaic";
import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import type { MosaicTitle } from "@/lib/record/mosaic.types";

import { MosaicDialog } from "./MosaicDialog";
/**
 * The title bar's words: who played, then the day in THIS reader's calendar,
 * what, and how it ended — worked out in the handler, where there is only the
 * browser (see `SgfDownload` for why).
 */
function titleOf(game: GameDetail, variant: RuleVariant): MosaicTitle {
  const at = new Date(game.lastMoveAt ?? game.playedAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = Number.isNaN(at.getTime()) ? null : `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  return {
    name: `${game.blackName || "Black"} vs ${game.whiteName || "White"}`,
    details: [
      ...(day === null ? [] : [day]),
      `${RULE_VARIANT_DISPLAY[variant].label} ${game.size}×${game.size}`,
      `${GAME_RESULT_DISPLAY[game.result].label}, ${game.moveCount} moves`,
      MOSAIC_COPY.site,
    ],
  };
}

/**
 * A FINISHED GAME AS ONE PICTURE, made in the reader's browser and theirs to
 * keep. John, 2026-09-23: "don't do them on the server if possible… async so
 * that it doesn't block the user."
 *
 * Nothing here asks the site for anything. The positions are the replay's own
 * timeline, already in memory for the board above; the window, the drawing
 * and the file are `MosaicDialog`'s — a quiet button beside the move list,
 * so the picture never stands over the board.
 *
 * Offered for the square-grid games only — see `mosaicDraws`. A hexagon board
 * drawn on a square grid would be a wrong picture, which is worse than none.
 */
export function GameMosaic({ game, timeline }: { game: GameDetail; timeline: readonly GameState[] }) {
  const frames = useMemo(() => framesOf(timeline), [timeline]);
  const variant = game.variant as RuleVariant;
  if (!mosaicDraws(variant) || frames.length === 0) return null;

  return (
    <MosaicDialog
      id={game.id}
      count={frames.length}
      frames={() => frames}
      size={game.size}
      grid={VARIANT_SPECS[variant].grid}
      title={() => titleOf(game, variant)}
      fileName={`itsutsu-${slugFor(variant)}-${game.id}.png`}
      alt={`Every position of this game, ${frames.length} moves`}
    />
  );
}
