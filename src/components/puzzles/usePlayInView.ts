"use client";

import { useEffect, useRef } from "react";

/** Room left between the play and the edge of the screen. */
const MARGIN = 8;

/**
 * THE BOARD AND THE KEYS BOTH ON THE SCREEN WHILE A WORD IS TYPED. John,
 * 2026-09-25, on an iPhone, the board at full width and the keys under it:
 * "Why don't we see the chars we type?" — the row being typed had gone above
 * the top while the keys filled the view.
 *
 * On a phone the full-width board and the whole keyboard fit one screen once
 * the site's header is scrolled past, so the page is moved just enough, once,
 * the first time the player types: the keys' bottom to the screen's, never the
 * board's top above it. After that nothing moves while they type, because it
 * is all in view; only if they scroll it away and type again does it come back.
 * Arriving on the page moves nothing: `engaged` is false until the first key.
 *
 * `watch` changes on every edit; the check is cheap and does nothing when the
 * play is already in view.
 */
export function usePlayInView(engaged: boolean, watch: unknown): React.RefObject<HTMLElement | null> {
  const root = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!engaged || root.current === null) return;
    const board = root.current.querySelector<HTMLElement>('[data-testid="puzzle-grid"]');
    if (board === null) return;
    const keys = root.current.querySelector<HTMLElement>('[data-testid="word-keys-box"]');
    const top = board.getBoundingClientRect().top;
    const keysShown = keys !== null && keys.offsetParent !== null;
    const bottom = (keysShown ? keys : board).getBoundingClientRect().bottom;
    let by = 0;
    // Below the screen: up just enough to show the bottom, never past the board's top.
    if (bottom > window.innerHeight - MARGIN) by = Math.min(bottom - window.innerHeight + MARGIN, Math.max(0, top - MARGIN));
    // Above it: down to the board's top.
    else if (top < 0) by = top - MARGIN;
    if (by !== 0) window.scrollBy({ top: by, behavior: "instant" });
  }, [engaged, watch]);
  return root;
}
