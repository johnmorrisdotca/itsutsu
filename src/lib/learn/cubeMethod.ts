import type { SolveAlgorithm, SolveStage } from "kyuubu";

/**
 * THE METHOD IN WORDS: the layer-by-layer solve Kyuubu works out
 * (`solveSteps`), as a person is taught it. Read by the cube's "Show me how"
 * (`CubeGuide`) and by the guide in Learn (`/learn/cube`), so the page that
 * teaches a step and the button that shows it say the same thing.
 *
 * White goes on the bottom and yellow on top, as the method keeps them, and
 * every algorithm is written for the cube held that way.
 */

export type CubeStageWords = {
  title: string;
  /** What the step is for, in a sentence or two. */
  aim: string;
  /** How it is done, for the guide's longer telling. */
  how: string;
};

export const CUBE_STAGE_WORDS: Record<SolveStage, CubeStageWords> = {
  hold: {
    title: "Hold it white side down",
    aim: "Turn the whole cube so white is underneath. Every step after this is written for the cube held this way.",
    how: "On a 3×3 the white centre goes on the bottom; the centres never move, so they say which colour each face will be. A 2×2 has no centres: hold it with a white sticker underneath its back-left corner, and build round that corner.",
  },
  whiteCross: {
    title: "The white cross",
    aim: "Put the four white edges round the white centre, each with its other colour matching the centre beside it.",
    how: "One edge at a time, turn faces to bring it down under its own centre. There is no algorithm to learn here: it is worked out by eye, and the turns shown are one way to do it.",
  },
  whiteCorners: {
    title: "The white corners",
    aim: "Put the four white corners in, finishing the whole white layer.",
    how: "Turn the top until a corner sits above the place it belongs, then repeat R U R' U' from that side until it drops in, white facing down. Each repeat moves it one twist, so it takes one, three or five.",
  },
  whiteLayer: {
    title: "The first layer",
    aim: "Put the other three white corners in round the one you are holding, each matching its neighbours.",
    how: "A 2×2's first layer is its whole bottom. Turn the top, the right and the front, one face at a time, to bring each corner down beside the ones already home.",
  },
  middleLayer: {
    title: "The middle layer",
    aim: "Put the four middle edges in, finishing the first two layers.",
    how: "Find an edge on top with no yellow, turn the top so its front colour matches the centre below, then send it right or left with the algorithm for that side.",
  },
  yellowCross: {
    title: "The yellow cross",
    aim: "Make a yellow cross on top. The edges need not match their sides yet.",
    how: "Hold a yellow line running left to right, or a corner shape pointing to the back left, and do F R U R' U' F'. A dot takes it three times, a corner shape twice, a line once.",
  },
  yellowFace: {
    title: "The yellow face",
    aim: "Turn every yellow sticker to face up.",
    how: "Do the Sune, R U R' U R U2 R', with the top turned first. When one yellow corner is already up, hold it at the front left. Repeat until the whole top is yellow.",
  },
  yellowCorners: {
    title: "The yellow corners",
    aim: "Move the yellow corners round until each sits between its own colours.",
    how: "Find a corner already sitting between its own colours and hold it at the front left. The corner cycle, R' F R' B2 R F' R' B2 R2, moves the other three round it; once or twice puts them home.",
  },
  yellowEdges: {
    title: "The yellow edges",
    aim: "Cycle the last edges into place, and the cube is solved.",
    how: "Hold a finished side at the back, if there is one, and do the edge cycle, R U' R U R U R U' R' U' R2. Once or twice finishes it.",
  },
};

/** The method's algorithms by the names people give them. */
export const CUBE_ALGORITHM_NAMES: Record<SolveAlgorithm, string> = {
  cornerIn: "Corner in",
  edgeRight: "Edge to the right",
  edgeLeft: "Edge to the left",
  yellowCross: "Yellow cross",
  sune: "Sune",
  cornerCycle: "Corner cycle",
  edgeCycle: "Edge cycle",
};

/** The stages in the order they are done, for each size the method is written for. */
export const CUBE_STAGES_BY_SIZE: Record<2 | 3, readonly SolveStage[]> = {
  2: ["hold", "whiteLayer", "yellowFace", "yellowCorners"],
  3: ["hold", "whiteCross", "whiteCorners", "middleLayer", "yellowCross", "yellowFace", "yellowCorners", "yellowEdges"],
};

/** The guide's own words (`/learn/cube`). */
export const CUBE_GUIDE_COPY = {
  title: "Solve the cube",
  kanji: "解法",
  lead: "The layer-by-layer method most people learn first: white on the bottom, then the middle, then yellow on top. Seven algorithms, each short, and a cube to practise every step on.",
  notationHeading: "Reading the turns",
  notation: [
    "Each letter is a face, seen from the front: R right, L left, U up, D down, F front, B back. A letter alone turns that face clockwise, as you look at it.",
    "A mark after it, R', turns it anticlockwise. A 2 after it, R2, turns it halfway round.",
    "x, y and z turn the whole cube the way R, U and F turn it: x brings the front up to the top, y spins it on the table, z tips the top over to the right. Turning the whole cube never counts as a move.",
  ],
  sizeLabel: "Which cube",
  sizes: { 3: "3×3", 2: "2×2" } as Record<2 | 3, string>,
  twoByTwo: "A 2×2 has no middle layer and no edges, so it takes four of the steps: hold it, build the first layer, then the yellow face and the yellow corners with the 3×3's own algorithms.",
  practise: "Practise this step",
  practising: "Turn the cube until the step is done: drag a sticker to turn its layer, drag around the cube to look at it, or type the turns (x, y and z turn the whole cube).",
  lineUp: "Line it up",
  showTurns: "Show the turns",
  turnFor: "Turn it for me",
  another: "Another cube",
  again: "Start again",
  done: "Done: that step is finished.",
  playHeading: "Then time yourself",
  play: "Once the steps come without looking, scramble one for real. On the play page, Show me how gives the next step whenever you are stuck; a solve that uses it scores no points.",
} as const;
