/**
 * cubemethod.*: the cube's replays, on the method page (`/learn/cube`, a step played as a lesson and the next turn shown on the cube) and under a finished solve (`src/components/puzzles/CubeReplayPanel.tsx`, `src/components/learn/`). The words of the turns themselves (move names, "Play", "Move 3 of 12", how to drag a layer) are Kyuubu's, in both languages.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_CUBEMETHOD = {
  // A step played as a lesson
  "cubemethod.speedLabel": "How fast",
  "cubemethod.speedSlow": "Slow",
  "cubemethod.speedNormal": "Normal",
  "cubemethod.speedFast": "Fast",
  "cubemethod.replayStep": "Replay the step",
  "cubemethod.begins": "The step begins here",
  "cubemethod.turnsLabel": "The turns of this step",
  "cubemethod.watching": "Watch the turns one at a time. Pause to look closer, step back and on to go over one again, or drag the bar to jump. Turn the cube yourself to carry on by hand from there.",
  "cubemethod.lessonEnd": "Done: that step is finished, and the cube is as it should be. Go back over any turn, replay it from the start, or turn the cube yourself.",
  // The next turn drawn on the cube
  "cubemethod.hideTurns": "Hide the turns",
  "cubemethod.makeTurn": "Turn this one for me",
} as const;
