"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// The page's own width: a board opened on its own is as wide as the page it came from.
import { PAGE_WIDTH } from "@/components/layout/pageWidth.constants";
import { FOCUS_RING } from "@/components/ui/ui.constants";

import { BoardMasthead } from "./BoardMasthead";
import type { BoardStory } from "./board.types";

/**
 * ANY BOARD, OPENED ON ITS OWN. John, 2026-09-25, on /famous with one game's
 * board, scrubber and moves open among a page of cards: "we should be able to
 * mouse over the Container holding the Board, Scrubber, controls and there
 * should be a small button that allows us to Make only that Board/Controls a
 * Modal to view without distractions."
 *
 * A small ⤢ in the box's corner, shown on hover (and always on a phone, which
 * has no hover), makes THIS box the modal: the same elements, fixed over the
 * page on a dimmed backdrop, the board as large as the screen allows
 * (globals.css, `data-board-focus`). Open, the box is drawn at the top of the
 * document (a portal), because a card's blur or transform makes a fixed box
 * inside it fixed to the card rather than the screen. The state it shows lives
 * in the component around it — the replay's index, the game's session — so the
 * scrubber stays where it was, a move being made stays made, and closing puts
 * the box back as it was. Esc and Close leave, and the page behind
 * does not scroll meanwhile. Every board a reader looks at sits inside one:
 * a famous game, a finished game, the practice board and a live game's column.
 *
 * Unlike "Just the board", which strips the whole page and is remembered, this
 * is one board, for now, and forgotten when closed.
 */
export function BoardFocus({
  children,
  story,
  label = "this board",
  layout = "",
}: {
  children: ReactNode;
  /** What the board is and whose game it is, for the header drawn over it when open (`BoardMasthead`). */
  story: BoardStory;
  label?: string;
  /** The box's own layout while it sits in the page, for a parent that lays its children out ("flex flex-col gap-2"). */
  layout?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // The page behind holds still while the board is open over it.
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("dialog[open]") !== null) return;
      // After every other listener has had the key, so a card or toast over the board closes first.
      window.setTimeout(() => {
        if (!event.defaultPrevented) setOpen(false);
      }, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const box = (
    <div
      className={open ? "fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/60 p-2 sm:p-6" : `group/focus relative ${layout}`.trim()}
      data-board-focus={open ? "open" : "closed"}
      data-testid="board-focus"
    >
      <div
        className={open ? `relative mx-auto flex w-full ${PAGE_WIDTH} flex-col gap-3 rounded-xl bg-paper p-3 shadow-2xl sm:p-5` : "contents"}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? `${label}, on its own` : undefined}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-pressed={open}
          aria-label={open ? "Close, back to the page" : `Open ${label} on its own`}
          title={open ? "Close (Esc)" : `Open ${label} on its own`}
          className={`${FOCUS_RING} absolute z-10 inline-flex items-center gap-1 rounded-md border border-rule-strong bg-paper/90 px-2 py-1 text-xs text-ink-soft shadow-sm transition-opacity hover:text-ink ${
            open ? "top-2 right-2 sm:top-3 sm:right-3" : "top-1 right-1 opacity-0 group-hover/focus:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
          }`}
          data-testid="board-focus-toggle"
        >
          {open ? (
            <>
              <span aria-hidden="true">×</span> Close <span className="text-muted">Esc</span>
            </>
          ) : (
            <span aria-hidden="true">⤢</span>
          )}
        </button>
        {/* Open, a small header says what this is and whose game it is; its right side keeps room for Close. */}
        {open ? (
          <div className="pr-28">
            <BoardMasthead story={story} />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
  // Open, drawn at the top of the document; the place it left keeps a marker, so the page does not know it moved.
  if (open) {
    return (
      <>
        <div className={layout} data-testid="board-focus-away" />
        {createPortal(box, document.body)}
      </>
    );
  }
  return box;
}
