"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type ToggleEvent } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * A ROW'S LESSER ACTIONS, BEHIND ONE SMALL "⋯" BUTTON. The players list keeps
 * buddy and ignore here (`RowMore`), and My games keeps Resign here (John,
 * 2026-09-26: "Resignation and any other button should be in a Settings
 * menu"), so a row's plain-sight button is what the reader came for and the
 * rest are a press away.
 *
 * A DISCLOSURE, BUILT ON THE BROWSER'S OWN POPOVER. The button names what it
 * opens and whose it is, says whether it is open (`aria-expanded`) and points at
 * what it controls. The list is the browser's top layer, so a table that
 * scrolls inside its own box cannot clip it; Escape and a press anywhere else
 * close it, and it opens beside the button with focus on its first control. It
 * closes again the moment the row it is about moves — the page or the table
 * scrolled, or the window changed size — rather than float away from it. It is
 * never wider than the room left of its button, so a question asked inside it
 * (`ConfirmButton`) wraps there, 8px clear of the screen's edge.
 */
export function RowMenu({
  label,
  title,
  face,
  className = "",
  testId = "row-more",
  children,
}: {
  /** What the button says to a screen reader: what it opens, and whose. */
  label: string;
  title: string;
  /** What the button shows; "⋯" unless a row has more to say on it (a buddy's star). */
  face?: ReactNode;
  className?: string;
  /** The button's test id; the list is `<testId>-menu`. */
  testId?: string;
  children: ReactNode;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  /** Where the button stood, and how big the window was, when the list was placed beside it. */
  const placedAt = useRef<{ top: number; right: number; width: number; height: number } | null>(null);

  /* Beside the button, right-aligned to it, and above it where the viewport has no room below. */
  function place() {
    const button = trigger.current;
    const list = menu.current;
    if (button === null || list === null) return;
    const at = button.getBoundingClientRect();
    placedAt.current = { top: at.top, right: at.right, width: window.innerWidth, height: window.innerHeight };
    const right = Math.max(8, window.innerWidth - at.right);
    list.style.right = `${right}px`;
    // No wider than the room to the button's left, less a margin: a question opened inside wraps rather than touching the edge.
    list.style.maxWidth = `${window.innerWidth - right - 8}px`;
    if (window.innerHeight - at.bottom < 140) {
      list.style.top = "auto";
      list.style.bottom = `${window.innerHeight - at.top + 4}px`;
    } else {
      list.style.bottom = "auto";
      list.style.top = `${at.bottom + 4}px`;
    }
  }

  function onBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    if (event.newState === "open") place();
  }

  function onToggle(event: ToggleEvent<HTMLDivElement>) {
    const nowOpen = event.newState === "open";
    setOpen(nowOpen);
    if (nowOpen) menu.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!open) return;
    /*
     * CLOSED WHEN THE ROW HAS MOVED, NOT WHENEVER A SCROLL EVENT ARRIVES.
     *
     * A browser fires a scroll's event when it next renders, not when the scroll
     * happens. Pressing a button that sits half below the fold scrolls it into view
     * first, and a browser rendering late — CI's runner, at 1280px, where a hundred
     * names above the table put the row at the foot of the window — delivered that
     * scroll's event after the list had opened and this had begun listening. The
     * list shut the instant it appeared, and row-actions.spec.ts failed there in
     * light and dark while passing on every development database.
     *
     * So each scroll or resize asks whether the button still stands where the list
     * was placed beside it, and in a window of the same size. The press's own
     * scroll was already applied when `place` measured, so its late event finds
     * nothing moved; a scroll a reader makes with the list open moves the row and
     * still closes it.
     */
    const close = () => {
      const button = trigger.current;
      const was = placedAt.current;
      if (button === null || was === null) return;
      const at = button.getBoundingClientRect();
      const moved =
        Math.abs(at.top - was.top) > 0.5 ||
        Math.abs(at.right - was.right) > 0.5 ||
        window.innerWidth !== was.width ||
        window.innerHeight !== was.height;
      if (moved) menu.current?.hidePopover();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        popoverTarget={id}
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={title}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} min-w-8 px-2 py-1 text-xs ${className}`}
        data-testid={testId}
        data-open={open ? "true" : "false"}
        {...readyMark(hydrated)}
      >
        {face ?? <span aria-hidden="true">⋯</span>}
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        role="group"
        aria-label={label}
        onBeforeToggle={onBeforeToggle}
        onToggle={onToggle}
        /*
          NO `display` ON THIS ELEMENT. The browser hides a closed popover with
          `display: none`, and a `flex` class here overrode it: every row's closed
          menu was drawn in the page as a fixed box, over the rows and past the
          edge of a narrow screen, where it took the press meant for Play and
          made the whole page scroll sideways. The layout lives on the div inside.
        */
        className="inset-auto m-0 rounded-xl border border-rule-strong/80 bg-ivory p-1.5 text-ink shadow-lg"
        data-testid={`${testId}-menu`}
      >
        <div className="flex flex-col items-stretch gap-1">{children}</div>
      </div>
    </>
  );
}
