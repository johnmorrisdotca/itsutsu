"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import {
  BOARD_SCALES,
  BOARD_SCALE_LIST,
  BOARD_SCALE_STORAGE,
  BOARD_SCALE_WORDS,
  boardScaleName,
  deviceClassOf,
  scaleFor,
  scalesFrom,
  type BoardScale as Scale,
  type DeviceClass,
  type KeptScales,
} from "@/lib/preferences/boardScale";
import { SCALE_TOP_PX, scaledPlayWidths } from "@/lib/preferences/boardScaleFit";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { boardColumnIn, measurePlay, reachRunsOff, regularDrawingIn } from "./boardScaleMeasure";

/** The window's kind of screen, followed as it is resized; null on the server and below a laptop's width. */
function subscribeResize(changed: () => void): () => void {
  window.addEventListener("resize", changed);
  return () => window.removeEventListener("resize", changed);
}
const deviceNow = () => deviceClassOf(window.innerWidth);
const noDevice = () => null;

/** This browser's kept choices, as stored text (a string is a stable snapshot); null where storage is refused. */
function storedNow(): string | null {
  try {
    return window.localStorage.getItem(BOARD_SCALE_STORAGE);
  } catch {
    return null;
  }
}
const nothingStored = () => null;
const noSubscription = () => () => {};

/** How the play is laid out right now: which size, the width it was given, and whether the measuring is done. */
type Layout = { mode: Scale; width: number | null; grow: number; pass: number; settled: boolean };

const REGULAR: Layout = { mode: BOARD_SCALES.regular, width: null, grow: 1, pass: 0, settled: false };

/** A re-measure closer than this to the last is the same answer. */
const SETTLED_PX = 2;
/** Passes at the bigger layout before its answer stands, whatever the last one moved by. */
const MOST_PASSES = 3;

/**
 * THE PLAY AT REGULAR, LARGE OR FULL — ONE CHOOSER, IN ONE PLACE, ON EVERY
 * BOARD. See `boardScale.ts` for what the three are and the kinds of screen
 * each keeps its own for.
 *
 * Wraps the whole play on a page — the board, and the things beside and under
 * it that play it — and draws the chooser at its top right. At Regular it is
 * the page's own column, exactly as before (`className`). At Large and Full it
 * gives the play a width of its own (`--scale-w`), centred on the page and
 * past the page's frame where the window has room for it, and globals.css
 * takes the cap off the board's column (`data-scale-board`) and lays the
 * controls beside the board. The width is worked out from the page as drawn
 * (`boardScaleFit.ts`), once on arrival, once on a choice, and when the window
 * or the board changes — never on a timer.
 *
 * REMEMBERED PER KIND OF SCREEN. A member's choices arrive with the page
 * (`kept`, off the row the page reads anyway) and a press keeps one with one
 * `PATCH /api/me`; a reader with no account keeps them in this browser. The
 * server cannot know the window, so the page arrives at Regular and takes the
 * kept size once the browser has measured it.
 *
 * NOT ON A PHONE. Below a laptop's width nothing is offered and nothing is
 * applied: the chooser is not drawn, and every rule it drives is inside a
 * `lg` media query.
 */
