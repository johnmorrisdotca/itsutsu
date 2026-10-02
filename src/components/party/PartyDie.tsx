"use client";

import { useEffect, useRef } from "react";

import { mountDie, type DieHandle } from "@johnmorrisdotca/korokoro";

/** Korokoro's own die colours, fixed: a die on a table is an ivory object in both themes, as it was before Korokoro drew it. */
const IVORY_DIE = { "--kk-die": "#fffdf7", "--kk-die-edge": "#c9bfa9", "--kk-die-ink": "#1f2320", "--kk-pip-one": "#b5452c", "--kk-solo": "100%" } as const;

/**
 * ONE SIX-SIDED DIE OF A DICE TABLE, DRAWN AND TUMBLED BY KOROKORO
 * (`mountDie`), the die the Dice tab, Dice War and Tenka already roll. It
 * fills the width of its parent and keeps its square.
 *
 * It decides nothing. The throw was made by the game's rules before anything
 * is drawn, so a replay of the saved game gives the same face whatever this
 * draws: the die is only shown the face the game kept. Its random source is
 * told that face, and the tumble lands on it. A die that arrives already
 * thrown (a table opened again) shows its face and does not tumble; only a new
 * `rollKey`, on a die that `tumble`s, after it has been on the page, makes it
 * roll. Anything with a new key that does not tumble (a die held through a
 * roll, a new game) is set down on its face at once.
 *
 * A face of 0 is a die not thrown yet: it draws the six it rests on, and the
 * caller covers it. Nothing on it can be pressed (the table's Roll is the
 * throw, a tap on a die is the table's own), so it is inert, and the caller
 * labels it for a screen reader. It is silent: a table's sound is the table's
 * own to turn on, never the die's.
 *
 * LOADED IN THE BROWSER ONLY, as every dice table's code is
 * (`yachtClient.tsx`, `pachisiClient.tsx`): it reaches Korokoro, which no
 * server's function carries.
 */
export function PartyDie({ face, rollKey, tumble, tumbleMs }: { face: number; rollKey: number; tumble: boolean; tumbleMs: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const die = useRef<DieHandle | null>(null);
  // The face the next tumble lands on: the random source below hands it out.
  const landing = useRef(Math.max(1, face));
  const seen = useRef(rollKey);

  useEffect(() => {
    const target = box.current;
    if (target === null) return;
    const handle = mountDie(target, {
      sides: 6,
      face: landing.current,
      animationMs: tumbleMs,
      theme: IVORY_DIE,
      // The die throws its face from this source, so "face − 1" is the pick that lands on `face`.
      source: { next: () => landing.current - 1, seed: null },
    });
    die.current = handle;
    return () => {
      handle.destroy();
      die.current = null;
    };
  }, [tumbleMs]);

  useEffect(() => {
    const handle = die.current;
    if (handle === null) return;
    landing.current = Math.max(1, face);
    if (seen.current !== rollKey) {
      seen.current = rollKey;
      if (tumble && face > 0 && !handle.rolling) handle.roll();
      else handle.show(landing.current);
    } else if (handle.face !== landing.current && !handle.rolling) handle.show(landing.current);
  }, [face, rollKey, tumble, tumbleMs]);

  return <span ref={box} className="pointer-events-none block w-full" inert />;
}
