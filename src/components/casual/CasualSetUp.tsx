"use client";

import { useState } from "react";

import Link from "@/components/ui/Link";
import { PANEL_CLASS, PLAY_BUTTON, SECTION_TITLE } from "@/components/ui/ui.constants";
import { SET_UP_PREVIEW_BOX } from "@/components/live/live.constants";
import { CASUAL_SPECS } from "@/lib/casual/casual.constants";
import type { CasualKind } from "@/lib/casual/casual.types";
import { goingLevel, nextLevel, wonLevels } from "@/lib/casual/casualProgress";
import { casualPlayPath } from "@/lib/gomoku/slugs";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CasualBoardClient } from "./CasualBoardClient";
import { useCasualSave } from "./casualStore";
import { casualWords } from "@/components/casual/casualWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A CASUAL GAME'S SET-UP, at /games/<slug>/new: which level, and Start.
 *
 * The only choice a casual game has. Beside it the live board at the level
 * chosen, with nothing to touch, as every set-up preview on this site is the
 * board itself. The level Start plays begins as the first not yet won (the
 * one in progress, when there is one), read from this browser once it is
 * asked.
 *
 * NOTHING HERE CHANGES HEIGHT when a level is chosen (AGENTS.md): the preview
 * is one fixed box whatever shape the board is, each level is a tile of one
 * size with a line for its state that is kept even when empty, and the
 * paragraph under Start does not depend on the choice.
 */
export function CasualSetUp({ kind }: { kind: CasualKind }) {
  const say = useSpeaker();
  const CASUAL_COPY = casualWords(say.locale);
  const hydrated = useHydrated();
  const save = useCasualSave();
  const [chosen, setChosen] = useState<number | null>(null);
  const spec = CASUAL_SPECS[kind];
  const story = kind === "choiceStory";
  const won = save === undefined ? [] : wonLevels(save, kind);
  const going = save === undefined ? null : goingLevel(save, kind);
  const level = chosen ?? going ?? (save === undefined ? 1 : nextLevel(save, kind));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start" data-testid="casual-set-up" data-kind={kind} {...readyMark(hydrated)}>
      <div className={SET_UP_PREVIEW_BOX} data-testid="casual-preview">
        {/* One box for every board: a taller or wider one sits in it and the page does not move. */}
        <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-md border border-rule bg-ivory">
          <CasualBoardClient kind={kind} level={level} readOnly testId="casual-preview-board" />
        </div>
      </div>
      <div className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>
            {CASUAL_COPY.levels} <span className="font-mincho normal-case tracking-normal">{CASUAL_COPY.setUpKanji}</span>
          </legend>
          <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-[repeat(5,6.75rem)]" role="radiogroup" aria-label={CASUAL_COPY.levels}>
            {Array.from({ length: spec.levels }, (_, index) => index + 1).map((option) => {
              const state = won.includes(option) ? "won" : going === option ? "going" : "fresh";
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={option === level}
                  onClick={() => setChosen(option)}
                  data-testid="casual-level"
                  data-level={option}
                  data-state={state}
                  className={`flex h-[4.5rem] min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-moss ${
                    option === level ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory hover:bg-rule/60"
                  }`}
                >
                  <span className="text-2xl leading-none font-semibold tabular-nums">{option}</span>
                  <span className="h-4 text-[0.7rem] leading-4">{state === "won" ? CASUAL_COPY.won : state === "going" ? CASUAL_COPY.going : ""}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <Link href={casualPlayPath(kind, level)} className={PLAY_BUTTON} data-testid="casual-start">
          {CASUAL_COPY.start(level, story)}
        </Link>
        <p className="min-h-10 text-xs text-muted" data-testid="casual-kept">
          {save === undefined ? "" : CASUAL_COPY.wonOf(won.length, spec.levels, story)}. {CASUAL_COPY.never}
        </p>
      </div>
    </div>
  );
}
