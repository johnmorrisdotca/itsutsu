import { turnAll, type CubeMove } from "@johnmorrisdotca/kyuubu";

import { groupCubeSteps, type CubeSteps } from "@/lib/puzzles/cube/steps";

/**
 * A STEP OF THE METHOD PLAYED AS A LESSON (`/learn/cube`, Turn it for me): the
 * turns that finish the step, one at a time at a pace a person can follow, with
 * the cube as it stood before the step kept so any turn can be gone back to.
 * Pure: the page holds where in it the reader is, and asks here for the cube
 * and the pace. `position` 0 is the cube as the step began.
 */
export type CubeLesson = CubeSteps & {
  /** The cube's side. */
  n: number;
  /** The cube as the step began. */
  base: string;
  /** The last position: how many steps the lesson has. */
  last: number;
};

/** A lesson of these turns on this cube; whole-cube turns left at the end are a step of their own, so holding the cube is a lesson too. */
export function lessonOf(base: string, n: number, turns: readonly CubeMove[]): CubeLesson {
  const steps = groupCubeSteps(turns, true);
  return { ...steps, n, base, last: steps.each.length };
}

/** The cube once the lesson has played this many steps. */
export function lessonState(lesson: CubeLesson, position: number): string {
  const at = Math.max(0, Math.min(position, lesson.last));
  return turnAll(lesson.base, lesson.n, lesson.all.slice(0, lesson.ends[at]));
}

/** The turns made to be where the lesson stands at this position: what the reader's own turns carry on from when they take over. */
export function lessonTurnsTo(lesson: CubeLesson, position: number): CubeMove[] {
  const at = Math.max(0, Math.min(position, lesson.last));
  return lesson.all.slice(0, lesson.ends[at]);
}

/**
 * The paces a lesson plays at. `gap` is how long a turn is stood on before the
 * next is made, and `turn` how long a quarter turn takes to show (Kyuubu's
 * `turnMs`), so a half turn takes longer and a whole move can be followed.
 * Normal is about one move a second, as John asked.
 */
export const LESSON_SPEEDS = {
  slow: { gap: 1800, turn: 650 },
  normal: { gap: 1000, turn: 380 },
  fast: { gap: 450, turn: 170 },
} as const;

export type LessonSpeed = keyof typeof LESSON_SPEEDS;

export const LESSON_SPEED_ORDER: readonly LessonSpeed[] = ["slow", "normal", "fast"];

/** How long to wait before the next step: a short beat first, so the cube is seen as it begins before it moves. */
export const LESSON_LEAD_IN_MS = 600;

export function lessonGap(speed: LessonSpeed, position: number): number {
  const { gap } = LESSON_SPEEDS[speed];
  return position === 0 ? Math.min(gap, LESSON_LEAD_IN_MS) : gap;
}
