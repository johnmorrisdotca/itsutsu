import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pendingSave } from "./pendingSave";

/**
 * A save that waits a moment, and goes at once if the page is leaving.
 *
 * The appearance a member chooses was lost whenever the page went within half a
 * second of the choice — its timer went with the page. `flush` sends what is
 * waiting when the page leaves; these hold it to sending exactly the latest value,
 * exactly once, and nothing when nothing waits.
 */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pendingSave", () => {
  it("waits, then sends the value once", () => {
    const send = vi.fn();
    const save = pendingSave<string>(send, 500);
    save.set("sumi");
    vi.advanceTimersByTime(499);
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("sumi");
  });

  it("sends only the last of several quick choices, so writes cannot race each other", () => {
    const send = vi.fn();
    const save = pendingSave<string>(send, 500);
    save.set("kaya");
    vi.advanceTimersByTime(200);
    save.set("sumi");
    vi.advanceTimersByTime(200);
    save.set("shinkaya");
    vi.advanceTimersByTime(500);
    expect(send.mock.calls).toEqual([["shinkaya"]]);
  });

  it("flush sends what is waiting at once — the page is leaving", () => {
    const send = vi.fn();
    const save = pendingSave<string>(send, 500);
    save.set("sumi");
    save.flush();
    expect(send.mock.calls).toEqual([["sumi"]]);
  });

  it("does not send it again when the wait would have ended, since flush stopped it", () => {
    const send = vi.fn();
    const save = pendingSave<string>(send, 500);
    save.set("sumi");
    save.flush();
    vi.advanceTimersByTime(1_000);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("flush with nothing waiting sends nothing, however often the page says it is going", () => {
    const send = vi.fn();
    const save = pendingSave<string>(send, 500);
    save.flush();
    save.set("sumi");
    vi.advanceTimersByTime(500);
    save.flush();
    save.flush();
    expect(send.mock.calls).toEqual([["sumi"]]);
  });
});
