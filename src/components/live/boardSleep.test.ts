import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { boardSleep } from "./boardSleep";

const IDLE = 6 * 60_000;

describe("a live board going to sleep, and waking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sleeps once the idle window has passed with nothing happening, and not a moment before", () => {
    const onSleep = vi.fn();
    const watch = boardSleep({ idleMs: IDLE, onSleep });
    vi.advanceTimersByTime(IDLE - 1);
    expect(onSleep).not.toHaveBeenCalled();
    expect(watch.asleep()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(onSleep).toHaveBeenCalledTimes(1);
    expect(watch.asleep()).toBe(true);
    watch.stop();
  });

  it("counts the window from the last thing that happened, not from when it started", () => {
    const onSleep = vi.fn();
    const watch = boardSleep({ idleMs: IDLE, onSleep });
    vi.advanceTimersByTime(IDLE - 60_000);
    expect(watch.stir()).toBe(false);
    vi.advanceTimersByTime(IDLE - 1);
    expect(onSleep).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onSleep).toHaveBeenCalledTimes(1);
    watch.stop();
  });

  it("says a stir woke it only when it was asleep, and sleeps again a whole window later", () => {
    const onSleep = vi.fn();
    const watch = boardSleep({ idleMs: IDLE, onSleep });
    vi.advanceTimersByTime(IDLE);
    expect(watch.stir()).toBe(true);
    expect(watch.asleep()).toBe(false);
    expect(watch.stir()).toBe(false);
    vi.advanceTimersByTime(IDLE - 1);
    expect(onSleep).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(onSleep).toHaveBeenCalledTimes(2);
    watch.stop();
  });

  it("stays asleep for as long as nothing happens, however long that is", () => {
    const onSleep = vi.fn();
    const watch = boardSleep({ idleMs: IDLE, onSleep });
    vi.advanceTimersByTime(24 * 60 * 60_000);
    expect(onSleep).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    watch.stop();
  });

  it("calls nothing once stopped, and a stir after that wakes nothing", () => {
    const onSleep = vi.fn();
    const watch = boardSleep({ idleMs: IDLE, onSleep });
    watch.stop();
    vi.advanceTimersByTime(IDLE * 2);
    expect(onSleep).not.toHaveBeenCalled();
    expect(watch.stir()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
