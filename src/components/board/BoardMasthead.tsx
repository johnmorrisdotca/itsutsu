import { BrandWordmark } from "@/components/layout/BrandMarks";

import type { BoardStory } from "./board.types";

/**
 * THE SMALL HEADER OVER A BOARD SHOWN ON ITS OWN. John, 2026-09-26, at a
 * finished game read as just the board: "These simple modals lack any Itsutsu
 * branding… shows our logo, explains this is a Game review… we must make sure
 * that we are not taking credit for the games if we're showing another place's
 * stuff… Still needs to be simple, clean, subtle."
 *
 * The wordmark, small; what the view is; the game; and where it came from —
 * "Played on Itsutsu" only for a game that was, and the record's own source,
 * linked, for a famous game or one kept from another site. One component for
 * the board opened on its own (`BoardFocus`) and for Just the board.
 */
export function BoardMasthead({ story }: { story: BoardStory }) {
  return (
    <header className="flex min-w-0 items-center gap-3 border-b border-rule pb-2" data-testid="board-masthead">
      <BrandWordmark className="h-5 w-auto shrink-0 sm:h-6" />
      <span className="h-8 w-px shrink-0 bg-rule-strong" aria-hidden="true" />
      <div className="min-w-0 leading-tight">
        <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted uppercase">
          {story.kind} <span className="font-mincho tracking-normal normal-case">{story.kanji}</span>
        </p>
        <p className="truncate text-sm font-medium text-ink" data-testid="board-masthead-title">
          {story.title}
        </p>
        <p className="truncate text-xs text-muted" data-testid="board-masthead-source">
          {story.source}
        </p>
      </div>
    </header>
  );
}
