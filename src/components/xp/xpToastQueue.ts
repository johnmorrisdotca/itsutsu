import {
  XP_TOAST_COPY as copy,
  XP_TOAST_DWELL_MS,
  XP_TOAST_LEVEL_DWELL_MS,
  XP_TOAST_LINGER_MS,
  XP_TOAST_MAX_SHOWN,
  XP_TOAST_STAGGER_MS,
} from "./xp.constants";
import type { XpToastItem, XpToastPhase } from "./xp.types";

/**
 * The stack of toasts as a value, and the few things that can happen to it.
 *
 * Pure, the way the engine is: every function hands back a new queue and
 * leaves the one it was given alone, so the rules — one showing per award,
 * four on screen at most, arrivals in order — are tested without a browser,
 * and the host is left with only clocks and pixels.
 */

export type XpToastEntry = {
  item: XpToastItem;
  /** Which arrival this came in with: everything admitted in one call shares a batch. */
  batch: number;
  /** Its place within that batch, top to bottom. */
  index: number;
  phase: XpToastPhase;
};

export type XpToastQueue = {
  /** In arrival order: the first is the top of the stack. */
  readonly entries: readonly XpToastEntry[];
  /** Every id ever admitted, so an award a caller keeps handing over is shown once. */
  readonly seen: ReadonlySet<string>;
  readonly batches: number;
};

export const EMPTY_QUEUE: XpToastQueue = { entries: [], seen: new Set(), batches: 0 };

/**
 * The queue after these items have been offered.
 *
 * Only ids it has never seen are taken, and they are taken together as one
 * batch in the order given. The same queue object comes back when nothing is
 * new, which is what lets the host do this during render without looping.
 */
export function admit(queue: XpToastQueue, items: readonly XpToastItem[]): XpToastQueue {
  const fresh: XpToastItem[] = [];
  const taken = new Set<string>();
  for (const item of items) {
    if (queue.seen.has(item.id) || taken.has(item.id)) continue;
    taken.add(item.id);
    fresh.push(item);
  }
  if (fresh.length === 0) return queue;
  const batch = queue.batches + 1;
  return {
    entries: [
      ...queue.entries,
      ...fresh.map((item, index): XpToastEntry => ({ item, batch, index, phase: "shown" })),
    ],
    seen: new Set([...queue.seen, ...taken]),
    batches: batch,
  };
}

/** The toasts on screen, top to bottom. The rest wait their turn. */
export function onScreen(queue: XpToastQueue): readonly XpToastEntry[] {
  return queue.entries.slice(0, XP_TOAST_MAX_SHOWN);
}

/** How many are waiting for a slot. */
export function waiting(queue: XpToastQueue): number {
  return Math.max(queue.entries.length - XP_TOAST_MAX_SHOWN, 0);
}

/** The queue with this toast on its way out. Unchanged if it is not there, or already going. */
export function beginLeaving(queue: XpToastQueue, id: string): XpToastQueue {
  const at = queue.entries.findIndex((entry) => entry.item.id === id);
  if (at === -1 || queue.entries[at].phase === "leaving") return queue;
  const entries = queue.entries.map((entry, index) =>
    index === at ? { ...entry, phase: "leaving" as const } : entry,
  );
  return { ...queue, entries };
}

/** The queue with this toast gone. It stays seen, so it cannot come back. */
export function drop(queue: XpToastQueue, id: string): XpToastQueue {
  const entries = queue.entries.filter((entry) => entry.item.id !== id);
  return entries.length === queue.entries.length ? queue : { ...queue, entries };
}

export function isEmpty(queue: XpToastQueue): boolean {
  return queue.entries.length === 0;
}

/**
 * How long a toast stays before it goes of its own accord.
 *
 * A level reached gets longer; and each place down a batch adds the stagger,
 * so toasts that arrived together leave top first, one after another.
 */
export function dwellFor(item: XpToastItem, place: number): number {
  const base = item.level?.reached === true ? XP_TOAST_LEVEL_DWELL_MS : XP_TOAST_DWELL_MS;
  return base + Math.max(place, 0) * XP_TOAST_STAGGER_MS;
}

/** How long a held toast stays once let go: what it had left, but never less than the linger. */
export function resumeAfter(remaining: number): number {
  return Math.max(remaining, XP_TOAST_LINGER_MS);
}

/**
 * What a screen reader is told, and what names the card: the points and the
 * label, and the level when one was reached. The sentence is on the card for
 * anyone who looks; the announcement is for anyone who cannot.
 */
export function announcement(points: number, label: string, level?: XpToastItem["level"]): string {
  const head = `${copy.amount(points)} ${copy.unit}: ${label}.`;
  if (level === undefined) return head;
  return level.reached
    ? `${head} ${copy.levelUp.en}: ${level.name}.`
    : `${head} ${copy.nextLevel(level.name)}.`;
}
