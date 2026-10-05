"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { MEIKYUU_TALL_RATIO } from "@/lib/puzzles/meikyuu/sizes";
import { lyingDown, MEIKYUU_WAY_UP, roomOf } from "@/lib/puzzles/meikyuu/turn";

import { MEIKYUU_CHOICE, WAY_UP_COPY } from "./meikyuu.constants";
import { frameAspect, type MeikyuuStand } from "./MeikyuuFrame";
import { useWayUp } from "./meikyuuWayUpStore";

/**
 * HOW A TALL MEIKYUU MAZE STANDS ON THE PAGE: upright, or lying down on a wide screen (`meikyuu/turn.ts` says when). The
 * column the board sits in is measured, and what it comes to follows the reader's choice (Auto, Upright, Lying down:
 * `useWayUp`) and the room there is. A square maze always stands as it is made.
 *
 * The measured element is the COLUMN and never the wood: the wood changes shape with the answer, so a measure of it would
 * change the answer it is made from.
 */
export function useStand(tall: boolean): { column: RefObject<HTMLDivElement | null>; stand: MeikyuuStand; turned: boolean } {
  const column = useRef<HTMLDivElement>(null);
  const { wayUp } = useWayUp();
  const [room, setRoom] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const element = column.current;
    if (!tall || element === null) return;
    const read = (): void => {
      const next = roomOf(element.clientWidth, window.visualViewport?.height ?? window.innerHeight);
      setRoom((before) => (before !== null && next !== null && before.width === next.width && before.height === next.height ? before : next));
    };
    read();
    const watch = new ResizeObserver(read);
    watch.observe(element);
    window.addEventListener("resize", read);
    return () => {
      watch.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [tall]);
  const turned = tall && lyingDown(wayUp, MEIKYUU_TALL_RATIO, room);
  return { column, stand: !tall ? "square" : turned ? "lying" : "upright", turned };
}

/**
 * THE ROOM A TALL BOARD'S WOOD TAKES: as wide as its column, and no taller than the window leaves room for (the stylesheet's
 * `[data-mk-slot]`, which reads the wood's own shape from `--mk-fw`, its width over its height). A square maze needs none.
 * The wallpaper is taken of the wood and not of the column round it (`data-wallpaper-focus`), so a tall maze fills its picture.
 */
export function MeikyuuSlot({ stand, children }: { stand: MeikyuuStand; children: ReactNode }) {
  if (stand === "square") return <>{children}</>;
  return (
    <div className="mx-auto w-full" data-mk-slot data-mk-way={stand} data-wallpaper-focus style={{ "--mk-fw": String(1 / frameAspect(stand)) } as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * WHICH WAY UP, CHOSEN: Auto, Upright, Lying down. For a tall maze only; where there is none (a square level's set-up)
 * it stays in its place, dimmed, so choosing a size moves nothing.
 */
export function MeikyuuWayUp({ active = true, className = "" }: { active?: boolean; className?: string }) {
  const { wayUp, choose } = useWayUp();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`} role="group" aria-label={WAY_UP_COPY.legend} data-testid="meikyuu-wayup" data-active={active ? "true" : "false"}>
      <p className="text-sm text-ink-soft">{WAY_UP_COPY.legend}</p>
      <div className={`flex flex-wrap gap-1.5 ${active ? "" : "opacity-45"}`}>
        {MEIKYUU_WAY_UP.map((each) => (
          <button
            key={each}
            type="button"
            className={`${MEIKYUU_CHOICE} ${wayUp === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            aria-pressed={wayUp === each}
            title={WAY_UP_COPY[each].says}
            onClick={() => choose(each)}
            data-testid={`meikyuu-wayup-${each}`}
            data-chosen={wayUp === each ? "true" : "false"}
          >
            {WAY_UP_COPY[each].label}
          </button>
        ))}
      </div>
    </div>
  );
}
