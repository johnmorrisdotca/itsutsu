import { turnAll } from "@johnmorrisdotca/kyuubu";
import { describe, expect, it } from "vitest";

import { CUBE_STAGES_BY_SIZE } from "./cubeMethod";
import { LESSON_LEAD_IN_MS, LESSON_SPEEDS, LESSON_SPEED_ORDER, lessonGap, lessonOf, lessonState, lessonTurnsTo } from "./cubeLesson";
import { practiceCube, stageDone, stageRest } from "./cubePractice";

/**
 * A STEP PLAYED AS A LESSON: every step of the method, on both sizes it is
 * taught for, is a lesson that begins on the cube the step starts from, stands
 * on a cube a turn further at each position, and ends with the step done.
 */
describe("a step of the method played as a lesson", () => {
  for (const n of [2, 3] as const) {
    it.each(CUBE_STAGES_BY_SIZE[n])(`on the ${n}×${n}, begins where the step begins, goes a step at a time, and ends with %s done`, (stage) => {
      for (const seed of [1, 2]) {
        const { state } = practiceCube(n, stage, seed);
        const lesson = lessonOf(state, n, stageRest(state, n, stage).flatMap((step) => step.moves));
        expect(lesson.last, "a step has at least one turn to show").toBeGreaterThan(0);
        expect(lessonState(lesson, 0)).toBe(state);
        expect(stageDone(lessonState(lesson, 0), n, stage)).toBe(false);
        for (let at = 1; at <= lesson.last; at += 1) {
          // Each position is the one before it, turned by that step's turns and nothing else.
          expect(lessonState(lesson, at)).toBe(turnAll(lessonState(lesson, at - 1), n, lesson.each[at - 1]));
          expect(lessonTurnsTo(lesson, at)).toHaveLength(lesson.ends[at]);
        }
        expect(stageDone(lessonState(lesson, lesson.last), n, stage)).toBe(true);
        // Past either end it stands at the end.
        expect(lessonState(lesson, -3)).toBe(lessonState(lesson, 0));
        expect(lessonState(lesson, lesson.last + 5)).toBe(lessonState(lesson, lesson.last));
      }
    });
  }

  it("makes holding the cube a lesson of its own, though it is only turns of the whole cube", () => {
    const { state } = practiceCube(3, "hold", 1);
    const lesson = lessonOf(state, 3, stageRest(state, 3, "hold").flatMap((step) => step.moves));
    expect(lesson.last).toBeGreaterThan(0);
    expect(lessonState(lesson, lesson.last)).not.toBe(state);
  });

  it("plays about one turn a second at its ordinary pace, slower and faster either side, with a short beat before the first", () => {
    expect(LESSON_SPEED_ORDER).toEqual(["slow", "normal", "fast"]);
    expect(LESSON_SPEEDS.normal.gap).toBe(1000);
    expect(LESSON_SPEEDS.slow.gap).toBeGreaterThan(LESSON_SPEEDS.normal.gap);
    expect(LESSON_SPEEDS.fast.gap).toBeLessThan(LESSON_SPEEDS.normal.gap);
    // A turn is on the screen for less time than it is stood on, or one would run into the next.
    for (const speed of LESSON_SPEED_ORDER) expect(LESSON_SPEEDS[speed].turn * 2).toBeLessThan(LESSON_SPEEDS[speed].gap + 300);
    expect(lessonGap("normal", 0)).toBe(LESSON_LEAD_IN_MS);
    expect(lessonGap("normal", 4)).toBe(1000);
    expect(lessonGap("fast", 0)).toBeLessThanOrEqual(LESSON_SPEEDS.fast.gap);
  });
});
