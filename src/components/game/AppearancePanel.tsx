"use client";

import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { BOARD_THEMES, GRID_STYLES, STONE_SETS } from "@/components/board/Board.constants";
import type { BoardTheme, GridStyle, StoneSet } from "@/components/board/board.types";
import { Field, SectionTitle, Select, Toggle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/** A swatch row: pick the surface by looking at it, not by reading its name. */
function ThemeSwatches({ session, actions }: GamePanelProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Board">
      {Object.entries(BOARD_THEMES).map(([key, theme]) => {
        const active = session.appearance.boardTheme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => actions.setAppearance({ boardTheme: key as BoardTheme })}
            aria-pressed={active}
            title={`${theme.label} ${theme.kanji}`}
            data-testid={`board-theme-${key}`}
            className={`size-9 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-moss ${
              active ? "ring-2 ring-ink" : "ring-1 ring-rule-strong"
            }`}
            style={{ background: theme.surface }}
          >
            <span className="sr-only">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StoneSwatches({ session, actions }: GamePanelProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Stones">
      {Object.entries(STONE_SETS).map(([key, set]) => {
        const active = session.appearance.stoneSet === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => actions.setAppearance({ stoneSet: key as StoneSet })}
            aria-pressed={active}
            title={`${set.label} ${set.kanji}`}
            data-testid={`stone-set-${key}`}
            className={`flex size-9 items-center justify-center gap-0.5 rounded-lg bg-rule outline-none transition focus-visible:ring-2 focus-visible:ring-moss ${
              active ? "ring-2 ring-ink" : "ring-1 ring-rule-strong"
            }`}
          >
            <span className="size-3 rounded-full" style={{ background: set.black }} />
            <span className="size-3 rounded-full" style={{ background: set.white }} />
            <span className="sr-only">{set.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppearancePanel(props: GamePanelProps) {
  const { session, actions } = props;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle kanji={GAME_COPY.appearance.kanji}>
        {GAME_COPY.appearance.label}
      </SectionTitle>
      <ThemeSwatches {...props} />
      <StoneSwatches {...props} />
      <Field label="Grid" hint={GRID_STYLES[session.appearance.grid].hint}>
        <Select
          value={session.appearance.grid}
          onChange={(event) => actions.setAppearance({ grid: event.target.value as GridStyle })}
          data-testid="grid-style"
        >
          {Object.entries(GRID_STYLES).map(([key, style]) => (
            <option key={key} value={key}>
              {style.label} · {style.kanji}
            </option>
          ))}
        </Select>
      </Field>
      <Toggle
        label="Coordinates"
        checked={session.appearance.showCoordinates}
        onChange={(next) => actions.setAppearance({ showCoordinates: next })}
      />
      <Toggle
        label="Move numbers"
        checked={session.appearance.showMoveNumbers}
        onChange={(next) => actions.setAppearance({ showMoveNumbers: next })}
        hint="Numbers the stones as a printed game record does."
      />
      <Toggle
        label="Turn the board round"
        checked={session.appearance.flipped ?? boardStartsFlipped(session.state.settings, session.state.opener)}
        onChange={(next) => actions.setAppearance({ flipped: next })}
        hint="Your own view: the far side of the board nearest you, letters and numbers with it. Nobody else's board moves."
      />
    </section>
  );
}
