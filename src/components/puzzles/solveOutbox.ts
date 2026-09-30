"use client";

import { createKeptOutbox } from "@/lib/party/kept/keptOutbox";

/**
 * A PUZZLE FINISHED WITH NO CONNECTION, handed in once there is one. John,
 * 2026-09-30: "some limited navigating off line including games creation and
 * completion."
 *
 * The device's queue of games to file (`keptOutbox.ts`, the history's), a
 * second one under its own key: a solve that could not reach
 * `POST /api/puzzles/solved` is kept here, and sent when the device is back
 * online, when a page is hidden or left, and when a puzzle page next opens,
 * until the site has answered. Sending one twice pays nothing twice: the
 * ledger's unique index refuses the same grid again.
 */

const KEY = "itsutsu:solve-outbox";

const storage = {
  get: (key: string) => window.localStorage.getItem(key),
  set: (key: string, value: string) => window.localStorage.setItem(key, value),
};

async function handIn(_id: string, body: string): Promise<number | null> {
  try {
    const answer = await fetch("/api/puzzles/solved", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 30_000 });
    // A grid the site refuses (422) never will be kept, so it leaves the queue as a report it cannot read does.
    return answer.status === 422 ? 400 : answer.status;
  } catch {
    return null;
  }
}

let outbox: ReturnType<typeof createKeptOutbox<unknown>> | null = null;

function theOutbox(): ReturnType<typeof createKeptOutbox<unknown>> {
  if (outbox !== null) return outbox;
  const made = createKeptOutbox<unknown>(storage, handIn, KEY);
  outbox = made;
  const send = () => void made.flush();
  window.addEventListener("online", send);
  window.addEventListener("pagehide", send);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send();
  });
  window.setTimeout(send, 0);
  return made;
}

/** A finished solve the site could not be reached with, queued under its puzzle: sent later, until the site answers. */
export function queueSolve(id: string, body: object): void {
  theOutbox().put(id, body);
}

/** Opens the queue, which sends whatever an earlier visit could not: for a puzzle page, as it opens. */
export function sendWaitingSolves(): void {
  void theOutbox().flush();
}

/** The line a solve finished offline shows where the points would be. */
export const SOLVE_QUEUED = "You're offline, so this is kept on this device and handed in when you're back online.";
