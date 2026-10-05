import { drawFillomino } from "@johnmorrisdotca/kazu/fillomino/draw";
import { drawKakuro } from "@johnmorrisdotca/kazu/kakuro/draw";
import { drawShikaku } from "@johnmorrisdotca/kazu/shikaku/draw";

import { fillominoBoardOf, fillominoEntriesOf } from "@/lib/puzzles/pencil/fillomino";
import { kakuroBoardOf, kakuroValuesOf } from "@/lib/puzzles/pencil/kakuro";
import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";
import { shikakuBoardOf, shikakuRectsOf } from "@/lib/puzzles/pencil/shikaku";

/**
 * What a board shows besides what is written on it: the cell or edge chosen,
 * Shikaku's first corner waiting for its opposite one, and the mark places
 * Show has marked wrong.
 */
export type PencilView = {
  selected?: number | null;
  anchor?: number | null;
  wrong?: ReadonlySet<number>;
};

/**
 * A PENCIL PUZZLE AS SVG TEXT, drawn by Kazu (`@johnmorrisdotca/kazu/<kind>/draw`)
 * from the givens and what is written on them. Kazu's paper, ink and rules, with
 * the wood round it that every board here has (`PuzzleBoard`); null for givens
 * or a code that do not read, so a page never draws a board that is not one.
 *
 * Kazu's drawing wears its own custom properties (`--kz-paper` and the rest) and
 * falls back to a light paper without them, which is the paper every puzzle's
 * grid is here, in both themes (John, 2026-09-24: "the inside of the board could
 * be white because it's a place where people write").
 */
export function pencilSvg(kind: PencilKind, size: number, givens: string, code: string, view: PencilView = {}): string | null {
  const selected = view.selected ?? null;
  const wrong = [...(view.wrong ?? [])];
  const material = "ivory" as const;
  switch (kind) {
    case "shikaku": {
      const board = shikakuBoardOf(size, givens);
      const rectangles = shikakuRectsOf(size, code);
      if (board === null || rectangles === null) return null;
      // Kazu marks a rectangle wrong by its place in the list; a rectangle is wrong when its top-left cell is (`PencilEngine.wrong`).
      const errors = rectangles.flatMap((rect, at) => (wrong.includes(rect.y * size + rect.x) ? [at] : []));
      return drawShikaku(board, { rectangles, selected, anchor: view.anchor ?? null, errors, material });
    }
    case "regions": {
      const board = fillominoBoardOf(size, givens);
      const entries = fillominoEntriesOf(size, code);
      return board === null || entries === null ? null : drawFillomino(board, { entries, selected, errors: wrong, material });
    }
    case "crossSums": {
      const board = kakuroBoardOf(size, givens);
      const values = board === null ? null : kakuroValuesOf(board, code);
      return board === null || values === null ? null : drawKakuro(board, { values, selected: selected ?? undefined, errors: wrong, material });
    }
  }
}
