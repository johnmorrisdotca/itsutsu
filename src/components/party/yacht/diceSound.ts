"use client";

import { useCallback, useSyncExternalStore } from "react";

import { DICE_SOUND_KEY } from "./yacht.constants";

/**
 * THE SOUND OF THE DICE, OFF UNTIL ASKED FOR. A rattle made in the browser —
 * a few short clicks of filtered noise, one for each knock of a die on the
 * tray — so there is no sound file to fetch, and it plays nothing at all
 * until somebody turns it on. Whether it is on is remembered in this browser;
 * every access is wrapped, since a browser blocking site data throws.
 */

const listeners = new Set<() => void>();

function readOn(): boolean {
  try {
    return window.localStorage.getItem(DICE_SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let context: AudioContext | null = null;

/** A rattle of `dice` dice landing: a knock or two each, spread over the tumble. */
function rattle(dice: number): void {
  try {
    context ??= new AudioContext();
    const audio = context;
    const knocks = Math.min(10, 2 + dice * 2);
    for (let knock = 0; knock < knocks; knock += 1) {
      const at = audio.currentTime + 0.03 + (knock / knocks) * 0.5 + Math.random() * 0.04;
      const length = 0.035;
      const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * length), audio.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 3;
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const filter = audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800 + Math.random() * 1600;
      const gain = audio.createGain();
      gain.gain.value = 0.35 * (1 - knock / (knocks * 1.6));
      source.connect(filter).connect(gain).connect(audio.destination);
      source.start(at);
    }
  } catch {
    /* No sound here: the dice still roll. */
  }
}

/** Whether the dice make a sound, the way to turn it on or off, and the rattle for a throw (silent while off). */
export function useDiceSound(): { on: boolean; toggle: () => void; play: (dice: number) => void } {
  const on = useSyncExternalStore(subscribe, readOn, () => false);
  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(DICE_SOUND_KEY, readOn() ? "off" : "on");
    } catch {
      /* Not remembered: nothing changes. */
    }
    for (const listener of listeners) listener();
  }, []);
  const play = useCallback((dice: number) => {
    if (readOn() && dice > 0) rattle(dice);
  }, []);
  return { on, toggle, play };
}
