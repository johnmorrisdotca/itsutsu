"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import type { CardSounds } from "@johnmorrisdotca/toranpu/card-sounds";

import { CARD_SOUND_KEY } from "./Cards.constants";

/**
 * THE SOUND OF THE CARDS, OFF UNTIL ASKED FOR. Toranpu's recorded cards
 * (Kenney's Casino Audio, CC0), played as the cards in the hands change: a
 * shuffle and a deal when a hand is dealt, one card dealt when one is drawn,
 * a card played when one leaves a hand. It reads only how many cards each
 * hand holds, so every table sounds alike whatever its moves are called.
 *
 * Nothing is fetched until it is turned on and a card moves: the player and
 * its recordings are imported then, in the browser only. Whether it is on is
 * remembered in this browser; every access is wrapped, since a browser
 * blocking site data throws.
 */

const listeners = new Set<() => void>();

function readOn(): boolean {
  try {
    return window.localStorage.getItem(CARD_SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let sounds: Promise<CardSounds | null> | null = null;

function cardSounds(): Promise<CardSounds | null> {
  if (typeof window !== "undefined") {
    sounds ??= import("@johnmorrisdotca/toranpu/card-sounds").then(
      (module) => module.createCardSounds(),
      () => null,
    );
  }
  return sounds ?? Promise.resolve(null);
}

/** What the change in the cards held sounds like: dealt, drawn, played, or nothing. */
export function cardSoundFor(before: number, after: number): { kind: "deal" | "play"; count: number; shuffle: boolean } | null {
  if (after > before + 1) return { kind: "deal", count: Math.min(after - before, 13), shuffle: true };
  if (after === before + 1) return { kind: "deal", count: 1, shuffle: false };
  if (after < before) return { kind: "play", count: 1, shuffle: false };
  return null;
}

/**
 * Whether the cards make a sound, the way to turn it on or off, and the
 * sound itself, played from the total of cards held at the table: the first
 * total is only remembered, so opening a kept game is silent.
 */
export function useCardSounds(held: number): { on: boolean; toggle: () => void } {
  const on = useSyncExternalStore(subscribe, readOn, () => false);
  const last = useRef<number | null>(null);

  useEffect(() => {
    const before = last.current;
    last.current = held;
    if (before === null || !readOn()) return;
    const sound = cardSoundFor(before, held);
    if (sound === null) return;
    void cardSounds().then((player) => {
      if (player === null) return;
      if (sound.shuffle) {
        player.play("shuffle");
        player.play("deal", { count: sound.count, delay: 700 });
      } else player.play(sound.kind, { count: sound.count });
    });
  }, [held]);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(CARD_SOUND_KEY, readOn() ? "off" : "on");
    } catch {
      /* Not remembered: nothing changes. */
    }
    for (const listener of listeners) listener();
  }, []);
  return { on, toggle };
}
