"use client";

import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { wearsFelt } from "./appearance";
import { BOARD_THEMES, FELT_LIST, FELTS } from "./Board.constants";
import type { Appearance, BoardTheme, Felt } from "./board.types";

/**
 * THE COLOUR OF A REVERSI BOARD, CHOSEN BY LOOKING. John, 2026-09-25: "a very
 * subtle colour picker. like one component or element with just some colour
 * patches that you click on to change. on game creation and even mid-game is
 * OK."
 *
 * A row of small round patches of the cloth itself, the chosen one ringed, and
 * no words on the page: each says its name to a screen reader and on hover.
 * The last patch is the reader's own board surface (`wood`), for a Reversi
 * drawn like every other board. One component, on the set-up screen and beside
 * a game's board, so the two cannot drift apart.
 */
export function FeltPatches({ felt, wood, onChoose }: { felt: Felt; wood: BoardTheme; onChoose: (felt: Felt) => void }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Board colour" data-testid="felt-patches">
      {FELT_LIST.map((each) => {
        const look = each === "wood" ? BOARD_THEMES[wood] : FELTS[each];
        const chosen = felt === each;
        return (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={chosen}
            aria-label={each === "wood" ? `Your board, ${look.label}` : look.label}
            title={each === "wood" ? `Your board (${look.label})` : `${look.label} ${look.kanji}`}
            onClick={() => onChoose(each)}
            data-testid={`felt-${each}`}
            className={`size-4 rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-moss ${
              chosen ? "ring-2 ring-ink ring-offset-1 ring-offset-paper" : "ring-1 ring-rule-strong"
            }`}
            style={{ background: look.surface }}
          />
        );
      })}
    </div>
  );
}

/** The patches under a board, where the game wears felt (`wearsFelt`); nothing for any other game. */
export function FeltUnderBoard({ appearance, variant, onChoose }: { appearance: Appearance; variant: RuleVariant; onChoose: (felt: Felt) => void }) {
  if (!wearsFelt(appearance, VARIANT_SPECS[variant])) return null;
  return <FeltPatches felt={appearance.felt} wood={appearance.boardTheme} onChoose={onChoose} />;
}
