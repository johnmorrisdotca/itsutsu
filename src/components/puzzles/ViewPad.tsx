"use client";

import { useSyncExternalStore } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import { TABLE_PAD, TABLE_PAD_KEY } from "./kumimoji.constants";

/** The pad's keys, three to a row: zoom in, up, zoom out; left, right; down. */
const PAD = [
  { key: "in", glyph: "+", label: "pmaze.zoomIn" },
  { key: "up", glyph: "↑", label: "pmaze.pad.up" },
  { key: "out", glyph: "−", label: "pmaze.zoomOut" },
  { key: "left", glyph: "←", label: "pmaze.pad.left" },
  null,
  { key: "right", glyph: "→", label: "pmaze.pad.right" },
  null,
  { key: "down", glyph: "↓", label: "pmaze.pad.down" },
  null,
] as const satisfies readonly ({ key: string; glyph: string; label: PhraseKey } | null)[];

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
  label: given,
  testId,
  inline = false,
}: {
  fitted: boolean;
  onFit: () => void;
  onPress: (key: PadKey) => void;
  onTurn?: () => void;
  /** What a screen reader calls the pad; left out, the pad says it itself, in the reader's language (a table for Kumimoji's, a board otherwise). */
  label?: string;
  testId: string;
  inline?: boolean;
}) {
  const say = useSpeaker();
  const label = testId === "kumimoji" ? say.say("pmaze.pad.moveZoomTable") : (given ?? say.say("pmaze.tsunagi.moveZoom"));
  const open = useSyncExternalStore(subscribe, arrowsShown, () => false);
  const toggle = () => keepArrows(!open);
  const arrows = (
    <button
      type="button"
      className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs ${inline ? "" : "shadow-sm"}`}
      onClick={toggle}
      aria-pressed={open}
      aria-label={say.say(open ? "pmaze.pad.hideArrows" : "pmaze.pad.showArrows")}
      data-testid={`${testId}-arrows`}
    >
      {say.say("pmaze.pad.arrows")}
    </button>
  );
  if (inline) {
    const order = ["out", "in", "left", "up", "down", "right"] as const;
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label={label} data-pad="true" data-testid={`${testId}-pad`}>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs`} onClick={onFit} aria-pressed={fitted} data-fit="true" data-testid={`${testId}-fit`}>
          <Paired en={say.say("puzzle.press.fit")} kanji="全体" kanjiClassName="opacity-70" inReadersLanguage />
        </button>
        {arrows}
        {(open ? order : []).map((key) => {
          const each = PAD.find((one) => one !== null && one.key === key)!;
          return (
            <button key={key} type="button" className={TABLE_PAD_KEY} onClick={() => onPress(key)} aria-label={say.say(each.label)} title={say.say(each.label)} data-testid={`${testId}-pad-${key}`}>
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
            aria-label={say.say("pmaze.pad.turnAria")}
            title={say.say("pmaze.pad.turnTitle")}
            data-turn="true"
            data-testid={`${testId}-turn`}
          >
            {say.say("pmaze.pad.turn")}
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
          <Paired en={say.say("puzzle.press.fit")} kanji="全体" kanjiClassName="opacity-70" inReadersLanguage />
        </button>
      </div>
      {open ? (
        <div className={TABLE_PAD} role="group" aria-label={label} data-pad="true" data-testid={`${testId}-pad`}>
          {PAD.map((each, at) =>
            each === null ? (
              <span key={at} aria-hidden="true" />
            ) : (
              <button key={each.key} type="button" className={TABLE_PAD_KEY} onClick={() => onPress(each.key)} aria-label={say.say(each.label)} title={say.say(each.label)} data-testid={`${testId}-pad-${each.key}`}>
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
