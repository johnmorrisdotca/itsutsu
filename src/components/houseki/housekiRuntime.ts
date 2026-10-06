"use client";

import { useEffect, useRef } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { HousekiRequest } from "@/lib/houseki/houseki.types";

/** What a game tells the page round it when it ends: how it went, its score, and its own save, which the server plays again to count a win. */
export type HousekiEnd = { outcome: "won" | "lost" | "complete"; score: number; save: string };

/** What every Houseki game is handed, and the one thing it needs from the page round it. */
export type HousekiGameProps = {
  /** What was asked for: the game starts it afresh, or opens `resume` where that is a save of the same thing. */
  request: HousekiRequest;
  /** A save of this very request, kept in this browser, or null. */
  resume: string | null;
  /** Counts up for every Restart, which starts the same request afresh. */
  run: number;
  appearance: Appearance;
  /** The set-up's preview: the board as the game starts, with nothing to press and nothing running. */
  readOnly?: boolean;
  /** Where the game is to be kept, and when: a game half way is put down and picked up again (called seldom, with the package's own text). */
  onKeep?: (save: string) => void;
  /** Called once, when the game ends. */
  onEnd?: (end: HousekiEnd) => void;
  /** Called with the title of what is being played, once it is known: a level's name, a lesson's. */
  onTitle?: (title: string) => void;
  /** The game is over for the player (they gave up): nothing is pressed any more. */
  stopped?: boolean;
};

/** A fresh seed for a free game: random, and written as text. */
export function freshSeed(): string {
  const crypto = globalThis.crypto;
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto?.getRandomValues === "function") return [...crypto.getRandomValues(new Uint8Array(16))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Today, in UTC, as the Daily names its day (`YYYY-MM-DD`). */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The latest value of something, for a handler that must not be remade on every change. */
export function useLatest<T>(value: T): { current: T } {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/**
 * A FIXED SIXTIETH OF A SECOND, WHATEVER THE SCREEN DOES. Calls `step(ticks)`
 * once a frame with the number of logical ticks that have passed (never more
 * than six, as the package's own demo does, so a tab that was asleep does not
 * play a minute at once). The package counts time in ticks and never reads a
 * clock, so a game that is looked away from simply does not advance.
 */
export function useTickLoop(running: boolean, step: (ticks: number) => void): void {
  const stepRef = useLatest(step);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = 0;
    let owed = 0;
    const tick = (now: number) => {
      if (last === 0) last = now;
      owed += Math.min(now - last, 100);
      last = now;
      const ticks = Math.min(6, Math.floor(owed / (1000 / 60)));
      if (ticks > 0) {
        owed -= ticks * (1000 / 60);
        stepRef.current(ticks);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, stepRef]);
}

/** Runs `keep` at most once in `every` milliseconds while `dirty()` says there is something new, and once more when the page is left: the checkpoint of a game being played. */
export function useCheckpoints(keep: () => void, dirty: () => boolean, every = 4000): void {
  const keepRef = useLatest(keep);
  const dirtyRef = useLatest(dirty);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (dirtyRef.current()) keepRef.current();
    }, every);
    const leave = () => keepRef.current();
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", leave);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- the LATEST keep is the point: the ref is a callback, not a node.
      keepRef.current();
    };
  }, [every, keepRef, dirtyRef]);
}

/** Whether a key press belongs to the game: it is aimed at the game or at the page itself, never at a field, and never at a region the player is scrolling. */
export function keyIsForGame(event: KeyboardEvent): boolean {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const inGame = (target !== null && target.closest("[data-houseki-game]") !== null) || document.activeElement === document.body;
  if (!inGame) return false;
  if (target !== null && (target.closest("input,select,textarea") !== null || target.isContentEditable)) return false;
  // An arrow on the board's own scroll region scrolls it: it must never also move the piece.
  if (target?.closest("[data-houseki-scroll]") != null && event.key.startsWith("Arrow")) return false;
  return true;
}

/** The keypad's keys as the keys they stand for, as the package's own demo reads them. */
export const KEYPAD: Readonly<Record<string, string>> = { Numpad4: "ArrowLeft", Numpad6: "ArrowRight", Numpad7: "z", Numpad9: "x", Numpad5: "ArrowDown", Numpad2: " " };

/** Listens for keys while `on`; `down` and `up` are given the key as it reads once the keypad is turned into arrows. */
export function useGameKeys(on: boolean, down: (key: string, event: KeyboardEvent) => void, up?: (key: string, event: KeyboardEvent) => void): void {
  const downRef = useLatest(down);
  const upRef = useLatest(up);
  useEffect(() => {
    if (!on) return;
    const onDown = (event: KeyboardEvent) => {
      if (!keyIsForGame(event) || event.ctrlKey || event.metaKey || event.altKey) return;
      downRef.current(KEYPAD[event.code] ?? event.key, event);
    };
    const onUp = (event: KeyboardEvent) => upRef.current?.(KEYPAD[event.code] ?? event.key, event);
    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("keyup", onUp);
    };
  }, [on, downRef, upRef]);
}
