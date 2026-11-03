"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SELECTABLE } from "@/components/ui/ui.constants";

/**
 * WHAT THE HIDDEN WORD MEANT, quietly, once the round is over (John, 2026-11-02: "so subtle as to not ruin the UX").
 * One line a word, in the room it will take before it is known: a word the dictionary has nothing quiet to say of keeps
 * its blank line, so the card never grows when the answer arrives. It is drawn only after the round has ended (the
 * page asks for the meanings only then, `useHiddenMeanings`), so it never gives the word away.
 */
export function WordMeaning({ words, lines, className = "" }: { words: readonly string[]; lines: readonly (string | null)[]; className?: string }) {
  const say = useSpeaker();
  return (
    <div className={`${SELECTABLE} flex flex-col ${className}`} data-testid="word-meaning">
      {words.map((word, at) => {
        const line = lines[at] ?? null;
        return (
          <p key={`${at}-${word}`} className="min-h-5 text-sm text-muted" data-testid="word-meaning-line" data-found={line === null ? "false" : "true"}>
            {line === null ? " " : say.say("pword.meaning.of", { word, meaning: line })}
          </p>
        );
      })}
    </div>
  );
}
