"use client";

import { useId } from "react";

import { Paired } from "@/components/i18n/Paired";
import { SECTION_TITLE } from "@/components/ui/ui.constants";

import type { SetUpSectionProps } from "./setUp.types";

/**
 * ONE GROUP OF CHOICES ON THE SET-UP SCREEN, under a heading that says what it
 * is: who you play, the rules, a handicap.
 *
 * John, finding the opponent and every rule behind a grey line and a small ›:
 * "Why can't I choose someone in this Halma page? … where are the options to
 * change other settings? … so very hard to see..." They were all there, folded.
 * So a long form is made readable the ordinary way — a heading over each group
 * and a rule between them — rather than by hiding most of it.
 *
 * A GROUP IS STILL A HEADING; A SETTLED CHOICE IS A ROW SAYING WHAT IT IS.
 * `SetUpFold` folds the choices that already have an answer — the opening, the
 * opponent, the ratings, the handicap — down to one row that prints the answer
 * and the way to change it (John again, 2026-09-18, on a screen he had mostly
 * already settled). That is not what this comment was written against: the fold
 * it was written against said nothing at all about what it was hiding. This
 * component is still what heads a group of them, and folds nothing itself.
 */
export function SetUpSection({ title, kanji, testId, children }: SetUpSectionProps) {
  const heading = useId();
  return (
    <section
      aria-labelledby={heading}
      className="flex min-w-0 flex-col gap-3 border-t border-rule pt-3"
      data-testid={testId}
    >
      <h3 id={heading} className={SECTION_TITLE}>
        <Paired en={title} kanji={kanji} kanjiClassName="font-mincho normal-case tracking-normal" />
      </h3>
      {children}
    </section>
  );
}
