"use client";

import { boardStartsFlipped } from "@/lib/gomoku/orientation";
import { BOARD_THEMES, GRID_STYLES, STONE_SETS } from "@/components/board/Board.constants";
import { boardPatchLook, FeltUnderBoard } from "@/components/board/FeltPatches";
import type { BoardTheme, GridStyle, StoneSet } from "@/components/board/board.types";
import { dottedName, gridStyleName, nameWithKanji, stoneSetName, themeName } from "@/components/board/boardNames";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Field, SectionTitle, Select, Toggle } from "@/components/ui/Controls";
import { gameCopy } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/** A swatch row: pick the surface by looking at it, not by reading its name — each a bit of that board, as the felt patches are (`boardPatchLook`). */
function ThemeSwatches({ session, actions }: GamePanelProps) {
  const say = useSpeaker();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={say.say("gamescreen.boardGroup")}>
      {Object.entries(BOARD_THEMES).map(([key, theme]) => {
        const active = session.appearance.boardTheme === key;
        const name = themeName(say, key as BoardTheme);
        return (
          <button
            key={key}
            type="button"
            onClick={() => actions.setAppearance({ boardTheme: key as BoardTheme })}
            aria-pressed={active}
            title={nameWithKanji(name)}
            data-testid={`board-theme-${key}`}
            className={`size-9 cursor-pointer rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-moss ${
              active ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "ring-1 ring-rule-strong"
            }`}
            style={boardPatchLook(theme)}
          >
            <span className="sr-only">{name.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StoneSwatches({ session, actions }: GamePanelProps) {
  const say = useSpeaker();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={say.say("gamescreen.stones")}>
      {Object.entries(STONE_SETS).map(([key, set]) => {
        const active = session.appearance.stoneSet === key;
        const name = stoneSetName(say, key as StoneSet);
        return (
          <button
            key={key}
            type="button"
            onClick={() => actions.setAppearance({ stoneSet: key as StoneSet })}
            aria-pressed={active}
            title={nameWithKanji(name)}
            data-testid={`stone-set-${key}`}
            className={`flex size-9 cursor-pointer items-center justify-center gap-0.5 rounded-lg bg-rule outline-none transition focus-visible:ring-2 focus-visible:ring-moss ${
              active ? "ring-2 ring-ink" : "ring-1 ring-rule-strong"
            }`}
          >
            <span className="size-3 rounded-full" style={{ background: set.black }} />
            <span className="size-3 rounded-full" style={{ background: set.white }} />
            <span className="sr-only">{name.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppearancePanel(props: GamePanelProps) {
  const { session, actions } = props;
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle kanji={GAME_COPY.appearance.kanji}>
        {GAME_COPY.appearance.label}
      </SectionTitle>
      <ThemeSwatches {...props} />
      {/* A Reversi board is cloth, so the wood above does not reach it until Your board is chosen here. */}
      <FeltUnderBoard appearance={session.appearance} variant={session.state.settings.variant} onChoose={(felt) => actions.setAppearance({ felt })} />
      <StoneSwatches {...props} />
      <Field label={say.say("gamescreen.grid")} hint={gridStyleName(say, session.appearance.grid).hint}>
        <Select
          value={session.appearance.grid}
          onChange={(event) => actions.setAppearance({ grid: event.target.value as GridStyle })}
          data-testid="grid-style"
        >
          {Object.keys(GRID_STYLES).map((key) => (
            <option key={key} value={key}>
              {dottedName(gridStyleName(say, key as GridStyle))}
            </option>
          ))}
        </Select>
      </Field>
      <Toggle
        label={say.say("gamescreen.coordinates")}
        checked={session.appearance.showCoordinates}
        onChange={(next) => actions.setAppearance({ showCoordinates: next })}
      />
      <Toggle
        label={say.say("gamescreen.moveNumbers")}
        checked={session.appearance.showMoveNumbers}
        onChange={(next) => actions.setAppearance({ showMoveNumbers: next })}
        hint={say.say("gamescreen.moveNumbersHint")}
      />
      <Toggle
        label={say.say("gamescreen.flip")}
        checked={session.appearance.flipped ?? boardStartsFlipped(session.state.settings, session.state.opener)}
        onChange={(next) => actions.setAppearance({ flipped: next })}
        hint={say.say("gamescreen.flipHint")}
      />
    </section>
  );
}
