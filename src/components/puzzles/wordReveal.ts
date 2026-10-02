import { useState } from "react";

import type { CSSProperties } from "react";

/**
 * A REPLAY THAT STEPS BY WORD LETS THE WORD'S LETTERS ARRIVE, quickly. John,
 * 2026-10-02: when a step reveals a whole word, "quickly animate each of the N
 * letters… quite fast", since the reader is scrubbing through many words, and
 * "going forwards vs backwards would reverse the animations too".
 *
 * One helper for every replay that steps by word (`WordReplay` is the one
 * today): `useStepMotion` says which way the last move went, and `revealAttrs`
 * is what a letter wears while it animates (the keyframes are `[data-reveal]`
 * in globals.css). A letter takes `LETTER_MS`, each next one starts `stagger`
 * after, so the whole word is under 220 ms and shorter than a step of Play
 * (`REPLAY_STEP_MS`, 800). Going on, the letters come in left to right; going
 * back they leave right to left.
 *
 * Any move animates, a drag of the scrubber or a jump too, but only the word
 * the move lands on (or leaves): a long jump is never a cascade. A new move
 * replaces the one in flight, so fast scrubbing never queues.
 */
export const LETTER_MS = 110;
/** The longest gap between one letter's start and the next's; a long word is tightened so the whole stays short. */
const STAGGER_MS = 30;
/** The most a word's stagger may add to the first letter's time. */
const SPREAD_MS = 100;

export type StepMotion = { dir: "in" | "out"; from: number };

/** Whether this device asks for less motion; read when a move happens, in the browser. */
function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Which way the replay last moved, or null once the animation has finished
 * (`done`), for the reader who has asked for no motion, or when `animate` is
 * off. Held beside the position, set while rendering when the position
 * changes, so the frame that shows the new position already carries it.
 */
export function useStepMotion(at: number, animate: boolean): { motion: StepMotion | null; done: () => void } {
  const [seen, setSeen] = useState<{ at: number; motion: StepMotion | null }>({ at, motion: null });
  let motion = seen.motion;
  if (seen.at !== at) {
    motion = animate && !reducedMotion() ? { dir: at > seen.at ? "in" : "out", from: seen.at } : null;
    setSeen({ at, motion });
  }
  return { motion: animate ? motion : null, done: () => setSeen((now) => (now.motion === null ? now : { at: now.at, motion: null })) };
}

/** What letter number `at` of a `size`-letter word wears while it animates `dir`: its data attributes, and the style that times it. */
export function revealAttrs(dir: "in" | "out", at: number, size: number): { data: Record<string, string | undefined>; style: CSSProperties } {
  const stagger = size > 1 ? Math.min(STAGGER_MS, Math.floor(SPREAD_MS / (size - 1))) : 0;
  const order = dir === "in" ? at : size - 1 - at;
  return {
    data: { "data-reveal": dir, "data-reveal-end": order === size - 1 ? "true" : undefined },
    style: { "--reveal-ms": `${LETTER_MS}ms`, "--reveal-delay": `${order * stagger}ms` } as CSSProperties,
  };
}
