"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardFocus } from "@/components/board/BoardFocus";
import type { BoardStory } from "@/components/board/board.types";
import { BOARD_COLUMN, BOARD_COLUMN_FIT, BOARD_FIT_BELOW_PX, BOARD_FIT_ROOM } from "./live.constants";

/**
 * How wide the column may be for its board to END at the bottom of the screen.
 *
 * FIT HAS TO BE MEASURED, because what sits above the board is not a constant:
 * the masthead, this chooser, whose turn it is, a paused notice, the opener's
 * Swap, "Turn the board round". A figure written into the stylesheet was a
 * guess — 13rem — and on a 900px laptop the board ran 340px off the bottom.
 *
 * The board is the widest drawing in its column, which is what finds it here
 * without reaching into `Board`, whose files decide every picture on the site
 * and are under the screenshot gate. What is below the board — the Submit row a
 * placed stone brings up — is given a fixed allowance instead of being
 * measured, because it comes and goes DURING a game: measuring it would shrink
 * the board under somebody's finger the moment they placed a stone.
 *
 * Null where there is nothing to measure yet, and the stylesheet's own
 * approximation stands until there is.
 */
function roomFor(column: HTMLElement): number | null {
  let board: Element | null = null;
  let widest = 0;
  for (const drawing of column.querySelectorAll("svg")) {
    const width = drawing.getBoundingClientRect().width;
    if (width > widest) {
      widest = width;
      board = drawing;
    }
  }
  if (board === null) return null;
  const top = board.getBoundingClientRect().top + window.scrollY;
  const drawn = board.getBoundingClientRect();
  // The column is wider than the drawing by the row labels' gutter and the frame.
  const margin = column.getBoundingClientRect().width - drawn.width;
  return Math.round(window.innerHeight - top - BOARD_FIT_BELOW_PX + margin);
}

/**
 * The column a live board is played in, fitted to the screen on a desk.
 *
 * This is the board's Regular size (`BoardScale`): as wide as lets it end at
 * the bottom of the screen, beside the side matter. Large and Full are chosen
 * on the play around it, which takes this column's cap off
 * (`data-scale-board`) and gives the play a width of its own; the column
 * itself no longer offers sizes, so there is one chooser on every board page
 * and it is always in the same place.
 */
export function BoardColumn({
  story,
  children,
}: {
  /** What the game is, for the header over the board opened on its own (`BoardMasthead`). */
  story: BoardStory;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const column = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<number | null>(null);

  /*
   * On arrival and when the window changes size — and at no other time. Not a
   * timer and not an observer of the content, for the reason `roomFor` gives:
   * a board that re-measured itself as banners came and went would change size
   * in the middle of a move.
   */
  useEffect(() => {
    const measure = () => {
      if (column.current !== null) setRoom(roomFor(column.current));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={column}
      className={`${BOARD_COLUMN} ${BOARD_COLUMN_FIT}`}
      style={room === null ? undefined : ({ [BOARD_FIT_ROOM]: `${room}px` } as CSSProperties)}
      data-testid="board-column"
      data-board-column
      // The column Large and Full widen (`BoardScale`), with what must stay in reach under a live board.
      data-scale-board
      data-scale-below={BOARD_FIT_BELOW_PX}
      /*
        Its width is the board's, square and sized to the screen, and the text
        in it (whose turn it is) is the board's furniture.
      */
      data-width-reason="the column is as wide as the board, which is square and fitted to the screen"
      {...readyMark(hydrated)}
    >
      {/* The board and the controls for the move being made, openable on their own (`BoardFocus`). */}
      <BoardFocus label="this game" layout="flex w-full flex-col gap-2" story={story}>
        {children}
      </BoardFocus>
    </div>
  );
}
