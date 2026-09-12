import { describe, expect, it } from "vitest";

import {
  XP_TOAST_DWELL_MS,
  XP_TOAST_LEVEL_DWELL_MS,
  XP_TOAST_LINGER_MS,
  XP_TOAST_MAX_SHOWN,
  XP_TOAST_STAGGER_MS,
} from "./xp.constants";
import type { XpToastItem } from "./xp.types";
import {
  admit,
  announcement,
  beginLeaving,
  drop,
  dwellFor,
  EMPTY_QUEUE,
  isEmpty,
  onScreen,
  resumeAfter,
  waiting,
} from "./xpToastQueue";

/**
 * The stack's rules, without a browser.
 *
 * What matters is not that a list can have things added to it but the three
 * promises the host makes on top of that: an award is shown once however
 * often it is offered, at most a few are on screen and the rest wait in
 * order, and nothing here ever changes a queue it was given.
 */

function award(id: string, extra: Partial<XpToastItem> = {}): XpToastItem {
  return {
    id,
    points: 25,
    label: `Award ${id}`,
    kanji: "",
    sentence: `Sentence for ${id}.`,
    ...extra,
  };
}

const ids = (queue: ReturnType<typeof admit>) => queue.entries.map((entry) => entry.item.id);

describe("admitting awards", () => {
  it("takes new awards in the order given, as one batch", () => {
    const queue = admit(EMPTY_QUEUE, [award("a"), award("b"), award("c")]);
    expect(ids(queue)).toEqual(["a", "b", "c"]);
    expect(queue.entries.map((entry) => entry.batch)).toEqual([1, 1, 1]);
    expect(queue.entries.map((entry) => entry.index)).toEqual([0, 1, 2]);
    expect(queue.entries.every((entry) => entry.phase === "shown")).toBe(true);
  });

  it("puts a later arrival after the earlier ones, in its own batch", () => {
    const first = admit(EMPTY_QUEUE, [award("a"), award("b")]);
    const second = admit(first, [award("a"), award("b"), award("c")]);
    expect(ids(second)).toEqual(["a", "b", "c"]);
    expect(second.entries[2].batch).toBe(2);
    expect(second.entries[2].index).toBe(0);
  });

  it("hands back the same queue when nothing is new, so a render can call it freely", () => {
    const queue = admit(EMPTY_QUEUE, [award("a")]);
    expect(admit(queue, [award("a")])).toBe(queue);
    expect(admit(queue, [])).toBe(queue);
    expect(admit(EMPTY_QUEUE, [])).toBe(EMPTY_QUEUE);
  });

  it("shows an award once however many times it is offered, even after it has gone", () => {
    const shown = admit(EMPTY_QUEUE, [award("a")]);
    const gone = drop(shown, "a");
    expect(isEmpty(gone)).toBe(true);
    expect(admit(gone, [award("a")])).toBe(gone);
  });

  it("ignores a duplicate id inside one offer", () => {
    const queue = admit(EMPTY_QUEUE, [award("a"), award("a")]);
    expect(ids(queue)).toEqual(["a"]);
  });

  it("leaves the queue it was given untouched", () => {
    const before = admit(EMPTY_QUEUE, [award("a")]);
    const snapshot = JSON.stringify(before);
    admit(before, [award("b")]);
    beginLeaving(before, "a");
    drop(before, "a");
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(EMPTY_QUEUE.entries).toHaveLength(0);
    expect(EMPTY_QUEUE.seen.size).toBe(0);
  });
});

