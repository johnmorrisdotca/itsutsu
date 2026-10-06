import type { Speaker } from "@/lib/i18n/i18n";

/**
 * The mark beside a rating that was earned against the computer players: the
 * word for them in the reader's own language, with the reason on hover.
 *
 * One component for it because five places drew it and each had its own copy
 * of the class and the word. John, 2026-10-06: the computer players are
 * コンピュータ in Japanese, everywhere. The word is one phrase
 * (`players.botsMark`), so the mark reads "Bots" or "コンピュータ" and never a
 * second script beside it. It is small and may wrap, because a narrow table
 * cell at 390px has less room for six full-width characters than for four
 * letters.
 */
export function ComputerPoolMark({ say, title, testId }: { say: Speaker; title: string; testId: string }) {
  return (
    <span className="ml-1 text-[0.68rem] font-normal opacity-70" title={title} data-testid={testId}>
      {say.say("players.botsMark")}
    </span>
  );
}
