/**
 * THE CUBE'S WORDS AND NUMBERS on its play screen (`CubeSolve`). Kept apart
 * from `puzzles.constants.ts`, whose every edit asks for every puzzle's
 * picture to be taken again (`puzzleArtFingerprint.ts`).
 */

/** The look at a scramble before the clock starts, as a competition gives. */
export const CUBE_INSPECTION_MS = 15_000;

/** How much of the board's wood the cube fills. */
export const CUBE_FILL = 0.92;

export const CUBE_COPY = {
  label: (size: number) => `A ${size}×${size} cube. Drag a sticker to turn its layer, or drag around the cube to look at it.`,
  inspecting: (seconds: number) => `Look it over: the clock starts in ${seconds} or with your first turn.`,
  howTo:
    "Drag a sticker to turn its layer; drag around the cube to look. Wheel over a sticker turns its row, Ctrl+wheel its column, Shift+wheel its face. Keys: R L U D F B, Shift for back, M E S, x y z, a digit first for an inner layer.",
  solving: "Turn it until every face is one colour.",
  scramble: "Scramble",
  undo: "Undo",
  giveUp: "Give up",
  resetLook: "Front on",
  moves: (count: number) => `${count} ${count === 1 ? "move" : "moves"}`,
  replayStart: "The scramble",
  replayAt: (at: number, last: number) => `Move ${at} of ${last}`,
  replaySolved: "Step through the solve with the scrubber, from the scramble to solved.",
  replayGivenUp: "Given up here: step back through how it got there.",
  replayNone: "The scramble, as it was dealt.",
} as const;
