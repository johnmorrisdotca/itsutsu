"use client";

import { useMemo } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { MoveCount } from "@/components/history/MoveCount";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { klondikeWon, replay } from "@johnmorrisdotca/toranpu/klondike";
import { solitaireRules } from "@/lib/puzzles/solitaire/generate";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { SolitaireTable } from "./SolitaireTable";

/**
 * A FINISHED SOLITAIRE, played back: the table as each move left it, from the
 * deal to the last card home (or to where it was given up), with a scrubber
 * and a press either side of it. The moves are the game (`solitaire/code.ts`),
 * so every table on the way is replayed from them here, in the browser; a list
 * that no longer replays shows the deal and says so, never a table made up.
 */
export function SolitaireReplay({ size, level, givens, moves, at, go }: { size: number; level: PuzzleLevel; givens: string; moves: string; at: number | null; go: (at: number) => void }) {
  const say = useSpeaker();
  const tables = useMemo(() => replay(givens, solitaireRules(size, level), moves) ?? replay(givens, solitaireRules(size, level), ""), [givens, size, level, moves]);
  if (tables === null) return null;
  const last = tables.length - 1;
  const viewing = at === null ? last : Math.max(0, Math.min(at, last));
  const table = tables[viewing];
  const step = (to: number) => go(Math.max(0, Math.min(to, last)));
  return (
    <>
      <div className="mx-auto w-full" data-focus-board>
        <SolitaireTable table={table} theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} readOnly />
      </div>
      {last > 0 ? (
        <div className="flex items-center gap-2" data-testid="solitaire-replay">
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing - 1)} disabled={viewing === 0} aria-label={say.say("puzzle.replay.back")}>
            ‹
          </button>
          <input
            type="range"
            min={0}
            max={last}
            value={viewing}
            onChange={(event) => step(Number(event.target.value))}
            className="min-w-0 flex-1 accent-moss"
            aria-label={say.say("puzzle.replay.move")}
            data-testid="solitaire-replay-scrubber"
          />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing + 1)} disabled={viewing === last} aria-label={say.say("puzzle.replay.on")}>
            ›
          </button>
          <MoveCount at={viewing} last={last} start={say.say("puzzle.replay.deal")} className="shrink-0 justify-items-end text-sm text-muted" testId="solitaire-replay-at" />
        </div>
      ) : null}
      <p className="text-sm text-muted">
        {say.say(last === 0 ? "pcard.replay.dealt" : klondikeWon(tables[last]) ? "pcard.replay.stepped" : "pcard.replay.givenUp")}
      </p>
    </>
  );
}
