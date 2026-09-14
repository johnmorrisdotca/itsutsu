import { GameCount } from "@/components/games/GameCount";
import { countText } from "@/lib/rating/figures";
import type { ImportedNote } from "@/lib/xp/importedNote";

/**
 * The line under a total that includes credit for another site's record.
 *
 * The sentence comes worded from `importedNoteText`, with `{games}` standing
 * where the count goes; the count is a `GameCount` with `here={false}`, because
 * those games were played somewhere else and there is nothing on this site to
 * open — the exception AGENTS.md's "Nothing Is A Dead End" makes, said in the
 * source rather than by leaving a link off.
 */
export function ImportedXpNote({ note, testId = "xp-imported-note" }: { note: ImportedNote; testId?: string }) {
  const [before, after] = note.text.split("{games}");
  return (
    <span className="block text-[0.7rem] leading-snug text-muted" data-testid={testId}>
      {before}
      {note.games === null || after === undefined ? null : (
        <>
          <GameCount count={countText(note.games)} here={false} testId={`${testId}-games`} />
          {after}
        </>
      )}
    </span>
  );
}
