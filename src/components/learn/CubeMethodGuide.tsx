"use client";

import { useState } from "react";
import type { SolveStage } from "@johnmorrisdotca/kyuubu";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SectionHeading } from "@/components/layout/Headings";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import type { LessonSpeed } from "@/lib/learn/cubeLesson";
import { cubeGuideCopy, cubeStageWords, CUBE_STAGES_BY_SIZE } from "@/lib/learn/cubeMethod";
import type { TaughtSize } from "@/lib/learn/cubePractice";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CubePractice } from "./CubePractice";

/**
 * THE METHOD, STEP BY STEP, WITH A CUBE TO TRY EACH ON (`/learn/cube`). Every
 * stage is told in words (`cubeMethod.ts`), and one at a time opens a live
 * cube where that stage is the next thing to do (`practiceCube`): turn it
 * until the step is done, be shown the turns on the cube, or watch them played at a pace that can be followed (`CubePractice`). One cube
 * on the page at once, so the page stays light and its keys stay its own.
 */
export function CubeMethodGuide() {
  const hydrated = useHydrated();
  const say = useSpeaker();
  const CUBE_GUIDE_COPY = cubeGuideCopy(say);
  const CUBE_STAGE_WORDS = cubeStageWords(say);
  const [n, setN] = useState<TaughtSize>(3);
  const [practising, setPractising] = useState<SolveStage | null>(null);
  // How fast a step is played, kept from one step to the next: somebody who chose slow wants slow on the next.
  const [speed, setSpeed] = useState<LessonSpeed>("normal");
  const stages = CUBE_STAGES_BY_SIZE[n];
  return (
    <div className="flex flex-col gap-6" data-testid="cube-method" data-size={String(n)} {...readyMark(hydrated)}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={CUBE_GUIDE_COPY.sizeLabel}>
        {([3, 2] as const).map((size) => (
          <button
            key={size}
            type="button"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`}
            aria-pressed={n === size}
            onClick={() => {
              setN(size);
              setPractising(null);
            }}
            data-testid={`cube-method-size-${size}`}
          >
            {CUBE_GUIDE_COPY.sizes[size]}
          </button>
        ))}
      </div>
      {n === 2 ? <p className="text-sm leading-relaxed">{CUBE_GUIDE_COPY.twoByTwo}</p> : null}
      <ol className="flex flex-col gap-6">
        {stages.map((stage, at) => {
          const words = CUBE_STAGE_WORDS[stage];
          return (
            <li key={stage} className="flex flex-col gap-2" data-testid="cube-method-stage" data-stage={stage}>
              <SectionHeading title={`${at + 1}. ${words.title}`} />
              <p className="text-sm leading-relaxed">{words.aim}</p>
              <p className="text-sm leading-relaxed">{words.how}</p>
              {practising === stage ? (
                <CubePractice key={`${n}-${stage}`} n={n} stage={stage} speed={speed} onSpeed={setSpeed} />
              ) : (
                <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} self-start`} onClick={() => setPractising(stage)} data-testid="cube-method-practise">
                  {CUBE_GUIDE_COPY.practise}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
