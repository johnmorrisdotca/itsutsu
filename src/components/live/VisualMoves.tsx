"use client";

import { MosaicMaker } from "@/components/history/MosaicMaker";
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
 * the first stone to the one just played. John, 2026-09-23: "a visual move
 * list… where they see the entire board each step from beginning to current
 * move… only done on the client."
 *
 * Folded under the move list, and nothing is made until it is asked for: the
 * positions come from replaying the moves this board already holds, at the
 * press, so the picture is always of the game as it stands and the server is
 * never asked for anything. Not kept in the browser's storage either — the
 * moves are already in memory and replaying them takes a moment, so a stored
 * copy would only be a second record that could disagree with the first.
 */
export function VisualMoves({ detail }: { detail: GameDetail }) {
  const variant = detail.variant as RuleVariant;
  if (!mosaicDraws(variant) || detail.moves.length === 0) return null;
  return (
    <details className="group flex flex-col gap-3" data-testid="visual-moves">
      <summary className="cursor-pointer list-none text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase select-none hover:text-ink">
        {VISUAL_MOVES_COPY.summary} <span className="font-mincho normal-case tracking-normal">{VISUAL_MOVES_COPY.kanji}</span>
        <span className="ml-1 opacity-60 group-open:hidden">+</span>
        <span className="ml-1 hidden opacity-60 group-open:inline">−</span>
      </summary>
      <div className="mt-2 flex flex-col gap-3">
        <MosaicMaker
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
      </div>
    </details>
  );
}
