"use client";

import { useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { SECTION_TITLE } from "@/components/ui/ui.constants";
import { SET_UP_COPY } from "./live.constants";
import { ANSWER_BODY_GAP, ANSWER_PART, ANSWER_SPREAD } from "./picker.constants";
import type { SetUpFoldProps } from "./setUp.types";

/**
 * A CHOICE ALREADY MADE, FOLDED DOWN TO WHAT IT IS.
 *
 * John, 2026-09-18, on setting up a game he had mostly already settled — a
 * rematch above all: "we see a lot of options again which we have to scroll
 * through. We should actually collapse certain sections, so that the user sees
 * what was selected, and if they want to change it, they tap it… Pro is
 * selected… I wouldn't change it… Same goes for The computer. Keep it closed to
 * Guoshou and only change if I click to expand it."
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS SCREEN HAS FOLDED BEFORE AND IT WAS WRONG, SO READ WHY THIS DIFFERS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every choice here used to sit behind one grey line and a small ›, and John's
 * words then were the opposite of these: "Why can't I choose someone in this
 * Halma page? … where are the options to change other settings? … so very hard
 * to see". Folding was taken out for that, and `SetUpSection` still says so.
 *
 * The difference is not how much is hidden but what the closed state SAYS. That
 * fold hid a heading behind a heading: you could not tell what was inside, or
 * that anything was. This one prints the answer — the picture, the name, the
 * words — and the way to change it, so the closed row carries the whole fact and
 * the control is named rather than implied. Nothing is hidden that was not
 * already decided, and one tap is the whole cost of disagreeing.
 *
 * TWO THINGS IT DOES ON PURPOSE:
 *
 *  - **It stays open until it is shut.** It used to fold itself back up the
 *    moment a new value arrived, which reads well with a mouse and is wrong: a
 *    radio group is walked with the ARROW KEYS, every press is a new value, and
 *    the group closed under the first one and took the keyboard's focus with
 *    it. `set-up-choices.spec.ts` pressed an arrow and found focus nowhere,
 *    which is exactly what a keyboard reader would have found. The summary on
 *    the row is live, so the answer is watched changing rather than announced
 *    by the fold shutting.
 *  - **It never hides a question nobody has answered.** `openInitially` is for
 *    the screen where the choice IS the errand — a game being composed from
 *    nothing — and the folded form is for the screen that arrives already
 *    filled in. A fold whose summary would be blank is a fold that is hiding a
 *    question, which is the fault above wearing a summary.
 */
export function SetUpFold({
  title,
  kanji,
  summary,
  testId,
  openInitially = false,
  group,
  place,
  children,
}: SetUpFoldProps) {
  const [open, setOpen] = useState(openInitially);

  return (
    <section
      /*
       * In a row of answers (`place`), laid over the whole row so that its
       * button keeps its own column and its choices open on a line under the
       * row — see `answerRow.ts`. Standing alone, the column it always was.
       */
      className={`flex min-w-0 flex-col gap-2 ${place === undefined ? "" : ANSWER_SPREAD}`}
      style={place?.section}
      data-testid={testId}
      data-group={group}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        /*
         * `grow`: in a row of answers the cells are as tall as the tallest —
         * the posted-seat tile, with its 70px mark — and a closed row that
         * stopped at its own height would leave a strip of nothing under it.
         * Grown, every closed answer is one card of one height with its words
         * in the middle. In a column it has nothing to grow into.
         */
        className={`flex w-full min-w-0 grow cursor-pointer items-center justify-between gap-3 rounded-xl border border-rule px-3 py-2 text-left hover:border-ink/30 ${
          place === undefined ? "" : ANSWER_PART
        }`}
        style={place?.head}
        data-testid={`${testId}-change`}
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className={SECTION_TITLE}>
            <Paired en={title} kanji={kanji} kanjiClassName="font-mincho normal-case tracking-normal" />
          </span>
          {/*
            THE ANSWER, ON THE CLOSED ROW. This is the whole of what makes this
            fold honest, so it is drawn whether the fold is open or shut: a row
            that says what is chosen does not stop being true while you are
            changing it, and a summary that vanishes on opening would take the
            reader's place on the screen with it.
          */}
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">{summary}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-muted uppercase" aria-hidden="true">
          {open ? SET_UP_COPY.fold.done : SET_UP_COPY.fold.change}
        </span>
      </button>
      {/*
        THE CONTROLS STAY IN THE PAGE, HIDDEN — not unmounted.
        A fold that tears its children out is a form whose radios come and go:
        the chosen one stops existing while it is folded, so anything reading
        what is chosen — this site's own specs among them — finds nothing at
        all rather than an answer it cannot click. `hidden` is the same thing a
        reader sees and the right thing a screen reader hears, and the state of
        the group is kept by the inputs themselves the whole time.
      */}
      <div
        className={`flex min-w-0 flex-col gap-2 pt-1 ${place === undefined ? "" : `${ANSWER_PART} ${ANSWER_BODY_GAP}`}`}
        style={place?.body}
        hidden={!open}
      >
        {children}
      </div>
    </section>
  );
}
