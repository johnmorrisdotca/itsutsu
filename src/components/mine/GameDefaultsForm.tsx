"use client";

import { useState } from "react";

import { Select, Toggle } from "@/components/ui/Controls";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { DEFAULT_GAME_DEFAULTS, type GameDefaults } from "@/components/game/gameDefaults";
import { GAME_COPY } from "@/components/game/game.constants";
import { TIME_CONTROLS, TIME_CONTROL_DISPLAY } from "@/lib/clock/clock.constants";
import { BOARD_SIZES, DRAW_LIMIT_DISPLAY, DRAW_LIMIT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { DrawLimit } from "@/lib/gomoku/gomoku.types";
import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";
import { describeMoveTime } from "@/lib/history/deadline";

/**
 * Where a new game starts for this member.
 *
 * The same handful of choices were being made again on every game and on
 * every device. Made once here, they are what a new board is set out with.
 *
 * They are a starting point and nothing else, which the note at the foot
 * says plainly: a game already under way is never touched by them, because
 * the settings on a board are what the two players agreed to and not a
 * preference either of them can change from another page.
 */
export function GameDefaultsForm({ initial }: { initial: GameDefaults }) {
  const [fields, setFields] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (next: Partial<GameDefaults>) => {
    setFields((current) => ({ ...current, ...next }));
    setSaved(false);
  };

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameDefaults: fields }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "That could not be saved.");
        return;
      }
      setSaved(true);
    } catch {
      setError("That could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  /*
   * The same race the sentence on the games page has: these are real selects
   * before React has attached to them, and a choice made then is lost. A spec
   * that opened this page and chose in the same breath saved nothing and
   * reported no error, because there was nothing wrong with what it saved.
   */
  return (
    <div className="flex flex-col gap-4" data-testid="game-defaults" {...readyMark(useHydrated())}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Board</span>
        <Select
          value={String(fields.size)}
          onChange={(event) => set({ size: Number(event.target.value) })}
          data-testid="default-size"
        >
          {BOARD_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}×{size}
            </option>
          ))}
        </Select>
        <span className="text-xs text-muted">
          Games played on a board of their own — Hex, Halma, the small ones — keep theirs.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Clock at this screen</span>
        <Select
          value={fields.timeControl}
          onChange={(event) => set({ timeControl: event.target.value as GameDefaults["timeControl"] })}
          data-testid="default-time-control"
        >
          {(Object.keys(TIME_CONTROLS) as (keyof typeof TIME_CONTROLS)[]).map((name) => (
            <option key={name} value={name}>
              {TIME_CONTROL_DISPLAY[name].label}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Clock in a game on two devices</span>
        <Select
          value={fields.moveTimeMs === null ? "none" : String(fields.moveTimeMs)}
          onChange={(event) =>
            set({ moveTimeMs: event.target.value === "none" ? null : Number(event.target.value) })
          }
          data-testid="default-move-time"
        >
          {MOVE_TIME_OPTIONS.map((ms) => (
            <option key={ms === null ? "none" : ms} value={ms === null ? "none" : String(ms)}>
              {ms === null ? "No clock" : describeMoveTime(ms)}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Length</span>
        <Select
          value={fields.drawLimit}
          onChange={(event) => set({ drawLimit: event.target.value as DrawLimit })}
          data-testid="default-draw-limit"
        >
          {DRAW_LIMIT_LIST.map((limit) => (
            <option key={limit} value={limit}>
              {DRAW_LIMIT_DISPLAY[limit].label} {DRAW_LIMIT_DISPLAY[limit].kanji}
            </option>
          ))}
        </Select>
        <span className="text-xs text-muted">
          Only on a board of nine by nine or larger, and never on a game that cannot be drawn.
        </span>
      </label>

      <Toggle
        label="Games on two devices count towards ratings"
        checked={fields.rated}
        onChange={(next) => set({ rated: next })}
        hint="Off, and a shared game you start is friendly: the result is kept but no rating moves."
      />
      <Toggle
        label="Allow taking moves back"
        checked={fields.allowUndo}
        onChange={(next) => set({ allowUndo: next })}
        hint="Switch off for a game where every stone is final."
      />
      <Toggle
        label="Allow skipping a turn"
        checked={fields.allowSkip}
        onChange={(next) => set({ allowSkip: next })}
        hint={GAME_COPY.skipHint}
      />
      <Toggle
        label="Allow swapping seats"
        checked={fields.allowSwap}
        onChange={(next) => set({ allowSwap: next })}
        hint={GAME_COPY.swapHint}
      />
      <Toggle
        label="Allow resizing the board"
        checked={fields.allowResize}
        onChange={(next) => set({ allowResize: next })}
        hint={GAME_COPY.resizeHint}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}
          data-testid="save-game-defaults"
        >
          Save these
        </button>
        <button
          type="button"
          onClick={() => set(DEFAULT_GAME_DEFAULTS)}
          className={`${BUTTON_BASE} px-3 text-xs`}
          data-testid="reset-game-defaults"
        >
          Back to the ordinary ones
        </button>
        {saved ? <span className="text-xs text-moss">Saved.</span> : null}
        {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
      </div>
      <p className="text-xs text-muted">
        These are where a new game starts, and nothing more. A game already under way keeps the settings it was
        begun with, because those are what both players agreed to — changing anything here will not reach it.
      </p>
    </div>
  );
}
