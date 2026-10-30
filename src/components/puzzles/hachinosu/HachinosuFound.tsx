"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { wordPoints } from "@/lib/puzzles/hachinosu/code";

/** Words as chips, a four-letter word plain and a longer one showing it is worth more; found words are data, so they can be selected and copied. */
export function HachinosuWords({ words, testId }: { words: readonly string[]; testId: string }) {
  const say = useSpeaker();
  if (words.length === 0) return <p className="text-sm text-muted">{say.say("pword.hachinosu.noWords")}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5 text-sm select-text" data-testid={testId}>
      {words.map((word) => (
        <li key={word} className="rounded-md border border-rule px-2 py-0.5" data-word={word} data-points={wordPoints(word)}>
          {word}
        </li>
      ))}
    </ul>
  );
}
