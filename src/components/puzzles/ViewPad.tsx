"use client";

import { useSyncExternalStore } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

import { TABLE_PAD, TABLE_PAD_KEY } from "./kumimoji.constants";

/** The pad's keys, three to a row: zoom in, up, zoom out; left, right; down. */
const PAD = [
  { key: "in", glyph: "+", label: "Zoom in" },
  { key: "up", glyph: "↑", label: "Move the view up" },
  { key: "out", glyph: "−", label: "Zoom out" },
  { key: "left", glyph: "←", label: "Move the view left" },
  null,
  { key: "right", glyph: "→", label: "Move the view right" },
  null,
  { key: "down", glyph: "↓", label: "Move the view down" },
  null,
] as const;

export type PadKey = "in" | "out" | "up" | "down" | "left" | "right";

/**
 * FIT AND THE PAD: the one way a board too big to press comfortably is zoomed
 * and moved by buttons, in the corner of the box it looks into. Made for
 * Kumimoji's table (John, 2026-09-26: "the mouse wheel zooms the table nicely,
 * but there are no controls on the page") and shared with Tsunagi's big boards,
 * so there is one pad on the site, not two that drift. Buttons, so a finger and
 * a keyboard both reach them. Fit shows the whole again; `fitted` says whether
 * it is showing now. `testId` names the game: `<testId>-fit`, `<testId>-pad`,
 * `<testId>-pad-in` and so on.
 *
 * THE ARROWS ARE OUT OF SIGHT until asked for. John, 2026-09-28: a phone is
 * dragged and pinched and a desk has a mouse and a wheel, so the pad is "really
 * minimal use case" and should be "out of sight by default". Arrows, beside
 * Fit, shows and hides it, and this browser remembers which (`ARROWS_KEPT`).
 *
 * Over the box's corner, where Kumimoji has empty table to spare; or `inline`,
 * a row of its own under the box, where a Tsunagi board fills its box to the
 * edge and a pad over it would cover cells a line has to be drawn through.
 *
 * TURN, in the corner beside them where a board can be turned (`onTurn`,
 * Kumimoji's table: John, 2026-09-28, turning the table with every tile kept
 * upright). It is a way of looking, like Fit and the arrows, so it sits with
 * them, over table already given to them, and nothing under the box moves.
 */
export function ViewPad({
  fitted,
  onFit,
  onPress,
  onTurn,
  label,
  testId,
  inline = false,
}: {
  fitted: boolean;
  onFit: () => void;
  onPress: (key: PadKey) => void;
  onTurn?: () => void;
  label: string;
  testId: string;
  inline?: boolean;
}) {
  const open = useSyncExternalStore(subscribe, arrowsShown, () => false);
  const toggle = () => keepArrows(!open);
  const arrows = (
    <button
      type="button"
      className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs ${inline ? "" : "shadow-sm"}`}
      onClick={toggle}
      aria-pressed={open}
      aria-label={open ? "Hide the arrows" : "Show the arrows"}
      data-testid={`${testId}-arrows`}
    >
      Arrows
    </button>
  );
  if (inline) {
    const order = ["out", "in", "left", "up", "down", "right"] as const;
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label={label} data-pad="true" data-testid={`${testId}-pad`}>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs`} onClick={onFit} aria-pressed={fitted} data-fit="true" data-testid={`${testId}-fit`}>
          Fit <span className="font-mincho opacity-70">全体</span>
        </button>
        {arrows}
        {(open ? order : []).map((key) => {
          const each = PAD.find((one) => one !== null && one.key === key)!;
          return (
            <button key={key} type="button" className={TABLE_PAD_KEY} onClick={() => onPress(key)} aria-label={each.label} title={each.label} data-testid={`${testId}-pad-${key}`}>
              {each.glyph}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <>
      <div className="absolute top-2 right-2 z-10 flex gap-1.5">
        {onTurn === undefined ? null : (
          <button
            type="button"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs shadow-sm`}
            onClick={onTurn}
            aria-label="Turn the table a quarter turn clockwise, keeping every tile upright"
            title="Turn the table a quarter turn clockwise"
            data-turn="true"
            data-testid={`${testId}-turn`}
          >
            Turn
          </button>
        )}
        {arrows}
        <button
          type="button"
          className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs shadow-sm`}
          onClick={onFit}
          aria-pressed={fitted}
          data-fit="true"
          data-testid={`${testId}-fit`}
        >
          Fit <span className="font-mincho opacity-70">全体</span>
        </button>
      </div>
      {open ? (
        <div className={TABLE_PAD} role="group" aria-label={label} data-pad="true" data-testid={`${testId}-pad`}>
          {PAD.map((each, at) =>
            each === null ? (
              <span key={at} aria-hidden="true" />
            ) : (
              <button key={each.key} type="button" className={TABLE_PAD_KEY} onClick={() => onPress(each.key)} aria-label={each.label} title={each.label} data-testid={`${testId}-pad-${each.key}`}>
                {each.glyph}
              </button>
            ),
          )}
        </div>
      ) : null}
    </>
  );
}

/**
 * Where this browser keeps whether the arrows are shown, read through
 * `useSyncExternalStore` so the server's answer (hidden) and the browser's can
 * differ without an effect setting state. Every access is wrapped: a browser
 * that blocks site data starts hidden and simply does not remember.
 */
const ARROWS_KEPT = "itsutsu:view-arrows";
const listeners = new Set<() => void>();
/** The answer for a browser whose storage refuses, kept for as long as the page is open. */
let shownHere = false;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function arrowsShown(): boolean {
  try {
    return window.localStorage.getItem(ARROWS_KEPT) === "shown";
  } catch {
    return shownHere;
  }
}

function keepArrows(shown: boolean): void {
  shownHere = shown;
  try {
    window.localStorage.setItem(ARROWS_KEPT, shown ? "shown" : "hidden");
  } catch {
    // Not kept past this page: `shownHere` answers until it is left.
  }
  for (const listener of listeners) listener();
}