export function BoardScale({
  kept,
  saves,
  className = "",
  widthReason,
  children,
}: {
  /** The account's kept choices, read by the page with the rest of its preferences; empty for a reader with no account. */
  kept: KeptScales;
  /** Whether there is an account to keep a new choice on; otherwise this browser keeps it. */
  saves: boolean;
  /** The play's own classes at Regular: the page's column, as it always was. */
  className?: string;
  /** Why the play's Regular column is narrower than the page, where it is (`data-width-reason`). */
  widthReason?: string;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const device = useSyncExternalStore(subscribeResize, deviceNow, noDevice);
  const stored = useSyncExternalStore(noSubscription, storedNow, nothingStored);
  const [picked, setPicked] = useState<KeptScales>({});
  const scales = useMemo<KeptScales>(() => {
    let parsed: unknown = null;
    try {
      parsed = stored === null ? null : JSON.parse(stored);
    } catch {
      parsed = null;
    }
    return { ...(saves ? kept : scalesFrom(parsed)), ...picked };
  }, [saves, kept, stored, picked]);
  const chosen = scaleFor(scales, device);

  const play = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>({ ...REGULAR, settled: true });
  // The board last measured at Regular and its drawing's width there: the floor under both bigger sizes.
  const regular = useRef<{ column: HTMLElement; drawing: number } | null>(null);
  // A change the reader asked for, to bring the play to the top of the window once it is sized.
  const bringIntoView = useRef(false);
  // Bumped when the window is resized or the board is replaced, so everything is measured again.
  const [epoch, setEpoch] = useState(0);

  /* The board appearing (a puzzle made, a party game started) or being replaced: measure again. */
  useEffect(() => {
    const root = play.current;
    if (root === null) return;
    let seen: HTMLElement | null = boardColumnIn(root);
    const observer = new ResizeObserver(() => {
      const now = boardColumnIn(root);
      if (now === seen) return;
      seen = now;
      setEpoch((value) => value + 1);
    });
    observer.observe(root);
    let settle = 0;
    const resized = () => {
      window.clearTimeout(settle);
      // Once the window stops moving, not on every pixel of a drag.
      settle = window.setTimeout(() => {
        regular.current = null;
        setEpoch((value) => value + 1);
      }, 150);
    };
    window.addEventListener("resize", resized);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resized);
      window.clearTimeout(settle);
    };
  }, []);

  /* A new kind of screen, a new choice, or a new board: start from Regular unless it is already known. */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const root = play.current;
      const column = root === null ? null : boardColumnIn(root);
      if (device === null || column === null) {
        setLayout({ ...REGULAR, settled: true });
        return;
      }
      if (regular.current !== null && regular.current.column === column) {
        setLayout(chosen === BOARD_SCALES.regular ? { ...REGULAR, settled: true } : { mode: chosen, width: null, grow: 1, pass: 1, settled: false });
        return;
      }
      setLayout({ ...REGULAR });
    });
    return () => cancelAnimationFrame(frame);
  }, [device, chosen, epoch]);

  /* Each layout drawn: measure it, and size the play until the answer stops moving. */
  useEffect(() => {
    if (layout.settled) return;
    const frame = requestAnimationFrame(() => {
      const root = play.current;
      const column = root === null ? null : boardColumnIn(root);
      if (root === null || column === null || device === null) {
        setLayout({ ...REGULAR, settled: true });
        return;
      }
      if (layout.mode === BOARD_SCALES.regular) {
        regular.current = { column, drawing: regularDrawingIn(column) };
        setLayout(chosen === BOARD_SCALES.regular ? { ...REGULAR, settled: true } : { mode: chosen, width: null, grow: 1, pass: 1, settled: false });
        return;
      }
      const floor = regular.current?.drawing ?? regularDrawingIn(column);
      const widths = scaledPlayWidths(measurePlay(root, column, floor));
      const wanted = widths === null ? null : layout.mode === BOARD_SCALES.full ? widths.full : widths.large;
      const steady = wanted === null || (layout.width !== null && Math.abs(wanted.play - layout.width) <= SETTLED_PX) || layout.pass >= MOST_PASSES;
      if (!steady) {
        setLayout({ mode: layout.mode, width: wanted.play, grow: wanted.grow, pass: layout.pass + 1, settled: false });
        return;
      }
      setLayout({ ...layout, width: wanted?.play ?? layout.width, grow: wanted?.grow ?? layout.grow, settled: true });
      if (bringIntoView.current) {
        bringIntoView.current = false;
        // The size was worked out with the play at the top of the window; put it there if its controls would be off the bottom.
        if (reachRunsOff(column)) window.scrollBy({ top: root.getBoundingClientRect().top - SCALE_TOP_PX, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [layout, chosen, device]);

  function choose(next: Scale, on: DeviceClass) {
    bringIntoView.current = next !== BOARD_SCALES.regular;
    setPicked((now) => ({ ...now, [on]: next }));
    if (!saves) {
      try {
        window.localStorage.setItem(BOARD_SCALE_STORAGE, JSON.stringify({ ...scales, [on]: next }));
      } catch {
        // Storage refused (a private window): the board still changes, it is only not remembered.
      }
      return;
    }
    // Kept, not awaited: the board has already changed, and a failure costs the choice at the next screen, not this one.
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { [boardScaleName(on)]: next } }),
    }).catch(() => {});
  }

  const sized = layout.mode !== BOARD_SCALES.regular && layout.width !== null;
  return (
    <div
      ref={play}
      className={`${className} flex flex-col gap-3`.trim()}
      // The width, and how many times Regular's the board is: text a board draws at a fixed size grows by it (globals.css).
      style={sized ? ({ "--scale-w": `${layout.width}px`, "--board-grow": layout.grow } as CSSProperties) : undefined}
      data-testid="board-scaling"
      data-board-scaling
      data-board-scale={layout.mode}
      data-board-scale-chosen={chosen}
      data-device-class={device ?? "none"}
      data-scale-settled={layout.settled ? "true" : "false"}
      data-width-reason={widthReason ?? "the play is as wide as its board and the controls beside it, at the size the reader chose"}
      {...readyMark(hydrated && device !== null ? layout.settled : hydrated)}
    >
      {/* Furniture: just the board sizes the board to the screen itself, and a phone never shows it. */}
      <div data-chrome data-board-scale-chooser className="hidden items-center justify-end lg:flex">
        <fieldset className="flex items-center gap-1" data-testid="board-scale">
          <legend className="sr-only">Board size</legend>
          <span className="mr-1 text-xs text-muted" aria-hidden="true">
            Board <span className="font-mincho">盤</span>
          </span>
          {BOARD_SCALE_LIST.map((option) => (
            <label
              key={option}
              className="cursor-pointer rounded-md border border-rule px-2 py-0.5 text-xs text-ink-soft hover:border-rule-strong has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-moss"
              title={BOARD_SCALE_WORDS[option].whole}
              data-testid="board-scale-option"
              data-scale={option}
            >
              <input
                type="radio"
                name="board-scale"
                value={option}
                checked={chosen === option}
                disabled={device === null}
                onChange={() => {
                  if (device !== null) choose(option, device);
                }}
                className="sr-only"
                aria-label={BOARD_SCALE_WORDS[option].whole}
              />
              <span aria-hidden="true">
                {BOARD_SCALE_WORDS[option].label} <span className="font-mincho">{BOARD_SCALE_WORDS[option].kanji}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
      {children}
    </div>
  );
}
