import { describe, expect, it } from "vitest";

import type { KeptReport } from "./kept.types";
import { KEPT_OUTBOX_KEY, createKeptOutbox, outboxVerdict } from "./keptOutbox";

function memory() {
  const kept = new Map<string, string>();
  return { get: (key: string) => kept.get(key) ?? null, set: (key: string, value: string) => void kept.set(key, value), kept };
}

function report(state: string, over = false): KeptReport {
  return { game: "hearts", state, seats: [{ name: "", computer: false }, { name: "", computer: true }], over, left: false, winners: over ? [0] : [] };
}

describe("the device's queue of games to file", () => {
  it("keeps a game played offline and sends it once the device is back online, as it stands then", async () => {
    const storage = memory();
    let online = false;
    const sent: { id: string; state: string }[] = [];
    const box = createKeptOutbox(storage, async (id, body) => {
      if (!online) return null;
      sent.push({ id, state: (JSON.parse(body) as KeptReport).state });
      return 200;
    });

    box.put("aaaa-bbbb-cccc", report("start"));
    await box.flush();
    box.put("aaaa-bbbb-cccc", report("move 1"));
    box.put("aaaa-bbbb-cccc", report("end", true));
    await box.flush();
    expect(sent).toEqual([]);
    expect(box.waiting()).toEqual(["aaaa-bbbb-cccc"]);

    online = true;
    await box.flush();
    // One send, of the game as it ended: the queue holds a game's latest report, not every one.
    expect(sent).toEqual([{ id: "aaaa-bbbb-cccc", state: "end" }]);
    expect(box.waiting()).toEqual([]);
  });

  it("survives the page being closed: a new page on the same device sends what the last could not", async () => {
    const storage = memory();
    const offline = createKeptOutbox(storage, async () => null);
    offline.put("aaaa-bbbb-cccc", report("going"));
    await offline.flush();
    expect(storage.kept.has(KEPT_OUTBOX_KEY)).toBe(true);

    const sent: string[] = [];
    const later = createKeptOutbox(storage, async (id) => {
      sent.push(id);
      return 200;
    });
    await later.flush();
    expect(sent).toEqual(["aaaa-bbbb-cccc"]);
    expect(later.waiting()).toEqual([]);
  });

  it("does not drop a newer report queued while an older one was on its way", async () => {
    const storage = memory();
    let release: () => void = () => undefined;
    const sent: string[] = [];
    const box = createKeptOutbox(storage, async (_id, body) => {
      sent.push((JSON.parse(body) as KeptReport).state);
      if (sent.length === 1) await new Promise<void>((done) => (release = done));
      return 200;
    });
    box.put("aaaa-bbbb-cccc", report("first"));
    const going = box.flush();
    await Promise.resolve();
    box.put("aaaa-bbbb-cccc", report("second", true));
    void box.flush();
    release();
    await going;
    await box.flush();
    expect(sent).toEqual(["first", "second"]);
    expect(box.waiting()).toEqual([]);
  });

  it("keeps a report the site could not take yet, and lets go of one it never will", () => {
    expect(outboxVerdict(null)).toBe("keep");
    expect(outboxVerdict(401)).toBe("keep");
    expect(outboxVerdict(429)).toBe("keep");
    expect(outboxVerdict(500)).toBe("keep");
    expect(outboxVerdict(200)).toBe("done");
    expect(outboxVerdict(400)).toBe("done");
    expect(outboxVerdict(409)).toBe("done");
  });

  it("stops a round at the first game that cannot be sent, rather than asking for every one while offline", async () => {
    const storage = memory();
    let asked = 0;
    const box = createKeptOutbox(storage, async () => {
      asked += 1;
      return null;
    });
    box.put("aaaa-bbbb-cccc", report("one"));
    box.put("dddd-eeee-ffff", report("two"));
    await box.flush();
    expect(asked).toBe(1);
    expect(box.waiting().sort()).toEqual(["aaaa-bbbb-cccc", "dddd-eeee-ffff"]);
  });

  it("keeps another kind of write in a queue of its own, under its own key", async () => {
    const storage = memory();
    const sent: string[] = [];
    const solves = createKeptOutbox<{ grid: string }>(storage, async (_id, body) => {
      sent.push(body);
      return 200;
    }, "itsutsu:solve-outbox");
    solves.put("one", { grid: "123" });
    expect(storage.kept.has(KEPT_OUTBOX_KEY)).toBe(false);
    await solves.flush();
    expect(sent).toEqual(['{"grid":"123"}']);
  });
});
