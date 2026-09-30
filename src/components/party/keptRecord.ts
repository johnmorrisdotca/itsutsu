"use client";

import { makeKeptId } from "@/lib/party/kept/kept.constants";
import type { KeptRecordRules, KeptReport } from "@/lib/party/kept/kept.types";
import { createKeptOutbox } from "@/lib/party/kept/keptOutbox";

/**
 * A GAME ON ONE DEVICE, FILED IN ITS PLAYER'S HISTORY — the browser's half of
 * `keptTables.ts`. John, 2026-09-30: "Should contain all games ever… Even
 * those that aren't completed or just passed around", and "Sometimes the games
 * are played off-line".
 *
 * The store (`keptInBrowser`) tells this every game it keeps. Each game is
 * named by an id made here when it starts, kept beside it under
 * `<key>:record`, and its latest report goes into the device's queue
 * (`keptOutbox.ts`), which is what reaches the site, whenever it can:
 *
 * - a new game — from its set-up, "Play again", or one already going in this
 *   browser when this arrived — is sent at once;
 * - a game that has just ENDED, or is PUT AWAY half way, is sent at once;
 * - a move only queues the game as it stands, sent when the page is hidden or
 *   left, so a game costs a handful of requests rather than one a move;
 * - whatever is queued is sent again when the device comes back online and
 *   when a page that keeps games is next opened, until the site has it.
 *
 * Nothing here ever stops a game being played: a signed-out visitor's games
 * wait in the queue and are never sent in a loop, and every failure is quiet.
 */

type Slot = { id: string; over: boolean };

/** One store's record keeper: told the game before and after each keep. */
export type KeptRecorder<Game> = (before: Game | null, after: Game | null) => void;

const storage = {
  get: (key: string) => window.localStorage.getItem(key),
  set: (key: string, value: string) => window.localStorage.setItem(key, value),
};

async function post(id: string, body: string): Promise<number | null> {
  try {
    // `keepalive`, so a send made as the page closes still goes (a beacon could, but says nothing back).
    const answer = await fetch(`/api/kept-games/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: body.length < 30_000,
    });
    return answer.status;
  } catch {
    return null;
  }
}

let outbox: ReturnType<typeof createKeptOutbox<KeptReport>> | null = null;

/** The device's one queue, and the moments it is sent: hidden, closed, back online, and once when first asked for. */
function theOutbox(): ReturnType<typeof createKeptOutbox<KeptReport>> {
  if (outbox !== null) return outbox;
  const made = createKeptOutbox(storage, post);
  outbox = made;
  const send = () => void made.flush();
  window.addEventListener("online", send);
  window.addEventListener("pagehide", send);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send();
  });
  // What an earlier visit could not send: offline then, perhaps online now.
  window.setTimeout(send, 0);
  return made;
}

/** A new record id, from the browser's own random numbers. */
function newId(): string {
  return makeKeptId((count) => Array.from(window.crypto.getRandomValues(new Uint32Array(count))));
}

function readSlot(key: string): Slot | null {
  try {
    const text = window.localStorage.getItem(key);
    if (text === null) return null;
    const slot = JSON.parse(text) as Partial<Slot>;
    return typeof slot.id === "string" ? { id: slot.id, over: slot.over === true } : null;
  } catch {
    return null;
  }
}

function writeSlot(key: string, slot: Slot | null): void {
  try {
    if (slot === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(slot));
  } catch {
    /* Storage refused: the next keep names the game again, which files it twice rather than not at all. */
  }
}

/** The slot a store keeps its current game's record id in. */
export function recordSlotKey(storageKey: string): string {
  return `${storageKey}:record`;
}

/** Make a game opened from the history this store's current game, under the record it already has. */
export function adoptRecord(storageKey: string, id: string, over: boolean): void {
  writeSlot(recordSlotKey(storageKey), { id, over });
}

export function keptRecorder<Game>(storageKey: string, encode: (game: Game) => string, rules: KeptRecordRules<Game>): KeptRecorder<Game> {
  const slotKey = recordSlotKey(storageKey);

  function report(game: Game, left = false): KeptReport {
    const over = rules.over(game);
    return { game: rules.game, state: encode(game), seats: rules.seats(game), over, left, winners: over ? rules.winners(game) : [] };
  }

  return (before, after) => {
    // Asked for at the first keep, never when the store is made: a store is made wherever its module is imported, the server and the tests included.
    const box = theOutbox();
    const slot = readSlot(slotKey);
    if (after === null) {
      // Put away. Half way, the record says it was left; ended, it already says so.
      if (slot !== null && !slot.over && before !== null) {
        box.put(slot.id, report(before, true));
        void box.flush();
      }
      writeSlot(slotKey, null);
      return;
    }
    const over = rules.over(after);
    // A new game where there was none, or where one had ended: a record of its own, the old one left as it ended.
    const fresh = slot === null || (!over && (slot.over || (before !== null && rules.over(before))));
    if (fresh) {
      const id = newId();
      writeSlot(slotKey, { id, over });
      box.put(id, report(after));
      void box.flush();
      return;
    }
    if (slot.over) return;
    box.put(slot.id, report(after));
    if (over) {
      writeSlot(slotKey, { id: slot.id, over: true });
      void box.flush();
    }
  };
}
