"use client";

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
 * Over the box's corner, where Kumimoji has empty table to spare; or `inline`,
 * a row of its own under the box, where a Tsunagi board fills its box to the
 * edge and a pad over it would cover cells a line has to be drawn through.
 */
export function ViewPad({ fitted, onFit, onPress, label, testId, inline = false }: { fitted: boolean; onFit: () => void; onPress: (key: PadKey) => void; label: string; testId: string; inline?: boolean }) {
  if (inline) {
    const order = ["out", "in", "left", "up", "down", "right"] as const;
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label={label} data-pad="true" data-testid={`${testId}-pad`}>
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-9 px-3 py-1 text-xs`} onClick={onFit} aria-pressed={fitted} data-fit="true" data-testid={`${testId}-fit`}>
          Fit <span className="font-mincho opacity-70">全体</span>
        </button>
        {order.map((key) => {
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
      <button
        type="button"
        className={`${BUTTON_BASE} ${BUTTON_QUIET} absolute top-2 right-2 z-10 min-h-9 px-3 py-1 text-xs shadow-sm`}
        onClick={onFit}
        aria-pressed={fitted}
        data-fit="true"
        data-testid={`${testId}-fit`}
      >
        Fit <span className="font-mincho opacity-70">全体</span>
      </button>
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
    </>
  );
}
