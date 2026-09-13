"use client";

import { useEffect, useRef } from "react";

/**
 * Tells the site what zone this device is in, once, for a member who has never
 * said.
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
 * The server is what decides whether to mount this at all — see
 * `dayZoneUnknown` — so a member who has chosen a zone never renders it, and
 * this cannot overwrite a choice somebody made. Once the write lands, the next
 * page's server render says the zone is known and nothing mounts again: ONE
 * WRITE, EVER, and no polling, no timer, no query.
 *
 * It draws nothing. A zone is not news, and a member who has just been told
 * their day now ends at midnight where they live has been told something they
 * already believed.
 */

/** This device's zone, or null when the browser will not say. */
function deviceTimeZone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === "string" && zone.trim() !== "" ? zone.trim() : null;
  } catch {
    /* A browser with no zone of its own. UTC stays the floor rather than a
       guess being written onto the row — see `dayZoneFor`. */
    return null;
  }
}

export function DeviceTimeZone() {
  const asked = useRef(false);
  useEffect(() => {
    /* React runs an effect twice in development's strict mode, and this one
       writes. Guarded here rather than relying on the request being idempotent,
       because a second PATCH is a second rate-limit unit for nothing. */
    if (asked.current) return;
    asked.current = true;

    const zone = deviceTimeZone();
    if (zone === null) return;

    /* The profile's own door, so every check it makes — that the platform knows
       this zone, that somebody is signed in, the rate limit — applies exactly as
       it does to a member typing it in. Failure is silence: a zone we could not
       record leaves the floor in place, which is what was happening anyway. */
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone: zone }),
    }).catch(() => undefined);
  }, []);

  return null;
}
