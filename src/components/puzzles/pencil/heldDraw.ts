import { drawAkari } from "@johnmorrisdotca/kazu/akari/draw";
import { drawHitori } from "@johnmorrisdotca/kazu/hitori/draw";
import { drawSlitherlink } from "@johnmorrisdotca/kazu/slitherlink/draw";

import { akariBoardOf, akariBulbsOf } from "@/lib/puzzles/pencil/akari";
import { hitoriBoardOf, hitoriShadedOf } from "@/lib/puzzles/pencil/hitori";
import type { HeldPencilKind } from "@/lib/puzzles/pencil/pencil.types";
import { slitherlinkBoardOf, slitherlinkEdgesOf } from "@/lib/puzzles/pencil/slitherlink";

import type { PencilView } from "./pencilDraw";

/**
 * THE HELD PENCIL PUZZLES AS SVG TEXT, drawn by Kazu as `pencilSvg` draws the offered ones (see
 * `lib/puzzles/pencil/held.constants.ts`): Akari, Loop (Slitherlink) and Hitori. Nothing the site runs imports this
 * file, so none of Kazu's three drawings is in a bundle; `held.test.ts` does, and to bring a puzzle back its case
 * moves into `pencilDraw.ts`.
 */
export function heldPencilSvg(kind: HeldPencilKind, size: number, givens: string, code: string, view: PencilView = {}): string | null {
  const selected = view.selected ?? null;
  const wrong = [...(view.wrong ?? [])];
  const material = "ivory" as const;
  switch (kind) {
    case "akari": {
      const board = akariBoardOf(size, givens);
      const bulbs = akariBulbsOf(size, code);
      return board === null || bulbs === null ? null : drawAkari(board, { bulbs, selected, errors: wrong, material });
    }
    case "slitherlink": {
      const board = slitherlinkBoardOf(size, givens);
      const edges = slitherlinkEdgesOf(size, code);
      return board === null || edges === null ? null : drawSlitherlink(board, { edges, selected, errors: wrong, material });
    }
    case "hitori": {
      const board = hitoriBoardOf(size, givens);
      const shaded = hitoriShadedOf(size, code);
      if (board === null || shaded === null) return null;
      // Kazu marks a wrong number by colouring it, and a shaded square has none showing: its outline is drawn red here, over the drawing.
      const outlines = wrong
        .filter((cell) => shaded[cell])
        .map((cell) => `<rect x="${(cell % size) * 52 + 3}" y="${Math.floor(cell / size) * 52 + 3}" width="46" height="46" fill="none" stroke="var(--kz-bad,#b5452c)" stroke-width="4"/>`)
        .join("");
      return drawHitori(board, { shaded, selected, errors: wrong, material }).replace(/<\/svg>$/, `${outlines}</svg>`);
    }
  }
}
