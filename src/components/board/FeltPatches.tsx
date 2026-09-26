"use client";

import type { CSSProperties } from "react";

import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { wearsFelt } from "./appearance";
import { BOARD_THEMES, FELT_LIST, FELTS } from "./Board.constants";
import type { Appearance, BoardTheme, BoardThemeTokens, Felt } from "./board.types";

/**
 * THE COLOUR OF A REVERSI BOARD, CHOSEN BY LOOKING. John, 2026-09-25: "a very
 * subtle colour picker. like one component or element with just some colour
 * patches that you click on to change. on game creation and even mid-game is
 * OK."
 *
 * A row of small square patches of the board itself, the chosen one ringed,
 * and no words on the page: each says its name to a screen reader and on
 * hover. The last patch is the reader's own board surface (`wood`), for a
 * Reversi drawn like every other board. One component, on the set-up screen
 * and beside a game's board, so the two cannot drift apart.
 *
 * SQUARE, BECAUSE IT IS A BOARD. John, 2026-09-25, at the first row of round
 * patches: "When presenting a set of Board Colours to pick... don't use
 * Circles... use square or tiles that we see, to simulate the Reversi board...
 * Reserve the use of Circles for Marble colours." Each patch is four squares
 * of the cloth in its own rim and ruling (`boardPatchLook`), and a pointer
 * over it says it can be pressed.
 */
export function FeltPatches({ felt, wood, onChoose }: { felt: Felt; wood: BoardTheme; onChoose: (felt: Felt) => void }) {
  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Board colour" data-testid="felt-patches">
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
            className={`size-5 cursor-pointer rounded-[3px] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-moss ${
              chosen ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:ring-1 hover:ring-rule-strong hover:ring-offset-1 hover:ring-offset-paper"
            }`}
            style={boardPatchLook(look)}
          />
        );
      })}
    </div>
  );
}

/**
 * A patch of a board's surface, drawn as a bit of the board rather than a dot
 * of its colour: the surface, crossed once each way by its own ruling, so the
 * patch reads as four squares, inside a rim of the board's frame. For every
 * swatch that picks a board (`FeltPatches`, and the board themes beside a
 * game); a stone's or a marble's colour stays a circle.
 */
export function boardPatchLook(look: BoardThemeTokens): CSSProperties {
  const rule = `linear-gradient(${look.line}, ${look.line})`;
  return {
    background: `${rule} center / 1px 100% no-repeat, ${rule} center / 100% 1px no-repeat, ${look.surface}`,
    // A border rather than an inset shadow: the ring that marks the chosen patch is a box-shadow, and an inline one would replace it.
    border: `2px solid ${look.frame}`,
  };
}

/** The patches under a board, where the game wears felt (`wearsFelt`); nothing for any other game. */
export function FeltUnderBoard({ appearance, variant, onChoose }: { appearance: Appearance; variant: RuleVariant; onChoose: (felt: Felt) => void }) {
  if (!wearsFelt(appearance, VARIANT_SPECS[variant])) return null;
  return <FeltPatches felt={appearance.felt} wood={appearance.boardTheme} onChoose={onChoose} />;
}
