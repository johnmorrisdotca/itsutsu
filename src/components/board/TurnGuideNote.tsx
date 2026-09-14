import { turnGuideWords } from "./turnGuide";
import type { TurnGuideNoteProps } from "./board.types";

/**
 * The turn guide in words, under the board.
 *
 * Always present on a board being played, even when it has nothing to say, so
 * that a screen reader is listening before the words arrive: a live region that
 * appears together with its text is one that is often never announced. The rule
 * — "You must capture." — is shown to everybody; the list of choices by name is
 * for a screen reader, since a sighted player has the marking on the board.
 */
export function TurnGuideNote({ guide, size }: TurnGuideNoteProps) {
  const words = guide === null ? null : turnGuideWords(guide, size);
  return (
    <p
      aria-live="polite"
      data-testid="turn-guide"
      className={words?.shown ? "col-span-2 pt-2 text-center text-sm font-semibold" : "col-span-2 sr-only"}
    >
      {words?.shown ?? null}
      {words !== null ? <span className="sr-only"> {words.spoken}</span> : null}
    </p>
  );
}
