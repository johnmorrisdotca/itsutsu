"use client";

import { useMemo, type ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { MoveCount } from "@/components/history/MoveCount";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { freeCellWon, replayFreeCell } from "@johnmorrisdotca/toranpu/freecell";
import { replaySpider, spiderWon } from "@johnmorrisdotca/toranpu/spider";

import { FreeCellTable } from "./FreeCellTable";
import { SpiderTable } from "./SpiderTable";

/**
 * A FINISHED FREECELL OR SPIDER, played back, as a finished Solitaire is
 * (`SolitaireReplay`): the table as each move left it, from the deal to the
 * last card home (or to where it was given up), with a scrubber and a press
 * either side of it. A list that no longer replays shows the deal, never a
 * table made up.
 */
export function PatienceReplay({ kind, size, givens, moves, at, go }: { kind: "freecell" | "spider"; size: number; givens: string; moves: string; at: number | null; go: (at: number) => void }) {
  const say = useSpeaker();
  const theme = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];
  const played = useMemo(() => {
    if (kind === "freecell") {
      const tables = replayFreeCell(givens, size, moves) ?? replayFreeCell(givens, size, "");
      return tables === null ? null : { count: tables.length, won: freeCellWon(tables[tables.length - 1]), draw: (at: number, look: BoardThemeTokens) => <FreeCellTable table={tables[at]} theme={look} readOnly /> };
    }
    const tables = replaySpider(givens, size, moves) ?? replaySpider(givens, size, "");
    return tables === null ? null : { count: tables.length, won: spiderWon(tables[tables.length - 1]), draw: (at: number, look: BoardThemeTokens) => <SpiderTable table={tables[at]} theme={look} readOnly /> };
  }, [kind, givens, size, moves]);
  if (played === null) return null;
  const last = played.count - 1;
  const viewing = at === null ? last : Math.max(0, Math.min(at, last));
  const step = (to: number) => go(Math.max(0, Math.min(to, last)));
  const table: ReactNode = played.draw(viewing, theme);
  return (
    <>
      <div className="mx-auto w-full" data-focus-board>
        {table}
      </div>
      {last > 0 ? (
        <div className="flex items-center gap-2" data-testid="patience-replay">
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
            data-testid="patience-replay-scrubber"
          />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => step(viewing + 1)} disabled={viewing === last} aria-label={say.say("puzzle.replay.on")}>
            ›
          </button>
          <MoveCount at={viewing} last={last} start={say.say("puzzle.replay.deal")} className="shrink-0 justify-items-end text-sm text-muted" testId="patience-replay-at" />
        </div>
      ) : null}
      <p className="text-sm text-muted">
        {say.say(last === 0 ? "pcard.replay.dealt" : played.won ? "pcard.replay.stepped" : "pcard.replay.givenUp")}
      </p>
    </>
  );
}
