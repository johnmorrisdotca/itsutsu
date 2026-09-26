"use client";

import { WORD_STYLE_DISPLAY, WORD_STYLE_LIST, type WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

import { useWordStyle } from "./WordStyleContext";

/**
 * THE THREE WAYS A GOMOJI GRID CAN BE DRAWN, side by side under it: Reversi,
 * Gomoku, Tiles. One press redraws the grid and is kept on the account
 * (`WordStyleProvider`). Every chip is the same width whichever is chosen, so
 * the row never moves.
 *
 * `styles` narrows the chips: a Kumimoji's table offers Reversi and Gomoku
 * only, its tiles being Tiles already (`TABLE_BOARDS`). A style chosen that
 * is not offered here reads as the first.
 */
export function WordStylePicker({ styles = WORD_STYLE_LIST }: { styles?: readonly WordStyle[] } = {}) {
  const { style: chosenStyle, setStyle } = useWordStyle();
  const style = styles.includes(chosenStyle) ? chosenStyle : styles[0];
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="How the grid is drawn" data-testid="word-style">
      {styles.map((each) => {
        const chosen = each === style;
        return (
          <button
            key={each}
            type="button"
            onClick={() => setStyle(each)}
            aria-pressed={chosen}
            className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-moss ${
              chosen ? "border-ink bg-ink text-ivory" : "border-rule-strong/80 bg-ivory/80 text-ink-soft hover:bg-rule/60"
            }`}
            data-testid={`word-style-${each}`}
          >
            {WORD_STYLE_DISPLAY[each].label}
          </button>
        );
      })}
    </div>
  );
}
