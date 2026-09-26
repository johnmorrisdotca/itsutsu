"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { KUMIMOJI_TRADE } from "@/lib/puzzles/kumimoji/tiles.constants";

import { HAND_TILE_PX, TILE, TILE_CHOSEN, TRAY, tileLetterPx } from "./kumimoji.constants";

/** What each of the tray's presses may do now, and does. */
export type TrayPresses = {
  draw: { can: boolean; run: () => void };
  trade: { can: boolean; run: () => void };
  back: { can: boolean; run: () => void };
  allBack: { can: boolean; run: () => void };
};

/**
 * THE HAND, in a tray that stays on the screen: fixed to the bottom of a
 * phone, so the tiles are under the thumb however the table is panned, and
 * under the table from a tablet up. Its tiles are tapped to choose, or dragged
 * straight onto the table; a table tile dropped or sent here comes back to the
 * hand (`data-tray`).
 *
 * The presses under the hand: Draw the next tile (once the hand is used and
 * the grid is sound), Trade the chosen tile for three, send the chosen table
 * tile back to the hand, or all of them.
 */
export function KumimojiTray({
  hand,
  chosenAt,
  left,
  disabled,
  presses,
  onHandTile,
  onHandDown,
  onTray,
}: {
  hand: readonly string[];
  /** The hand tile chosen, by its place, or null. */
  chosenAt: number | null;
  /** Tiles still in the bag. */
  left: number;
  disabled: boolean;
  presses: TrayPresses;
  onHandTile: (at: number) => void;
  onHandDown: (at: number, letter: string, event: ReactPointerEvent) => void;
  /** A tap on the tray itself, not on a tile: where a chosen table tile is sent back. */
  onTray: () => void;
}) {
  return (
    <div
      className={TRAY}
      data-tray="true"
      data-testid="kumimoji-tray"
      onClick={(event) => {
        if (event.target === event.currentTarget || (event.target instanceof Element && event.target.closest("[data-hand-row]") === event.target)) onTray();
      }}
    >
      <div className="flex items-baseline justify-between text-xs text-muted">
        <span>
          Your hand <span className="font-mincho">手札</span>
        </span>
        <span className="tabular-nums" data-testid="kumimoji-bag" data-left={left}>
          {left} in the bag
        </span>
      </div>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5" data-hand-row="true" data-testid="kumimoji-hand" aria-label="Your hand">
        {hand.length === 0 ? (
          <span className="text-sm text-muted" data-testid="kumimoji-hand-empty">
            {left > 0 ? "Hand used." : "Every tile is out of the bag."}
          </span>
        ) : (
          hand.map((letter, at) => (
            <button
              key={`${at}-${letter}`}
              type="button"
              disabled={disabled}
              className={`${TILE} touch-none ${chosenAt === at ? TILE_CHOSEN : ""}`}
              style={{ width: HAND_TILE_PX, height: HAND_TILE_PX, fontSize: tileLetterPx(HAND_TILE_PX) }}
              onClick={() => onHandTile(at)}
              onPointerDown={(event) => onHandDown(at, letter, event)}
              data-testid="kumimoji-hand-tile"
              data-letter={letter}
              data-at={at}
              data-chosen={chosenAt === at ? "true" : undefined}
              aria-pressed={chosenAt === at}
              aria-label={`${letter.toUpperCase()} in your hand`}
            >
              {letter}
            </button>
          ))
        )}
      </div>
      {/* Four presses a quarter of the row each, so a phone keeps them on one line under the thumb. */}
      <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} px-2`} disabled={disabled || !presses.draw.can} onClick={presses.draw.run} data-testid="kumimoji-draw">
          Draw <span className="hidden font-mincho opacity-70 sm:inline">引く</span>
        </button>
        <button
          type="button"
          className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2`}
          disabled={disabled || !presses.trade.can}
          onClick={presses.trade.run}
          title={`Give the chosen tile back and take ${KUMIMOJI_TRADE.take}`}
          data-testid="kumimoji-trade"
        >
          Trade
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2`} disabled={disabled || !presses.back.can} onClick={presses.back.run} data-testid="kumimoji-back">
          To hand
        </button>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2`} disabled={disabled || !presses.allBack.can} onClick={presses.allBack.run} data-testid="kumimoji-all-back">
          All back
        </button>
      </div>
    </div>
  );
}
