"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { BOARD_SIZES, BOARD_SIZE_LIST, type BoardSize } from "@/lib/preferences/boardSize";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardFocus } from "@/components/board/BoardFocus";
import {
  BOARD_COLUMN,
  BOARD_COLUMN_SIZE,
  BOARD_FIT_BELOW_PX,
  BOARD_FIT_ROOM,
  BOARD_SIZE_LEGEND,
  BOARD_SIZE_WORDS,
} from "./live.constants";

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
 * The column a board is played in, and the four sizes it may be on a desk.
 *
 * Server-rendered at the size the account already holds, so a member who chose
 * Large sees Large on arrival rather than a small board that grows once React
 * attaches. A press changes the column at once — nothing waits on the network
 * to redraw — and then keeps the choice on the account with one request, the
 * same `PATCH /api/me` the turn settings use. That is one call per press and
 * none otherwise: nothing here runs on a timer or on a render.
 *
 * NOBODY TO KEEP IT FOR, NOTHING SENT. A visitor watching a game has no account,
 * so the size they pick lasts for the page. Asking the server would only be
 * told no.
 *
 * THE CHOOSER IS NOT SHOWN BELOW A LAPTOP'S WIDTH, for the reason the setting is
 * not applied there: a phone's board is already the phone. A control that
 * changed nothing on the screen it was pressed on would be a promise it could
 * not keep.
 */
export function BoardColumn({
  initial,
  remember,
  children,
}: {
  /** The size the account holds, read by the page with the rest of its preferences. */
  initial: BoardSize;
  /** Whether there is an account to keep a new choice on. */
  remember: boolean;
  children: ReactNode;
}) {
  const [size, setSize] = useState<BoardSize>(initial);
  const hydrated = useHydrated();
  const column = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<number | null>(null);

  /*
   * On arrival, on a change to Fit, and when the window changes size — and at
   * no other time. Not a timer and not an observer of the content, for the
   * reason `roomFor` gives: a board that re-measured itself as banners came
   * and went would change size in the middle of a move.
   */
  useEffect(() => {
    if (size !== BOARD_SIZES.fit) return;
    const measure = () => {
      if (column.current !== null) setRoom(roomFor(column.current));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [size]);

  function choose(next: BoardSize) {
    setSize(next);
    if (!remember) return;
    /*
     * Kept, not awaited. The board has already changed, which is the whole of
     * what the reader asked for; a failure to remember it costs them the
     * choice at the NEXT desk, not this one, and is not worth an error in the
     * middle of a game.
     */
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { boardSize: next } }),
    }).catch(() => {});
  }

  return (
    <div
      ref={column}
      className={`${BOARD_COLUMN} ${BOARD_COLUMN_SIZE[size]}`}
      style={room === null ? undefined : ({ [BOARD_FIT_ROOM]: `${room}px` } as CSSProperties)}
      data-testid="board-column"
      data-board-column
      /*
        Its width is the board's, square and sized to the screen, and the text
        in it (whose turn it is, the size chooser) is the board's furniture.
      */
      data-width-reason="the column is as wide as the board, which is square and fitted to the screen"
      data-board-size={size}
      /*
       * The chooser is a real radio group before React attaches, and a press
       * in that window is dropped with nothing to say so. A spec waits on this.
       */
      {...readyMark(hydrated)}
    >
      {/* Furniture in just-the-board mode, which sizes the board to the screen itself. */}
      <fieldset data-chrome className="hidden items-center justify-end gap-1 self-end lg:flex" data-testid="board-scale">
        <legend className="sr-only">{BOARD_SIZE_LEGEND}</legend>
        <span className="mr-1 text-xs text-muted" aria-hidden="true">
          {BOARD_SIZE_LEGEND}
        </span>
        {BOARD_SIZE_LIST.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-md border border-rule px-2 py-0.5 text-xs text-ink-soft hover:border-rule-strong has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-moss"
            title={BOARD_SIZE_WORDS[option].whole}
            data-testid="board-scale-option"
            data-size={option}
          >
            <input
              type="radio"
              name="board-scale"
              value={option}
              checked={size === option}
              onChange={() => choose(option)}
              className="sr-only"
              aria-label={BOARD_SIZE_WORDS[option].whole}
            />
            <span aria-hidden="true">{BOARD_SIZE_WORDS[option].short}</span>
          </label>
        ))}
      </fieldset>
      {/* The board and the controls for the move being made, openable on their own (`BoardFocus`); under the size chooser, so its button sits on the board's box and not on the chooser. */}
      <BoardFocus label="this game" layout="flex w-full flex-col gap-2">
        {children}
      </BoardFocus>
    </div>
  );
}
