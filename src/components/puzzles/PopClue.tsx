import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { colonOf } from "@/lib/puzzles/puzzleText";
import { popCategoryOf } from "@/lib/puzzles/gomoji/popWords";

/**
 * POP GOMOJI'S CLUE: the category each hidden word comes from, above the
 * board from the first guess. John, 2026-09-26: "each word with its category
 * shown as the clue". A Futago's two words show both, in order. A word with no
 * category — a day's word from a list since changed — shows nothing rather
 * than a wrong one.
 */
export function PopClue({ words }: { words: readonly string[] }) {
  const say = useSpeaker();
  const clues = words.map((word) => popCategoryOf(word));
  if (clues.some((clue) => clue === null)) return null;
  return (
    <p className="text-sm text-ink-soft" data-testid="pop-clue" data-clues={clues.join("|")}>
      {say.say(clues.length > 1 ? "pword.pop.categories" : "pword.pop.category")}{colonOf(say)}<strong className="font-semibold text-ink">{clues.join(" · ")}</strong>
    </p>
  );
}
