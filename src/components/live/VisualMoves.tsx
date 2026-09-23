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
 * Under the board, always there and drawn by itself: whenever the moves change
 * it is drawn again from the moves this board already holds, so the picture is
 * always the game as it stands and the server is never asked for anything.
 * John asked for it made "every move… so that they can always see it" — and a
 * refresh cannot lose it, because it is redrawn from the moves the page loads
 * with. Not kept in the browser's storage: that would only be a second record
 * that could disagree with the first, and a full-screen picture is bigger than
 * the few megabytes a browser keeps for a site.
 */
export function VisualMoves({ detail }: { detail: GameDetail }) {
  const variant = detail.variant as RuleVariant;
  if (!mosaicDraws(variant) || detail.moves.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" data-testid="visual-moves">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {VISUAL_MOVES_COPY.summary} <span className="font-mincho normal-case tracking-normal">{VISUAL_MOVES_COPY.kanji}</span>
      </h2>
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
        auto
      />
    </section>
  );
}
