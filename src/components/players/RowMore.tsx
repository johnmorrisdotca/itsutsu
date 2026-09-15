"use client";

import { useEffect, useId, useRef, useState, type ToggleEvent } from "react";

import { BuddyButton } from "@/components/mine/BuddyButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { RowMoreProps } from "./recordTable.types";

/**
 * A ROW'S LESSER ACTIONS, BEHIND ONE SMALL BUTTON: buddy, and ignore.
 *
 * The members list put all three controls — ☆ Buddy, Ignore, Challenge — at the
 * end of every row, and the row could not hold them: at 1280 the table wanted
 * 1,199 pixels in a box of 1,118, so "Challenge" ran 81 pixels past the edge of
 * every line and read "Challe…" (768: 529 past; 400: 865). Every earlier answer
 * found the room somewhere else — a narrower JOINED, a wider page — and each was
 * spent by the next column or the next long name.
 *
 * So a row does what a games site's list of players does: the offer of a game
 * stays in plain sight, because it is what a reader came to the list for, and the
 * rest sit behind "⋯" beside it. Both are still one press and a press away; the
 * row asks for half the width, and the whole table fits at 1280 again.
 *
 * A DISCLOSURE, BUILT ON THE BROWSER'S OWN POPOVER. The button names what it opens
 * and whose it is, says whether it is open (`aria-expanded`) and points at what it
 * controls. The list is the browser's top layer, so a table that scrolls inside its
 * own box cannot clip it; Escape and a press anywhere else close it, and it opens
 * beside the button with focus on its first control. It closes again the moment
 * the row it is about moves — the page or the table scrolled, or the window
 * changed size — rather than float away from it.
 *
 * The same `BuddyButton` and `IgnoreButton` as everywhere else, so what a buddy is
 * called cannot drift. A buddy is still marked on the row itself — a star on the
 * button — because who is your buddy is a fact about the row, not an action.
 */
export function RowMore({ memberId, name, isBuddy, ignoring }: RowMoreProps) {
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
    list.style.right = `${Math.max(8, window.innerWidth - at.right)}px`;
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

  const state = `${isBuddy ? ", your buddy" : ""}${ignoring ? ", ignored" : ""}`;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        popoverTarget={id}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`More for ${name}${state}`}
        title={`Buddy or ignore ${name}`}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} min-w-8 px-2 py-1 text-xs ${ignoring ? "text-shu" : ""}`}
        data-testid="row-more"
        data-open={open ? "true" : "false"}
        {...readyMark(hydrated)}
      >
        {isBuddy ? <span aria-hidden="true">★</span> : null}
        <span aria-hidden="true">⋯</span>
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        role="group"
        aria-label={`More for ${name}`}
        onBeforeToggle={onBeforeToggle}
        onToggle={onToggle}
        /*
          NO `display` ON THIS ELEMENT. The browser hides a closed popover with
          `display: none`, and a `flex` class here overrode it: every row's closed
          menu was drawn in the page as a fixed box, over the rows and past the
          edge of a narrow screen, where it took the press meant for Challenge and
          made the whole page scroll sideways. The layout lives on the div inside.
        */
        className="inset-auto m-0 rounded-xl border border-rule-strong/80 bg-ivory p-1.5 text-ink shadow-lg"
        data-testid="row-more-menu"
      >
        <div className="flex flex-col items-stretch gap-1">
          <BuddyButton memberId={memberId} isBuddy={isBuddy} />
          <IgnoreButton memberId={memberId} ignoring={ignoring} />
        </div>
      </div>
    </>
  );
}
