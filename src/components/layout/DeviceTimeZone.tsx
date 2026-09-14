"use client";

import { useEffect, useRef } from "react";

import { zoneWorthRecording } from "@/lib/auth/deviceZone";

/**
 * Tells the site what zone this device is in, for a member whose zone is unknown
 * or only guessed from their country.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IN AN EFFECT, AND THAT IS THE ONLY PLACE IT MAY BE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * AGENTS.md: "`Intl` in render is a bug; `Intl` in a handler is the only
 * correct place for it." The 0.146.1 fault was `Intl.DisplayNames` called while
 * a client component rendered — Node and Chromium spell four regions
 * differently, so the two paints disagreed. An effect is the same safe ground a
 * click handler is: it runs after hydration, in the browser only, where there is
 * no server render to disagree with. `ProfileForm`'s "use this device's time
 * zone" link reads the same value in its own click handler and must stay there.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHO DECIDES, AND WHY IT WRITES AT MOST ONCE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The server decides whether to mount this at all — `LearnTimeZone` — so a
 * member on a zone they chose, or one their browser has already measured, never
 * renders it and cannot have it overwritten.
 *
 * `held` is the guess the row carries, when it carries one. A device that agrees
 * with it writes nothing: otherwise a member in Toronto with Canada as their
 * country would send the same value back on every page they opened, because the
 * row would still read as a guess afterwards — see `zoneWorthRecording`. A
 * device that disagrees writes once, the row then reads as the member's own, and
 * nothing mounts again. No polling, no timer, no query.
 *
 * It draws nothing. A zone is not news.
 */

/** This device's zone, or null when the browser will not say. */
function deviceTimeZone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === "string" ? zone : null;
  } catch {
    /* A browser with no zone of its own. The row keeps what it has rather than
       a guess being written onto it — see `dayZoneFor`. */
    return null;
  }
}

export function DeviceTimeZone({ held }: { held: string | null }) {
  const asked = useRef(false);
  useEffect(() => {
    /* React runs an effect twice in development's strict mode, and this one
       writes. Guarded here rather than relying on the request being idempotent,
       because a second PATCH is a second rate-limit unit for nothing. */
    if (asked.current) return;
    asked.current = true;

    const zone = zoneWorthRecording(deviceTimeZone(), held);
    if (zone === null) return;

    /* The profile's own door, so every check it makes — that the platform knows
       this zone, that somebody is signed in, the rate limit — applies exactly as
       it does to a member typing it in. Failure is silence: a zone we could not
       record leaves the row as it was, which is what was happening anyway. */
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone: zone }),
    }).catch(() => undefined);
  }, [held]);

  return null;
}
