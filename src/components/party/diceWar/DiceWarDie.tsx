"use client";

import { useEffect, useRef } from "react";

import { mountDie, type DieHandle } from "@johnmorrisdotca/korokoro";

import { DICE_WAR_TUMBLE_MS } from "./diceWar.constants";

/**
 * ONE DIE OF A THROW, drawn and tumbled by Korokoro (`mountDie`), the same die
 * the Dice tab's tray rolls. The throw was made before anything is drawn
 * (`throwDiceWar`), so this die is only shown the face the game kept: its
 * random source is told that face, and the tumble lands on it. A die that
 * arrives already thrown (a game opened again, a set-up's preview) shows its
 * face and does not tumble; only a new `rollKey`, after it has been on the
 * page, makes it roll.
 *
 * Nothing on it can be pressed: the throw is the table's Roll, never a tap on
 * one die, so it is inert, and the screen reader is told the face once, here.
 */
export function DiceWarDie({ face, sides, rollKey, width, seat }: { face: number; sides: number; rollKey: number; width: number; seat: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const die = useRef<DieHandle | null>(null);
  // The face the next tumble lands on: the random source below hands it out.
  const landing = useRef(face);
  const seen = useRef(rollKey);

  useEffect(() => {
    const target = box.current;
    if (target === null) return;
    const handle = mountDie(target, {
      sides,
      face,
      width,
      animationMs: DICE_WAR_TUMBLE_MS,
      // The die throws its face from this source, so "face − 1" is the pick that lands on `face`, whatever its sides.
      source: { next: () => landing.current - 1, seed: null },
    });
    die.current = handle;
    return () => {
      handle.destroy();
      die.current = null;
    };
    // A die is made again only when its kind or size changes; the face it shows follows below.
  }, [sides, width]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handle = die.current;
    if (handle === null) return;
    landing.current = face;
    if (seen.current !== rollKey) {
      seen.current = rollKey;
      handle.roll();
    } else if (handle.face !== face && !handle.rolling) handle.show(face);
  }, [face, rollKey, sides, width]);

  return (
    <span className="inline-flex shrink-0" data-testid="dicewar-die" data-face={face} data-seat={seat} role="img" aria-label={`${face}`}>
      <span ref={box} className="pointer-events-none inline-flex" inert />
    </span>
  );
}
