"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";

import { MAHJONG_COPY } from "./mahjong.constants";
import { useMahjongFree, writeMahjongFree } from "./mahjongFree";

/**
 * FREE TILES LIT, OR THE CLASSIC LOOK: the same two chips on the set-up screen
 * and under the board, reading and writing the one choice (`mahjongFree.ts`),
 * so turning it off in play is what the next set-up opens on.
 */
export function MahjongFreeToggle({ withBlurb = false }: { withBlurb?: boolean }) {
  const lit = useMahjongFree();
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Free tiles" data-testid="mahjong-free">
        {[true, false].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={lit === each}
            className={`${PICK_WORD_CHIP} ${lit === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => writeMahjongFree(each)}
            data-testid={`mahjong-free-${each ? "on" : "off"}`}
          >
            {each ? MAHJONG_COPY.freeOn : MAHJONG_COPY.freeOff} <span className="font-mincho opacity-70">{each ? "空牌" : "素"}</span>
          </button>
        ))}
      </div>
      {withBlurb ? (
        <p className="min-h-8 text-xs text-muted" data-testid="mahjong-free-blurb">
          {lit ? MAHJONG_COPY.freeBlurb.on : MAHJONG_COPY.freeBlurb.off}
        </p>
      ) : null}
    </>
  );
}
