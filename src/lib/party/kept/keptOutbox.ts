// Relative, like the rest of lib/party: the stores that import this are drawn by pages the browser specs import from.
import type { KeptReport } from "./kept.types";

/**
 * THE DEVICE'S QUEUE OF GAMES TO FILE, so a game played with no connection
 * still reaches its player's history. John, 2026-09-30: "Sometimes the games
 * are played off-line not sure that once you get back online then you post".
 *
 * One entry a game, by the id its browser gave it, holding the latest report
 * of it: a newer report of the same game replaces an older one, since the
 * record only ever wants how the game stands now. The queue is sent when a
 * game starts, ends or is put away, when its page is hidden or left, when the
 * device comes back online, and when a page that keeps games is next opened;
 * an entry leaves only once the site has answered it — kept, or refused for
 * good. Sending one twice is harmless: the site files by id (`keptTables.ts`).
 *
 * Storage and the send are handed in, so the queue can be tested without a
 * browser and the browser's half (`keptRecord.ts`) is only the wiring.
 */

/** The browser's `localStorage`, as far as the queue needs it. */
export type OutboxStorage = {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
};

/** One report sent: the answer's status, or null when nothing answered (offline, or the request failed). */
export type OutboxSend = (id: string, body: string) => Promise<number | null>;

/** Where the queue is kept in the browser: one key for every game on the device. */
export const KEPT_OUTBOX_KEY = "itsutsu:kept-outbox";

type Entry<T> = { report: T; stamp: number };
type Queue<T> = Record<string, Entry<T>>;

/**
 * What an answer means for the entry sent. 200 kept; 400 and 409 never will be
 * (a report the site cannot read, an id another record has), so they leave
 * too rather than being sent for ever. Anything else — no answer, signed out,
 * too many, the site failing — stays for the next time, and stops this round:
 * a device that is offline or signed out is not asked to send the rest now.
 */
export function outboxVerdict(status: number | null): "done" | "keep" {
  if (status === null) return "keep";
  if (status >= 200 && status < 300) return "done";
  if (status === 400 || status === 409) return "done";
  return "keep";
}

/**
 * A queue on this device. `T` is what one entry carries — a game's report by
 * default — and `key` where it is kept, so another kind of write made offline
 * (a puzzle solved with no connection) can have a queue of its own beside this
 * one, sent the same way.
 */
export function createKeptOutbox<T = KeptReport>(storage: OutboxStorage, send: OutboxSend, key: string = KEPT_OUTBOX_KEY) {
  let stamp = 0;
  let running: Promise<void> | null = null;
  let again = false;

  function read(): Queue<T> {
    try {
      const text = storage.get(key);
      const queue = text === null ? {} : (JSON.parse(text) as unknown);
      return typeof queue === "object" && queue !== null ? (queue as Queue<T>) : {};
    } catch {
      return {};
    }
  }

  function write(queue: Queue<T>): void {
    try {
      storage.set(key, JSON.stringify(queue));
    } catch {
      /* Storage refused: this report is not queued, and the next one of the game carries everything it did. */
    }
  }

  /** The game as it stands now, queued in place of whatever was queued for it. */
  function put(id: string, report: T): void {
    const queue = read();
    stamp = Math.max(stamp, ...Object.values(queue).map((entry) => entry.stamp ?? 0)) + 1;
    queue[id] = { report, stamp };
    write(queue);
  }

  async function round(): Promise<void> {
    for (const [id, entry] of Object.entries(read())) {
      const status = await send(id, JSON.stringify(entry.report)).catch(() => null);
      if (outboxVerdict(status) === "keep") return;
      // Only the report that was sent leaves: a newer one queued while it was on its way is sent next.
      const queue = read();
      if (queue[id]?.stamp === entry.stamp) {
        delete queue[id];
        write(queue);
      }
    }
  }

  /** Send everything queued, one at a time; a call made while sending waits for a second round rather than overlapping. */
  function flush(): Promise<void> {
    if (running !== null) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        await round();
      } while (again);
    })().finally(() => {
      running = null;
    });
    return running;
  }

  /** The ids still waiting to be filed. */
  function waiting(): string[] {
    return Object.keys(read());
  }

  return { put, flush, waiting };
}
