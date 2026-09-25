"use client";

import { useEffect, useRef } from "react";

/** Room left between the play and the edge of the screen. */
const MARGIN = 8;

/**
 * THE ROW BEING TYPED AND THE KEYS BOTH ON THE SCREEN WHILE A WORD IS TYPED.
 * John, 2026-09-25, on an iPhone, the board at full width and the keys under
 * it: "Why don't we see the chars we type?" — the row being typed had gone
 * above the top while the keys filled the view.
 *
 * The whole board and the whole keyboard do not fit one phone screen together
 * (at 390×664 they are about 720 pixels), so the page keeps the two that
 * matter: the row being typed, and the keys under it, which always fit. It is
 * moved just enough, on the first key the player types, to bring whichever is
 * off the screen on to it — never the row above the top to show the keys —
 * and after that nothing moves while they type; only if they scroll the play
 * away and type again does it come back. Arriving on the page moves nothing:
 * `engaged` is false until the first key.
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
    // The row being typed: the first row no guess has marked. A finished board has none, and the board's top stands in.
    const live = [...board.querySelectorAll<HTMLElement>('[data-testid="word-tile"]')].find((tile) => tile.dataset.mark === "typed" || tile.dataset.mark === "empty");
    const top = (live ?? board).getBoundingClientRect().top;
    const keysShown = keys !== null && keys.offsetParent !== null;
    const bottom = (keysShown ? keys : board).getBoundingClientRect().bottom;
    let by = 0;
    // Below the screen: up just enough to show the bottom, never the row being typed above the top.
    if (bottom > window.innerHeight - MARGIN) by = Math.min(bottom - window.innerHeight + MARGIN, Math.max(0, top - MARGIN));
    // Above it: down to the row being typed.
    else if (top < MARGIN) by = top - MARGIN;
    if (by !== 0) window.scrollBy({ top: by, behavior: "instant" });
  }, [engaged, watch]);
  return root;
}
