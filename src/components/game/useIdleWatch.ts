"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long without a touch, click, key or pointer move counts as having left. */
export const IDLE_AFTER_MS = 2 * 60 * 1000;

/** How often the last activity is compared with the clock. Once a minute is nothing. */
const IDLE_CHECK_MS = 60 * 1000;

/**
 * Notices when nobody is at the device.
 *
 * Listening costs almost nothing: each event only writes the current time
 * into a ref, with passive listeners that never block scrolling or touch, and
 * nothing re-renders on movement. Once a minute a timer compares that stamp
 * with the clock, and only when the gap passes the threshold does state
 * change. `confirm` is the person saying they are still here.
 */
export function useIdleWatch({
  enabled = true,
  idleAfterMs = IDLE_AFTER_MS,
}: {
  enabled?: boolean;
  idleAfterMs?: number;
} = {}) {
  // Zero until mounted: reading the clock during render is not allowed.
  const lastActivity = useRef(0);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const stamp = () => {
      lastActivity.current = Date.now();
    };
    stamp();
    const options: AddEventListenerOptions = { passive: true };
    const events = ["pointermove", "pointerdown", "keydown", "touchstart", "scroll"] as const;
    for (const event of events) window.addEventListener(event, stamp, options);
    // Coming back to the tab is activity too.
    const onVisible = () => {
      if (document.visibilityState === "visible") stamp();
    };
    document.addEventListener("visibilitychange", onVisible);

    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= idleAfterMs) setIdle(true);
    }, IDLE_CHECK_MS);

    return () => {
      for (const event of events) window.removeEventListener(event, stamp);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [enabled, idleAfterMs]);

  const confirm = useCallback(() => {
    lastActivity.current = Date.now();
    setIdle(false);
  }, []);

  return { idle: enabled && idle, confirm };
}
