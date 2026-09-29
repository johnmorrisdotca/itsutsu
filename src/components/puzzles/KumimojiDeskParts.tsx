"use client";

import type { TileWords } from "@/lib/puzzles/kumimoji/tileWords";
import type { KumimojiLanguage } from "@/lib/puzzles/kumimoji/kumimoji.types";

import { HAND_TILE_PX, TILE, tileLetterPx } from "./kumimoji.constants";

/**
 * The reading of the chosen wild tile, under the table while one is chosen:
 * the select's value is the wild's own code for that letter (`wildFor`).
 * Shared by the solo game and every pass-and-play seat.
 */
export function KumimojiWildPicker({
  language,
  words,
  tile,
  disabled,
  onChoose,
}: {
  language: KumimojiLanguage;
  words: TileWords;
  tile: string;
  disabled: boolean;
  onChoose: (code: string) => void;
}) {
  const unread = words.wildSound(tile) === null;
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm" data-testid="kumimoji-tile-adjustment">
      <span>{language === "japanese" ? "This wild tile is the kana" : "This wild tile is the letter"}</span>
      <select
        className="rounded border border-rule bg-paper px-2 py-1 text-ink"
        value={unread ? "" : tile}
        onChange={(event) => onChoose(event.target.value)}
        disabled={disabled}
        data-testid="kumimoji-tile-reading"
      >
        {unread ? <option value="">Choose reading</option> : null}
        {words.wildOptions.map((face) => {
          const code = words.wildFor(face);
          return code === null ? null : <option key={code} value={code}>{face}</option>;
        })}
      </select>
    </label>
  );
}

/** The tile under the finger while it is dragged. */
export function KumimojiGhost({ ghost }: { ghost: { x: number; y: number; letter: string } | null }) {
  if (ghost === null) return null;
  return (
    <span
      className={`${TILE} pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 shadow-lg`}
      style={{ left: ghost.x, top: ghost.y, width: HAND_TILE_PX + 8, height: HAND_TILE_PX + 8, fontSize: tileLetterPx(HAND_TILE_PX + 8) }}
      data-testid="kumimoji-ghost"
      aria-hidden="true"
    >
      {ghost.letter}
    </span>
  );
}
