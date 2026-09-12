"use client";

import { useEffect, useSyncExternalStore } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { BARE_ATTRIBUTE, readBare, subscribeBare, writeBare } from "./bare";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * The switch for reading a page as the board alone, and the thing that
 * actually applies it.
 *
 * The attribute goes on the root element rather than on this component's own
 * markup, because what it hides — the masthead, the side matter, the footer —
 * is all around it rather than inside it, and a stylesheet is the honest way
 * to say "not this, not that" about furniture somebody else's component
 * renders. See globals.css.
 *
 * The switch stays put when the rest goes, because a mode you cannot leave is
 * a trap: bare, it is the only control on the page.
 */
export function BareBoard() {
  const bare = useSyncExternalStore(subscribeBare, readBare, () => false);

  useEffect(() => {
    const root = document.documentElement;
    if (bare) root.setAttribute(BARE_ATTRIBUTE, "true");
    else root.removeAttribute(BARE_ATTRIBUTE);
  }, [bare]);

  return (
    <div
      className={
        bare
          ? "fixed right-3 bottom-3 z-50 print:hidden"
          : "flex justify-end print:hidden"
      }
      data-testid="bare-board"
      {...readyMark(useHydrated())}
    >
      <button
        type="button"
        onClick={() => writeBare(!bare)}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} ${bare ? "opacity-60 hover:opacity-100" : ""}`}
        aria-pressed={bare}
        data-testid="bare-board-toggle"
        title={
          bare
            ? "Bring back the masthead, the panels and the footer"
            : "Read this page as the board and the moves alone"
        }
      >
        {bare ? "Show the page" : "Just the board"}
      </button>
    </div>
  );
}
