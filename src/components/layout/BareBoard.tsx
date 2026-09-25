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
 * a trap: bare, it is the modal's Close, at the screen's top right where a
 * modal's close is looked for, and Esc does the same.
 */
export function BareBoard() {
  const bare = useSyncExternalStore(subscribeBare, readBare, () => false);

  useEffect(() => {
    const root = document.documentElement;
    if (bare) root.setAttribute(BARE_ATTRIBUTE, "true");
    else root.removeAttribute(BARE_ATTRIBUTE);
    // Read bare, the column is a modal's panel (globals.css), and says so to a screen reader.
    const panel = document.querySelector("main[data-strippable]");
    if (panel === null) return;
    if (bare) {
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Just the board");
    } else {
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      panel.removeAttribute("aria-label");
    }
  }, [bare]);

  /*
   * Esc leaves, as it leaves every modal. John: "ESC key should take us out."
   * Only the top layer closes on one press: a result card, a toast or an open
   * dialog over the board takes the Esc, and the next one leaves. Which
   * listener hears the key first depends on the order they were added, so this
   * one looks after every listener has had it, and leaves only if none of them
   * claimed it; a native dialog closes itself after the key, so it is asked
   * about while the key is still down.
   */
  useEffect(() => {
    if (!bare) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("dialog[open]") !== null) return;
      window.setTimeout(() => {
        if (!event.defaultPrevented) writeBare(false);
      }, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bare]);

  return (
    <div
      className={
        bare
          ? "fixed top-2 right-2 z-50 print:hidden"
          : "flex justify-end print:hidden"
      }
      data-testid="bare-board"
      {...readyMark(useHydrated())}
    >
      <button
        type="button"
        onClick={() => writeBare(!bare)}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} ${bare ? "bg-paper shadow-md" : ""}`}
        aria-pressed={bare}
        data-testid="bare-board-toggle"
        title={
          bare
            ? "Close, and bring back the rest of the page (Esc)"
            : "Read this page as the board and the moves alone"
        }
      >
        {bare ? (
          <>
            <span aria-hidden="true">× </span>Close <span className="ml-1 text-xs text-muted">Esc</span>
          </>
        ) : (
          "Just the board"
        )}
      </button>
    </div>
  );
}
