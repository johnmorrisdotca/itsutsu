/**
 * THE CUBE'S WORDS AND NUMBERS on its play screen (`CubeSolve`). Kept apart
 * from `puzzles.constants.ts`, whose every edit asks for every puzzle's
 * picture to be taken again (`puzzleArtFingerprint.ts`).
 */

/** The look at a scramble before the clock starts, as a competition gives. */
export const CUBE_INSPECTION_MS = 15_000;

/** How much of the board's wood the cube fills. */
export const CUBE_FILL = 0.92;

/** How far the cube may be zoomed, as a multiple of the size it is first drawn at, and one press of + or − (the numbers sit apart so 1 is always reached). */
export const CUBE_ZOOM = { min: 0.6, max: 1.8, step: 0.2, start: 1 } as const;

/** Where this device keeps the zoom: a phone and a desk want different sizes, so it is the browser's. */
export const CUBE_ZOOM_KEPT = "itsutsu.cubeZoom";

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
  zoomGroup: "Zoom the cube",
  zoomIn: "Zoom the cube in",
  zoomOut: "Zoom the cube out",
  zoomReset: "Put the cube back to its first size",
  zoomHow: "Pinch, or hold Alt and use the wheel, to zoom.",
  replayStart: "The scramble",
  replayAt: (at: number, last: number) => `Move ${at} of ${last}`,
  replaySolved: "Step through the solve with the scrubber, from the scramble to solved.",
  replayGivenUp: "Given up here: step back through how it got there.",
  replayNone: "The scramble, as it was dealt.",
  guideOpen: "Show me how",
  guideCost: "Shows the next step of the beginner's method. A solve that uses it still counts, but scores no points and stays off the fastest tables.",
  guideNext: "Next",
  guideLeft: (count: number) => `${count} ${count === 1 ? "step" : "steps"} to go`,
  guideTurn: "Turn it for me",
  guideHide: "Hide",
  guideOnCube: "Show me on the cube",
  guideOffCube: "Stop showing it on the cube",
  guideMoveNow: "Now",
  guideShow: "Show the next step",
  guideSizes: "The step-by-step help is for the 2×2 and 3×3.",
  guideLearn: "Learn the method",
} as const;
