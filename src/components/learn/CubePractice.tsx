"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type RefObject } from "react";
import { Guide, movesNotation, scrubPath, turnAll, undoOf, type CubeMove, type SolveStage, type SolveStep } from "@johnmorrisdotca/kyuubu";
import type { KyuubuHandle } from "@johnmorrisdotca/kyuubu/react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { CubeBoard } from "@/components/puzzles/CubeBoard";
import { CubeReplayPanel } from "@/components/puzzles/CubeReplayPanel";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { CUBE_ALGORITHM_NAMES, CUBE_GUIDE_COPY } from "@/lib/learn/cubeMethod";
import { LESSON_SPEEDS, lessonGap, lessonOf, lessonState, lessonTurnsTo, type CubeLesson, type LessonSpeed } from "@/lib/learn/cubeLesson";
import { practiceCube, stageDone, stageRest, type TaughtSize } from "@/lib/learn/cubePractice";

import { CubeLessonBar } from "./CubeLessonBar";
import { CubeNextTurn } from "./CubeNextTurn";

const THEME = BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];

/** How long a quarter turn takes to show when nothing is being played back: Kyuubu's own pace. */
const HAND_TURN_MS = 160;

/** The turns of a step the reader has asked to be shown, with the guide that follows the reader through them. */
type Shown = { guide: Guide; parts: SolveStep["parts"] };

/** A step played back: where it stands, `at` of `plan.last`. */
type Playing = { plan: CubeLesson; at: number };

/**
 * Whether the cube's hint says to look round the cube first (its `data-hint` is "look": no side of the layer can be seen from where it is looked at), read off the cube so the words say what the arrow does.
 * The cube says it as it draws, so it is asked after it has, and again when it changes.
 */
function useLookRound(box: RefObject<HTMLDivElement | null>): boolean {
  const [look, setLook] = useState(false);
  useEffect(() => {
    const element = box.current;
    if (element === null) return;
    const ask = () => setLook(element.querySelector("[data-kyuubu]")?.getAttribute("data-hint") === "look");
    const watch = new MutationObserver(ask);
    watch.observe(element, { attributes: true, attributeFilter: ["data-hint"], subtree: true });
    const first = requestAnimationFrame(ask);
    return () => {
      cancelAnimationFrame(first);
      watch.disconnect();
    };
  }, [box]);
  return look;
}

/**
 * ONE STEP'S PRACTICE (`/learn/cube`): a cube with that step next, which the
 * reader turns until the step is done, or is shown how, or is played through.
 *
 * SHOW THE TURNS draws the step's next turn on the cube with Kyuubu's own
 * guide (the layer lit and an arrow the way to drag it; for a turn of the whole
 * cube, an arrow across it), says it beside the cube in code and words, and
 * moves on to the next when the reader makes it. A turn that was not the one
 * asked for is said to be one and can be taken back.
 *
 * TURN IT FOR ME plays the step as a lesson: one turn at a time at a pace a
 * person can follow, each said large with what it turns, and the same controls
 * as a finished solve's replay (`CubeReplayPanel`) plus play and pause, a move
 * back and on and how fast. It stays on the last turn when it ends, and the
 * reader can take the cube at any point: a turn made by hand while it is paused
 * carries on from where it stands.
 */
