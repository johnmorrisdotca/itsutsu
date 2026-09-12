"use client";

import { useEffect, useId, useRef, useState } from "react";

import { WORDS_COPY } from "./mine.constants";
import { useTileDrag } from "./useTileDrag";
import type { WordTilesProps } from "./words.types";

/*
 * THE FOUR BOXES ARE THE HERO OF THE TAB, built like the screen a site shows
 * you a six-digit code on: big boxes, big type, the four of them filling the
 * width. John, with the old screen in front of him: "these are just regular
 * site boxes that look like buttons. It has to be prominent buttons like you
 * see in a website that is showing you a 6-digit password ... Big font."
 *
 * One row of four from a tablet up, two by two on a phone. A word on the list
 * is five letters at most, so the type can be as large as the box allows.
 * Every state of the tab draws these same boxes — dashed and numbered before
 * there are words, live while they are being chosen, masked once they are set
 * — so the shape is learned once and the tab never looks like a different
 * page from one visit to the next.
 */
const BOX =
  "relative flex min-h-28 w-full items-center justify-center rounded-2xl border-2 px-3 text-3xl font-semibold tracking-wide select-none outline-none sm:min-h-40 sm:text-4xl";
/*
 * Focus is an offset ring, with a gap between it and the tile: a moss ring
 * flush against a moss border read as a thicker border, and a keyboard user
 * has to be able to tell "this is where I am" from "this is a kept word".
 */
const BOX_FOCUS = "focus-visible:ring-4 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
/** The box a carried word is over: it lights before the finger lifts. */
const BOX_TARGET = "border-moss ring-4 ring-moss/50";
/** Where a carried word came from: a dashed ghost, so it can be seen and dropped back. */
const BOX_ORIGIN = "pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-rule-strong bg-ivory/40";

/**
 * Where an arrow key sends a word: one box either way, or to an end.
 *
 * Up and down step the same way left and right do. On a phone the boxes are
 * two by two and on a tablet one row, and what a person moving by keyboard
 * is told is "box 2 of 4", never a geometry — so the ordinal is the thing to
 * keep the same between them.
 */
function keyMove(key: string, index: number, count: number): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return index > 0 ? index - 1 : null;
    case "ArrowRight":
    case "ArrowDown":
      return index < count - 1 ? index + 1 : null;
    case "Home":
      return index > 0 ? 0 : null;
    case "End":
      return index < count - 1 ? count - 1 : null;
    default:
      return null;
  }
}

/** A box with nothing in it yet: numbered, and dashed the way a code box is before it is filled. */
function EmptyTile({ index, next, target }: { index: number; next: boolean; target: boolean }) {
  return (
    <div
      className={`${BOX} border-dashed ${
        target ? BOX_TARGET : next ? "border-moss/70 bg-ivory/40 text-moss" : "border-rule-strong bg-ivory/40 text-muted/50"
      }`}
      data-testid={`phrase-slot-${index}`}
      data-empty="true"
    >
      <span aria-hidden="true">{index + 1}</span>
      <span className="sr-only">{next ? WORDS_COPY.nextBox(index + 1) : WORDS_COPY.emptyBox(index + 1)}</span>
    </div>
  );
}

/** A word that is set. It cannot be shown, so the box says only that it is there. */
function MaskedTile({ index }: { index: number }) {
  return (
    <div
      role="img"
      aria-label={WORDS_COPY.hiddenWord}
      className={`${BOX} border-moss/50 bg-moss-soft/60 text-ink-soft`}
      data-testid={`phrase-slot-${index}`}
      data-masked="true"
    >
      <span aria-hidden="true" className="tracking-[0.35em]">
        ••••
      </span>
    </div>
  );
}

export function WordTiles({ words, mode, busy = false, onTakeOut, onMove }: WordTilesProps) {
  const count = words.length;
  const hintId = useId();
  const [said, setSaid] = useState("");
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const focusNext = useRef<number | null>(null);

  function move(from: number, to: number): void {
    const word = words[from];
    if (word === null || word === undefined || onMove === undefined) return;
    onMove(from, to);
    setSaid(WORDS_COPY.moved(word, to + 1));
  }

  const { drag, boxRef, onClickCapture, tileHandlers } = useTileDrag(
    count,
    mode === "picking" && onMove !== undefined ? move : undefined,
  );

  /*
   * Focus follows the word. The boxes are keyed by position, so after a move
   * the word's tile is a different element — and a keyboard user who pressed
   * the arrow key is still on the word, which is what they are moving.
   */
  useEffect(() => {
    const at = focusNext.current;
    if (at === null) return;
    focusNext.current = null;
    tiles.current[at]?.focus();
  });

  const nextEmpty = mode === "picking" ? words.indexOf(null) : -1;

  return (
    <div className="flex flex-col gap-2">
      <ol
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        aria-label={WORDS_COPY.slotsLabel}
        data-testid="phrase-slots"
        onClickCapture={onClickCapture}
      >
        {words.map((word, index) => {
          const lifted = drag !== null && drag.from === index;
          const target = drag !== null && drag.over === index && drag.over !== drag.from;
          let tile;
          if (mode === "kept") {
            tile = <MaskedTile index={index} />;
          } else if (word === null) {
            tile = <EmptyTile index={index} next={index === nextEmpty} target={target} />;
          } else {
            tile = (
              /*
               * The whole tile is the button and its text is the word alone:
               * the cross in the corner is drawn, not written, so what a test
               * or a screen reader reads off the tile is exactly the word.
               */
              <button
                type="button"
                ref={(node) => {
                  tiles.current[index] = node;
                }}
                disabled={busy}
                onClick={() => onTakeOut?.(word)}
                onKeyDown={(event) => {
                  const to = keyMove(event.key, index, count);
                  if (to === null) return;
                  event.preventDefault();
                  focusNext.current = to;
                  move(index, to);
                }}
                {...tileHandlers(index)}
                style={drag !== null && drag.from === index ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
                className={`${BOX} ${BOX_FOCUS} cursor-grab touch-none border-moss bg-moss-soft text-ink [-webkit-touch-callout:none] disabled:cursor-wait disabled:opacity-70 ${
                  lifted
                    ? "z-20 scale-105 cursor-grabbing shadow-xl ring-4 ring-moss/40"
                    : "transition-[transform,box-shadow] duration-150"
                } ${target ? BOX_TARGET : ""}`}
                title={WORDS_COPY.tileTitle}
                aria-describedby={hintId}
                data-testid={`phrase-slot-${index}`}
              >
                {word}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="absolute top-2 right-2 size-4 text-muted sm:top-3 sm:right-3 sm:size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            );
          }
          return (
            <li key={index} ref={boxRef(index)} className="relative min-w-0">
              {lifted ? <div aria-hidden="true" className={BOX_ORIGIN} /> : null}
              {tile}
            </li>
          );
        })}
      </ol>
      <p id={hintId} className="sr-only">
        {WORDS_COPY.tileHint}
      </p>
      <p className="sr-only" aria-live="polite" data-testid="phrase-announce">
        {said}
      </p>
    </div>
  );
}
