"use client";

import { SectionTitle } from "@/components/ui/Controls";
import { INPUT_CLASS } from "@/components/ui/ui.constants";
import { GAME_COPY } from "./game.constants";
import { useGameNotes } from "./useGameNotes";

/** Private notes on this game. Yours, in this browser, and nobody else's. */
export function NotesPanel({ gameKey }: { gameKey: string }) {
  const notes = useGameNotes(gameKey);

  return (
    <section className="flex flex-col gap-2" data-testid="notes-panel">
      <SectionTitle kanji={GAME_COPY.notes.kanji}>{GAME_COPY.notes.label}</SectionTitle>
      <p className="text-xs text-muted">{GAME_COPY.notesHint}</p>
      <textarea
        className={`${INPUT_CLASS} min-h-24 resize-y font-normal`}
        value={notes.text}
        onChange={(event) => notes.update(event.target.value)}
        placeholder={GAME_COPY.notesPlaceholder}
        aria-label={GAME_COPY.notes.label}
        disabled={!notes.loaded}
        maxLength={4000}
        data-testid="game-notes"
      />
    </section>
  );
}
