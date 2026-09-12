"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { XpToast, type XpToastHold } from "./XpToast";
import {
  XP_TOAST_COLLAPSE_MS,
  XP_TOAST_COPY as copy,
  XP_TOAST_ENTER_MS,
  XP_TOAST_ENTER_STAGGER_MS,
  XP_TOAST_GAP,
  XP_TOAST_LEAVE_MS,
  XP_TOAST_STYLE as style,
} from "./xp.constants";
import type { XpToastHostProps } from "./xp.types";
import {
  admit,
  announcement,
  beginLeaving,
  drop,
  dwellFor,
  EMPTY_QUEUE,
  onScreen,
  resumeAfter,
  type XpToastEntry,
  type XpToastQueue,
} from "./xpToastQueue";

/** One shown toast's time left, and what is holding it still. */
type Clock = { timer: number | null; deadline: number; remaining: number; holds: Set<XpToastHold> };

/** The timings, handed to the CSS so they are stated once, in xp.constants. */
const DURATIONS = {
  "--xp-toast-enter": `${XP_TOAST_ENTER_MS}ms`,
  "--xp-toast-leave": `${XP_TOAST_LEAVE_MS}ms`,
  "--xp-toast-collapse": `${XP_TOAST_COLLAPSE_MS}ms`,
  "--xp-toast-gap": XP_TOAST_GAP,
} as CSSProperties;

/**
 * The points a player just earned, dropping in from the top of the page.
 *
 * Mount it once, hand it the awards, and it does the rest: each arrives,
 * stays long enough to be read, and goes — by tap, by Escape, or by time.
 * It stacks, because a game that ends can pay for a win, a streak and a
 * first-at-this-game together, and one slot would show the last of them or
 * flicker between all three at exactly the moment there was most to say.
 *
 * The rules of the stack are `xpToastQueue.ts`, pure and tested; this file
 * is the clocks and the pixels. Newest at the BOTTOM: the toast somebody is
 * reading never moves under their eyes, a batch reads top to bottom in the
 * order it was earned, and the stack drains from the top the way the
 * reference does.
 */
export function XpToastHost({ items, onDismiss }: XpToastHostProps) {
  const [queue, setQueue] = useState<XpToastQueue>(EMPTY_QUEUE);
  /*
   * New awards are taken in during render, the way React says to derive
   * state from a prop: `admit` hands back the same queue when nothing is
   * new, so this settles in one extra render and cannot loop.
   */
  const admitted = admit(queue, items);
  if (admitted !== queue) setQueue(admitted);
  const shown = onScreen(admitted);

  const speaker = useSpeaker();
  const ready = useHydrated();

  const clocks = useRef(new Map<string, Clock>());
  const leaving = useRef(new Map<string, number>());
  const latestOnDismiss = useRef(onDismiss);
  useEffect(() => {
    latestOnDismiss.current = onDismiss;
  }, [onDismiss]);

  /** Takes a toast off: fade, then the gap closes, then it is gone and the caller told. */
  const dismiss = useCallback((id: string) => {
    const clock = clocks.current.get(id);
    if (clock !== undefined && clock.timer !== null) window.clearTimeout(clock.timer);
    clocks.current.delete(id);
    if (leaving.current.has(id)) return;
    setQueue((held) => beginLeaving(held, id));
    leaving.current.set(
      id,
      window.setTimeout(() => {
        leaving.current.delete(id);
        setQueue((held) => drop(held, id));
        latestOnDismiss.current?.(id);
      }, XP_TOAST_LEAVE_MS + XP_TOAST_COLLAPSE_MS),
    );
  }, []);

  /** Sets a clock running for what it has left. */
  const run = useCallback(
    (id: string, clock: Clock) => {
      const wait = resumeAfter(clock.remaining);
      clock.deadline = Date.now() + wait;
      clock.timer = window.setTimeout(() => dismiss(id), wait);
    },
    [dismiss],
  );

  /** Stops a toast's clock for a reason; it stays stopped until every reason is gone. */
  const hold = useCallback((id: string, why: XpToastHold) => {
    const clock = clocks.current.get(id);
    if (clock === undefined) return;
    clock.holds.add(why);
    if (clock.timer === null) return;
    window.clearTimeout(clock.timer);
    clock.timer = null;
    clock.remaining = Math.max(clock.deadline - Date.now(), 0);
  }, []);

  const release = useCallback(
    (id: string, why: XpToastHold) => {
      const clock = clocks.current.get(id);
      if (clock === undefined) return;
      clock.holds.delete(why);
      if (clock.holds.size === 0 && clock.timer === null) run(id, clock);
    },
    [run],
  );

  /*
   * A clock for every toast on screen that has none yet. One that is waiting
   * for a slot is not on screen, so its time starts when it steps in — and
   * one that arrives while the tab is hidden waits, unseen, for the tab.
   */
  useEffect(() => {
    for (const entry of shown) {
      const id = entry.item.id;
      if (entry.phase !== "shown" || clocks.current.has(id)) continue;
      const clock: Clock = {
        timer: null,
        deadline: 0,
        remaining: dwellFor(entry.item, entry.index),
        holds: new Set(document.visibilityState === "hidden" ? ["hidden"] : []),
      };
      clocks.current.set(id, clock);
      if (clock.holds.size === 0) run(id, clock);
    }
  });

  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      for (const id of Array.from(clocks.current.keys())) {
        if (hidden) hold(id, "hidden");
        else release(id, "hidden");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [hold, release]);

  /* Nothing outlives the host. */
  useEffect(() => {
    const held = clocks.current;
    const going = leaving.current;
    return () => {
      for (const clock of held.values()) if (clock.timer !== null) window.clearTimeout(clock.timer);
      for (const timer of going.values()) window.clearTimeout(timer);
      held.clear();
      going.clear();
    };
  }, []);

  const said = (entry: XpToastEntry) =>
    announcement(entry.item.points, speaker.pairName(entry.item.label, entry.item.kanji).text, entry.item.level);

  return (
    <>
      {/*
        The announcer is always in the tree and never seen. A live region only
        speaks for changes made AFTER it exists: one created with its first
        toast already inside says nothing — and since awards come in bursts
        minutes apart, nearly every burst would be a first. So this one-pixel
        node stays, empty, and each toast adds its line as it shows. Polite,
        not assertive: interrupting somebody mid-move to read them a number is
        not a courtesy.
      */}
      <div role="status" className="sr-only" data-testid="xp-toast-announcer">
        {shown.map((entry) => (
          <p key={entry.item.id}>{said(entry)}</p>
        ))}
      </div>
      {shown.length === 0 ? null : (
        <ol
          aria-label={copy.region}
          className={style.host}
          style={DURATIONS}
          data-testid="xp-toast-host"
          {...readyMark(ready)}
        >
          {shown.map((entry, index) => (
            <li
              key={entry.item.id}
              className={style.slot}
              data-phase={entry.phase}
              /*
                Higher up the stack, higher in the stacking order, so a new
                toast slides out from UNDER the one above it rather than over
                it. The delay staggers a batch's arrival; it is the entry's
                place in its batch, fixed at admission, so nothing restarts.
              */
              style={
                {
                  zIndex: shown.length - index,
                  "--xp-toast-delay": `${entry.index * XP_TOAST_ENTER_STAGGER_MS}ms`,
                } as CSSProperties
              }
            >
              <XpToast
                item={entry.item}
                phase={entry.phase}
                name={said(entry)}
                onDismiss={dismiss}
                onHold={hold}
                onRelease={release}
              />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