describe("what is on screen", () => {
  const many = Array.from({ length: XP_TOAST_MAX_SHOWN + 2 }, (_, i) => award(`t${i}`));

  it("shows at most the cap, and the rest wait in order", () => {
    const queue = admit(EMPTY_QUEUE, many);
    expect(onScreen(queue).map((entry) => entry.item.id)).toEqual(
      many.slice(0, XP_TOAST_MAX_SHOWN).map((item) => item.id),
    );
    expect(waiting(queue)).toBe(2);
  });

  it("lets the next waiting one step in when one goes", () => {
    const queue = drop(admit(EMPTY_QUEUE, many), "t0");
    const shown = onScreen(queue).map((entry) => entry.item.id);
    expect(shown[0]).toBe("t1");
    expect(shown).toContain(`t${XP_TOAST_MAX_SHOWN}`);
    expect(waiting(queue)).toBe(1);
  });

  it("keeps a leaving toast in its slot until it is dropped", () => {
    const queue = beginLeaving(admit(EMPTY_QUEUE, many), "t0");
    expect(onScreen(queue)[0]).toMatchObject({ phase: "leaving", item: { id: "t0" } });
    expect(waiting(queue)).toBe(2);
  });

  it("is empty only when nothing is shown or waiting", () => {
    expect(isEmpty(EMPTY_QUEUE)).toBe(true);
    expect(isEmpty(admit(EMPTY_QUEUE, [award("a")]))).toBe(false);
    expect(waiting(EMPTY_QUEUE)).toBe(0);
  });
});

describe("leaving and dropping", () => {
  it("marks one toast leaving and no other", () => {
    const queue = beginLeaving(admit(EMPTY_QUEUE, [award("a"), award("b")]), "b");
    expect(queue.entries.map((entry) => entry.phase)).toEqual(["shown", "leaving"]);
  });

  it("answers with the same queue for an unknown id or a toast already leaving", () => {
    const queue = admit(EMPTY_QUEUE, [award("a")]);
    expect(beginLeaving(queue, "zz")).toBe(queue);
    const leaving = beginLeaving(queue, "a");
    expect(beginLeaving(leaving, "a")).toBe(leaving);
    expect(drop(queue, "zz")).toBe(queue);
  });

  it("drops a toast and remembers it was seen", () => {
    const queue = drop(admit(EMPTY_QUEUE, [award("a"), award("b")]), "a");
    expect(ids(queue)).toEqual(["b"]);
    expect(queue.seen.has("a")).toBe(true);
  });
});

describe("how long a toast stays", () => {
  it("gives an ordinary award the dwell, and each place down a batch the stagger more", () => {
    expect(dwellFor(award("a"), 0)).toBe(XP_TOAST_DWELL_MS);
    expect(dwellFor(award("a"), 2)).toBe(XP_TOAST_DWELL_MS + 2 * XP_TOAST_STAGGER_MS);
  });

  it("gives a level reached longer, and a level merely approached the ordinary time", () => {
    expect(dwellFor(award("a", { level: { name: "Shodan", reached: true } }), 0)).toBe(XP_TOAST_LEVEL_DWELL_MS);
    expect(dwellFor(award("a", { level: { name: "Shodan", reached: false } }), 0)).toBe(XP_TOAST_DWELL_MS);
    expect(XP_TOAST_LEVEL_DWELL_MS).toBeGreaterThan(XP_TOAST_DWELL_MS);
  });

  it("never lets a place below zero shorten it", () => {
    expect(dwellFor(award("a"), -3)).toBe(XP_TOAST_DWELL_MS);
  });

  it("keeps a released toast for what it had left, but never less than the linger", () => {
    expect(resumeAfter(XP_TOAST_LINGER_MS + 1000)).toBe(XP_TOAST_LINGER_MS + 1000);
    expect(resumeAfter(200)).toBe(XP_TOAST_LINGER_MS);
    expect(resumeAfter(0)).toBe(XP_TOAST_LINGER_MS);
  });
});

describe("what is announced", () => {
  it("says the points and the label, once", () => {
    expect(announcement(25, "First win at Reversi")).toBe("+25 XP: First win at Reversi.");
  });

  it("adds the level when one was reached, and the next one when it was only approached", () => {
    expect(announcement(50, "Win at Gomoku", { name: "Shodan", reached: true })).toBe(
      "+50 XP: Win at Gomoku. Level up: Shodan.",
    );
    expect(announcement(50, "Win at Gomoku", { name: "Nidan", reached: false })).toBe(
      "+50 XP: Win at Gomoku. Next level: Nidan.",
    );
  });
});
