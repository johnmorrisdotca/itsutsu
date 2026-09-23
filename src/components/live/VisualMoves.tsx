"use client";

import { MosaicDialog } from "@/components/history/MosaicDialog";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { replayTimeline } from "@/lib/gomoku/replay";
import { slugFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { framesOf, mosaicDraws } from "@/lib/record/mosaic";
import { MOSAIC_COPY, VISUAL_MOVES_COPY } from "@/lib/record/mosaic.constants";

/**
 * THE MOVE LIST AS PICTURES: every position of a game still being played, from
 * the first stone to the one just played, in a window opened from beside the
 * move list — John: "a view of the board that is a Modal. not part of the
 * page." Drawn when the window opens, from the moves the board already holds,
 * so it is always the game as it stands and the server is asked for nothing.
 * Not kept in the browser's storage: it would only be a second record that
 * could disagree with the first, and redrawing it takes a moment.
 */
export function VisualMoves({ detail }: { detail: GameDetail }) {
  const variant = detail.variant as RuleVariant;
  if (!mosaicDraws(variant) || detail.moves.length === 0) return null;
  return (
    <MosaicDialog
      id={`live-${detail.id}`}
      count={detail.moves.length}
      frames={() => framesOf(replayTimeline(detail))}
      size={detail.size}
      grid={VARIANT_SPECS[variant].grid}
      details={() => [
        `${detail.blackName || "Black"} vs ${detail.whiteName || "White"}`,
        `${RULE_VARIANT_DISPLAY[variant].label} · ${detail.size}×${detail.size}`,
        `${VISUAL_MOVES_COPY.soFar} · ${detail.moves.length} moves`,
        MOSAIC_COPY.site,
      ]}
      fileName={`itsutsu-${slugFor(variant)}-${detail.id}-move-${detail.moves.length}.png`}
      alt={`Every position of this game so far, ${detail.moves.length} moves`}
    />
  );
}
