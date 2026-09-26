import Link from "@/components/ui/Link";

import { Paired } from "@/components/i18n/Paired";
import { setUpPath } from "@/lib/gomoku/slugs";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PRACTICE_COPY } from "./game.constants";
import { SECTION_TITLE } from "@/components/ui/ui.constants";

/**
 * THIS IS A PRACTICE BOARD, SAID ON THE BOARD ITSELF.
 *
 * John, 2026-09-21: "you need to know it's a practice, not a real match."
 *
 * The danger is exactly that it looks right. It is the same board, the same
 * stones and the same rules as a match — that is what makes it worth
 * practising on — and it has no opponent, no clock, no rating and no record.
 * Somebody who has pasted another site's game into it is looking at a position
 * that never happened here, on a board that looks like one that did.
 *
 * SAID IN WHAT IT IS NOT, because that is the question. "Practice board" alone
 * reads as a label on a feature; a reader wants to know whether this counts,
 * and the answer is a list of the four things it is missing.
 *
 * AND IT OFFERS THE WAY OUT. A practice board that cannot become a game is a
 * dead end — the rule this site has about counts and names applies here too —
 * so the real game is one press away, at the address that sets one up.
 */
export function PracticeMark({ variant }: { variant: RuleVariant }) {
  return (
    <section
      className="flex flex-col gap-2 rounded-2xl border border-ochre/50 bg-ochre-soft p-3"
      data-testid="practice-mark"
    >
      <h2 className={SECTION_TITLE}>
        <Paired
          en={PRACTICE_COPY.mark.label}
          kanji={PRACTICE_COPY.mark.kanji}
          kanjiClassName="text-xs font-normal opacity-70"
        />
      </h2>
      <p className="text-xs leading-relaxed text-ink-soft">{PRACTICE_COPY.mark.line}</p>
      <Link
        href={setUpPath(variant)}
        className="self-start text-xs font-medium underline underline-offset-4"
        data-testid="practice-to-real"
      >
        {PRACTICE_COPY.mark.real} →
      </Link>
    </section>
  );
}
