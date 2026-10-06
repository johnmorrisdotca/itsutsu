"use client";

import { useId, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Select, Toggle } from "@/components/ui/Controls";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { DEFAULT_GAME_DEFAULTS, type GameDefaults } from "@/components/game/gameDefaults";
import { gameCopy } from "@/components/game/game.constants";
import { TIME_CONTROLS, TIME_CONTROL_DISPLAY } from "@/lib/clock/clock.constants";
import { BOARD_SIZES, DRAW_LIMIT_DISPLAY, DRAW_LIMIT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { DrawLimit } from "@/lib/gomoku/gomoku.types";
import { MOVE_TIME_OPTIONS } from "@/lib/history/moveTime.constants";
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  /*
   * The ids the two notes below are attached with. Each is its select's
   * DESCRIPTION and not part of its name — see `FieldHint` in `Controls.tsx`,
   * which keeps the same rule for every `Field` and `Toggle` on the site.
   * These two are columns rather than rows and so are written out by hand.
   */
  const boardHint = useId();
  const lengthHint = useId();
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
        setError(body?.error ?? say.say("mine.saveFailed"));
        return;
      }
      setSaved(true);
    } catch {
      setError(say.say("mine.saveFailed"));
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
      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{say.say("mine.gdBoard")}</span>
          <Select
            value={String(fields.size)}
            onChange={(event) => set({ size: Number(event.target.value) })}
            aria-describedby={boardHint}
            data-testid="default-size"
          >
            {BOARD_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}×{size}
              </option>
            ))}
          </Select>
        </label>
        <span id={boardHint} className="text-xs text-muted">
          {say.say("mine.gdBoardNote")}
        </span>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{say.say("mine.gdClockOne")}</span>
        <Select
          value={fields.timeControl}
          onChange={(event) => set({ timeControl: event.target.value as GameDefaults["timeControl"] })}
          data-testid="default-time-control"
        >
          {(Object.keys(TIME_CONTROLS) as (keyof typeof TIME_CONTROLS)[]).map((name) => (
            <option key={name} value={name}>
              {say.pairName(TIME_CONTROL_DISPLAY[name].label, TIME_CONTROL_DISPLAY[name].kanji).text}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{say.say("mine.gdClockTwo")}</span>
        <Select
          value={fields.moveTimeMs === null ? "none" : String(fields.moveTimeMs)}
          onChange={(event) =>
            set({ moveTimeMs: event.target.value === "none" ? null : Number(event.target.value) })
          }
          data-testid="default-move-time"
        >
          {MOVE_TIME_OPTIONS.map((ms) => (
            <option key={ms === null ? "none" : ms} value={ms === null ? "none" : String(ms)}>
              {ms === null ? say.say("mine.gdNoClock") : describeMoveTime(ms, say)}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{say.say("mine.gdLength")}</span>
          <Select
            value={fields.drawLimit}
            onChange={(event) => set({ drawLimit: event.target.value as DrawLimit })}
            aria-describedby={lengthHint}
            data-testid="default-draw-limit"
          >
            {DRAW_LIMIT_LIST.map((limit) => (
              <option key={limit} value={limit}>
                {say.pairName(DRAW_LIMIT_DISPLAY[limit].label, DRAW_LIMIT_DISPLAY[limit].kanji).text}
              </option>
            ))}
          </Select>
        </label>
        <span id={lengthHint} className="text-xs text-muted">
          {say.say("mine.gdLengthNote")}
        </span>
      </div>

      <Toggle
        label={say.say("mine.gdRated")}
        checked={fields.rated}
        onChange={(next) => set({ rated: next })}
        hint={say.say("mine.gdRatedHint")}
      />
      <Toggle
        label={say.say("mine.gdUndo")}
        checked={fields.allowUndo}
        onChange={(next) => set({ allowUndo: next })}
        hint={say.say("mine.gdUndoHint")}
      />
      <Toggle
        label={say.say("mine.gdSkip")}
        checked={fields.allowSkip}
        onChange={(next) => set({ allowSkip: next })}
        hint={GAME_COPY.skipHint}
      />
      <Toggle
        label={say.say("mine.gdSwap")}
        checked={fields.allowSwap}
        onChange={(next) => set({ allowSwap: next })}
        hint={GAME_COPY.swapHint}
      />
      <Toggle
        label={say.say("mine.gdResize")}
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
          {say.say("mine.gdSave")}
        </button>
        <button
          type="button"
          onClick={() => set(DEFAULT_GAME_DEFAULTS)}
          className={`${BUTTON_BASE} px-3 text-xs`}
          data-testid="reset-game-defaults"
        >
          {say.say("mine.gdReset")}
        </button>
        {saved ? <span className="text-xs text-moss">{say.say("mine.saved")}</span> : null}
        {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
      </div>
      <p className="text-xs text-muted">
        {say.say("mine.gdNote")}
      </p>
    </div>
  );
}