export function CubePractice({ n, stage, speed, onSpeed }: { n: TaughtSize; stage: SolveStage; speed: LessonSpeed; onSpeed: (speed: LessonSpeed) => void }) {
  const say = useSpeaker();
  const [seed, setSeed] = useState(1);
  const start = useMemo(() => practiceCube(n, stage, seed), [n, stage, seed]);
  const [moves, setMoves] = useState<CubeMove[]>([]);
  const [shown, setShown] = useState<Shown | null>(null);
  const [version, bump] = useReducer((so: number) => so + 1, 0);
  const [lesson, setLesson] = useState<Playing | null>(null);
  const [playing, setPlaying] = useState(false);
  const cube = useRef<KyuubuHandle>(null);
  const box = useRef<HTMLDivElement>(null);
  /** Set while a turn is made on the reader's behalf, so the guide that made it is not told it was the reader's. */
  const making = useRef(false);
  const handState = useMemo(() => turnAll(start.state, n, moves), [start.state, n, moves]);
  const state = lesson === null ? handState : lessonState(lesson.plan, lesson.at);
  const done = useMemo(() => stageDone(state, n, stage), [state, n, stage]);
  const lookRound = useLookRound(box);

  const fresh = (next: number) => {
    setSeed(next);
    setMoves([]);
    setShown(null);
    setLesson(null);
    setPlaying(false);
  };

  // The step's turns as they stand now, for the list, the guide or the lesson.
  const rest = () => stageRest(handState, n, stage);
  const show = () => {
    setLesson(null);
    setPlaying(false);
    const steps = rest();
    setShown({ guide: new Guide(handState, n, { moves: steps.flatMap((step) => step.moves) }), parts: steps.flatMap((step) => step.parts) });
  };
  const turnFor = () => {
    setShown(null);
    const plan = lessonOf(handState, n, rest().flatMap((step) => step.moves));
    setLesson({ plan, at: 0 });
    setPlaying(plan.last > 0);
  };

  // A turn made on the reader's behalf, told to the page as theirs are but not to the guide that asked for it.
  const turnForReader = (turns: readonly CubeMove[]) => {
    making.current = true;
    try {
      for (const move of turns) cube.current?.turn(move, { report: true });
    } finally {
      making.current = false;
    }
    bump();
  };

  const onTurn = (move: CubeMove) => {
    if (making.current) {
      setMoves((so) => [...so, move]);
      return;
    }
    if (lesson !== null) {
      // The reader takes the cube: what has been played stands, and their turn carries on from it.
      if (playing) return;
      setMoves((so) => [...so, ...lessonTurnsTo(lesson.plan, lesson.at), move]);
      setLesson(null);
      return;
    }
    setMoves((so) => [...so, move]);
    if (shown !== null) {
      shown.guide.heard(move);
      bump();
    }
  };

  // Standing somewhere else in the lesson, turned on the cube the way it goes (a step either way, a jump catching up).
  const goTo = useCallback(
    (target: number) => {
      if (lesson === null) return;
      const to = Math.max(0, Math.min(target, lesson.plan.last));
      if (to !== lesson.at && cube.current) {
        const path = scrubPath(lesson.plan.each, lesson.at, to);
        if (path.from !== lesson.at) cube.current.setState(lessonState(lesson.plan, path.from));
        for (const turn of path.turns) for (const move of turn) cube.current.turn(move);
      }
      setLesson({ ...lesson, at: to });
    },
    [lesson],
  );
  const handGo = (target: number) => {
    setPlaying(false);
    goTo(target);
  };
  const play = () => {
    if (lesson === null) return;
    if (lesson.at >= lesson.plan.last) goTo(0);
    setPlaying(true);
  };
  const replay = () => {
    goTo(0);
    setPlaying(true);
  };

  // While playing, the next turn is made after a beat, and the lesson stops by itself on the last.
  useEffect(() => {
    if (!playing || lesson === null) return;
    const id = window.setTimeout(() => {
      goTo(lesson.at + 1);
      if (lesson.at + 1 >= lesson.plan.last) setPlaying(false);
    }, lessonGap(speed, lesson.at));
    return () => window.clearTimeout(id);
  }, [playing, lesson, speed, goTo]);

  // What is drawn on the cube: the turn to make, or the one that takes a wrong turn back. Kyuubu shows it again only when it says something else.
  const last = shown?.guide.detours.at(-1);
  const hint = shown === null || lesson !== null ? null : last !== undefined ? [undoOf(last)] : (shown.guide.next?.moves ?? null);

  const handsOff = lesson !== null && playing;
  const status = lesson === null ? (done ? CUBE_GUIDE_COPY.done : CUBE_GUIDE_COPY.practising) : lesson.at >= lesson.plan.last && done ? say.say("cubemethod.lessonEnd") : say.say("cubemethod.watching");
  const button = `${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`;
  const lessonOn = lesson !== null;

  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-rule p-3"
      data-testid="cube-practice"
      data-done={done ? "true" : "false"}
      data-lesson={lesson === null ? "off" : playing ? "playing" : "paused"}
      data-lesson-at={lesson === null ? undefined : String(lesson.at)}
      data-lesson-last={lesson === null ? undefined : String(lesson.plan.last)}
    >
      <div className="mx-auto w-full max-w-sm" ref={box}>
        <CubeBoard
          size={n}
          state={state}
          theme={THEME}
          interactive={lessonOn ? !handsOff : !done}
          keyboard="page"
          onTurn={onTurn}
          cube={cube}
          hint={hint}
          turnMs={lessonOn ? LESSON_SPEEDS[speed].turn : HAND_TURN_MS}
        />
      </div>
      <p className="min-h-10 text-sm text-muted" aria-live="polite" data-testid="cube-practice-said">
        {status}
      </p>
      {lesson !== null ? (
        <CubeReplayPanel
          size={n}
          each={lesson.plan.each}
          viewing={lesson.at}
          go={handGo}
          startLabel={say.say("cubemethod.begins")}
          listLabel={say.say("cubemethod.turnsLabel")}
          testId="cube-lesson"
          transport={
            <CubeLessonBar
              playing={playing}
              atStart={lesson.at === 0}
              atEnd={lesson.at >= lesson.plan.last}
              speed={speed}
              onPlay={play}
              onPause={() => setPlaying(false)}
              onBack={() => handGo(lesson.at - 1)}
              onOn={() => handGo(lesson.at + 1)}
              onReplay={replay}
              onSpeed={onSpeed}
            />
          }
        />
      ) : null}
      {shown !== null && lesson === null ? (
        <>
          <CubeNextTurn
            guide={shown.guide}
            version={version}
            n={n}
            look={lookRound}
            onMake={() => turnForReader(shown.guide.makeNext())}
            onTakeBack={() => turnForReader(shown.guide.takeBack())}
            onHide={() => setShown(null)}
          />
          {done ? null : (
            <ol className="flex flex-col gap-1 text-sm" data-testid="cube-practice-turns">
              {shown.parts.map((part, at) => (
                <li key={at} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-muted">{part.algorithm === undefined ? CUBE_GUIDE_COPY.lineUp : CUBE_ALGORITHM_NAMES[part.algorithm]}</span>
                  <span className="font-mono">{movesNotation(part.moves, n)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {!done && !lessonOn ? (
          <>
            {shown === null ? (
              <button type="button" className={button} onClick={show} data-testid="cube-practice-show">
                {CUBE_GUIDE_COPY.showTurns}
              </button>
            ) : null}
            <button type="button" className={button} onClick={turnFor} data-testid="cube-practice-turn">
              {CUBE_GUIDE_COPY.turnFor}
            </button>
          </>
        ) : null}
        <button type="button" className={button} onClick={() => fresh(seed)} disabled={moves.length === 0 && !lessonOn && shown === null} data-testid="cube-practice-again">
          {CUBE_GUIDE_COPY.again}
        </button>
        <button type="button" className={button} onClick={() => fresh(start.seed + 1)} data-testid="cube-practice-another">
          {CUBE_GUIDE_COPY.another}
        </button>
      </div>
    </div>
  );
}
