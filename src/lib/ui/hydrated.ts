"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to: the answer changes once, when the browser takes over. */
const never = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

/**
 * False while a component is being rendered on the server, true once it is
 * running in the browser.
 *
 * A server-rendered control is a real control before React has attached to
 * it, and a choice made in that window is dropped on the floor: the state
 * never hears it, and the next render puts the control back where it was. It
 * looks exactly like a control that ignored you.
 *
 * A person cannot lose that race — they have to see the page first. A browser
 * test can, whenever the page is a little slow, and then it fails somewhere
 * else entirely: "started on 9×9 when I chose 19×19" reads as a bug about
 * boards and is a bug about timing. Marking the control lets a test wait for
 * the moment a person effectively always waits for.
 *
 * `useSyncExternalStore` rather than an effect that sets state, because that
 * is what the third argument of this hook is for — one answer on the server
 * and another in the browser — and because setting state in an effect is a
 * lint error here, correctly.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(never, onTheClient, onTheServer);
}

/**
 * Spread onto the element a test waits for: `data-ready="true"` once the
 * browser has taken over. Said in one place so the two spellings of the same
 * marker cannot drift.
 */
export function readyMark(ready: boolean): { "data-ready": string } {
  return { "data-ready": ready ? "true" : "false" };
}
