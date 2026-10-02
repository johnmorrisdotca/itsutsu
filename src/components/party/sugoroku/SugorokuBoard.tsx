"use client";

import { useMemo, useSyncExternalStore, type MouseEvent } from "react";

import { boardPoint, type Position, type Side, type VariantSpec } from "@johnmorrisdotca/sugoroku";
import { SUGOROKU_STYLE, drawSugoroku } from "@johnmorrisdotca/sugoroku/draw";

import type { Appearance } from "@/components/board/board.types";
import { BoardFrame } from "@/components/board/BoardFrame";
import { tableTheme } from "@/components/puzzles/KumimojiTable";

import { SUGOROKU_LANDSCAPE, SUGOROKU_STAND_UP_BELOW_PX } from "./sugoroku.constants";
import type { SugorokuHighlight, SugorokuShownDice } from "./sugoroku.types";

/** A phone's width, where the board stands up: a media query, so it follows the window and never reads one in render. */
const NARROW = `(max-width: ${SUGOROKU_STAND_UP_BELOW_PX - 1}px)`;

function subscribeNarrow(listener: () => void): () => void {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Whether the window is a phone's width: the board stands up there, as the package's own "auto" does. */
export function useStandingUp(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

/** The own number of the point on the board that was pressed, for the side to move; the bar is 25 and off the board 0; null for anything else. */
function ownOf(target: Element, spec: VariantSpec, side: Side): number | null {
  const bar = target.closest("[data-bar]");
  if (bar !== null) return bar.getAttribute("data-bar") === side ? 25 : null;
  const tray = target.closest("[data-tray]");
  if (tray !== null) return tray.getAttribute("data-tray") === side ? 0 : null;
  const point = target.closest("[data-board]");
  if (point === null) return null;
  const board = Number(point.getAttribute("data-board"));
  for (let own = 1; own <= 24; own += 1) if (boardPoint(spec, side, own) === board) return own;
  return null;
}

/**
 * THE BACKGAMMON BOARD, ON THE SITE'S OWN BOARD. "Every board is the same
 * board" (AGENTS.md): the wood, the rim and the shadow are `BoardFrame`'s, in
 * the reader's own board or the felt they chose (`tableTheme`), with no
 * coordinates; inside, Sugoroku's drawing (`drawSugoroku`, the package's
 * SVG), whose own frame and felt are left clear so the cloth under them is the
 * table's. The wood keeps one shape for a game and one for a phone: the box
 * is the same size whatever is on the board, with or without dice and cube,
 * so a page never shifts as the game goes on, and it stands up on a phone
 * (`useStandingUp`) as the package's own "auto" does.
 *
 * It draws and listens and decides nothing: a press is told to the page as
 * the own number of the point pressed, for the side to move, and the page
 * asks the rules what it means (`useSugorokuTurn`).
 */
export function SugorokuBoard({
  position,
  variant,
  view,
  mover,
  cube,
  dice,
  highlight,
  numbers = true,
  appearance,
  label,
  onPress,
}: {
  position: Position;
  variant: VariantSpec;
  /** Whose home board is at the bottom. */
  view: Side;
  /** The side whose presses count, or null where nobody may press. */
  mover: Side | null;
  cube: { value: number; owner: Side | null } | null;
  dice: SugorokuShownDice | null;
  highlight: SugorokuHighlight | null;
  numbers?: boolean;
  appearance: Appearance;
  label: string;
  onPress?: (own: number | null) => void;
}) {
  const standing = useStandingUp();
  const theme = tableTheme(appearance);
  const svg = useMemo(
    () =>
      drawSugoroku(position, {
        variant,
        view,
        orientation: standing ? "portrait" : "landscape",
        numbers,
        cube,
        dice,
        highlight,
        label,
        // The frame and the felt are the table's: the wood or the cloth `BoardFrame` draws shows through.
        colours: { frame: "transparent", felt: "transparent" },
      }),
    [position, variant, view, standing, numbers, cube, dice, highlight, label],
  );
  const { width, height } = SUGOROKU_LANDSCAPE;
  const press = (event: MouseEvent<HTMLDivElement>) => {
    if (onPress === undefined || mover === null) return;
    onPress(ownOf(event.target as Element, variant, mover));
  };
  return (
    <BoardFrame size={standing ? height : width} rows={standing ? width : height} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false}>
      <style>{SUGOROKU_STYLE}</style>
      <div
        // Important, because the package's own stylesheet is unlayered and says `height: auto`, which beats a layered utility: without it a board with no cube
        // (900 wide in a 976 box) was drawn at the box's width, taller than the box, and its bottom row was cut off.
        className="absolute inset-0 select-none [&>svg]:h-full! [&>svg]:w-full!"
        onClick={press}
        data-testid="sugoroku-board"
        data-orientation={standing ? "portrait" : "landscape"}
        data-movable={highlight?.movable?.join(",") ?? ""}
        data-targets={highlight?.targets?.join(",") ?? ""}
        data-from={highlight?.from ?? ""}
        // The package's own drawing: SVG text built from the position's numbers, its label escaped by the package. No name or record is put in it by hand.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </BoardFrame>
  );
}
