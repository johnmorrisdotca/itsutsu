"use client";

import type { ReactNode } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";

/** The two lines every hand-over says, the one way: who the device goes to, and the press that says it is them. */
export const HAND_OVER_COPY = {
  passTo: (name: string) => `Pass to ${name}`,
  ready: (name: string) => `I'm ${name}: start my turn`,
} as const;

/**
 * THE COVER BETWEEN TWO PEOPLE'S TURNS WHERE WHAT ONE KNOWS THE OTHER MUST
 * NOT SEE: it names who the device goes to, shows nothing of the game, and
 * waits for that person to press that it is them. The wording is Tenka's
 * ("Pass to Ann", "I'm Ann: start my turn"), because a hand-over is one thing
 * on this site; Tenka, Hitotsu, the card games and Mexican Train each wrote
 * their own, and a new game with hidden information uses this one.
 *
 * `mark` is the player's colour as the game draws it, `children` what may be
 * told to everybody at the hand-over (the last move, as it is public), and
 * `ready` overrides the press's words where the turn is not a turn (arranging
 * pieces). `testId` names the cover and its press (`<testId>`, `<testId>-ready`).
 */
export function PartyHandOver({
  name,
  mark,
  testId,
  note,
  ready = HAND_OVER_COPY.ready(name),
  onReady,
  children,
}: {
  name: string;
  mark: ReactNode;
  testId: string;
  /** One line under the name: what is about to happen. */
  note: string;
  ready?: string;
  onReady: () => void;
  children?: ReactNode;
}) {
  return (
    <div className={`${PANEL_CLASS} flex flex-col items-center gap-3 py-8 text-center`} data-testid={testId}>
      <p className="flex items-center gap-2 text-xl font-semibold" data-testid={`${testId}-to`}>
        {mark}
        {HAND_OVER_COPY.passTo(name)}
      </p>
      <p className="max-w-md text-sm text-muted" data-width-reason="a line of guidance centred under the name it belongs to, which reads as one with it">
        {note}
      </p>
      {children}
      <button type="button" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} onClick={onReady} data-testid={`${testId}-ready`}>
        {ready}
      </button>
    </div>
  );
}
