import type { SolveAlgorithm, SolveStage } from "@johnmorrisdotca/kyuubu";

import type { Speaker } from "@/lib/i18n/i18n";

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

/** Each stage's words in the reader's language (`learn.cube.*`). The turns inside them (R U R' U') are the same in every language. */
export function cubeStageWords(say: Speaker): Record<SolveStage, CubeStageWords> {
  return {
    hold: { title: say.say("learn.cube.holdTitle"), aim: say.say("learn.cube.holdAim"), how: say.say("learn.cube.holdHow") },
    whiteCross: { title: say.say("learn.cube.crossTitle"), aim: say.say("learn.cube.crossAim"), how: say.say("learn.cube.crossHow") },
    whiteCorners: { title: say.say("learn.cube.cornersTitle"), aim: say.say("learn.cube.cornersAim"), how: say.say("learn.cube.cornersHow") },
    whiteLayer: { title: say.say("learn.cube.layerTitle"), aim: say.say("learn.cube.layerAim"), how: say.say("learn.cube.layerHow") },
    middleLayer: { title: say.say("learn.cube.middleTitle"), aim: say.say("learn.cube.middleAim"), how: say.say("learn.cube.middleHow") },
    yellowCross: { title: say.say("learn.cube.yCrossTitle"), aim: say.say("learn.cube.yCrossAim"), how: say.say("learn.cube.yCrossHow") },
    yellowFace: { title: say.say("learn.cube.yFaceTitle"), aim: say.say("learn.cube.yFaceAim"), how: say.say("learn.cube.yFaceHow") },
    yellowCorners: { title: say.say("learn.cube.yCornersTitle"), aim: say.say("learn.cube.yCornersAim"), how: say.say("learn.cube.yCornersHow") },
    yellowEdges: { title: say.say("learn.cube.yEdgesTitle"), aim: say.say("learn.cube.yEdgesAim"), how: say.say("learn.cube.yEdgesHow") },
  };
}

/** The method's algorithms by the names people give them. */
export function cubeAlgorithmNames(say: Speaker): Record<SolveAlgorithm, string> {
  return {
    cornerIn: say.say("learn.cube.algCornerIn"),
    edgeRight: say.say("learn.cube.algEdgeRight"),
    edgeLeft: say.say("learn.cube.algEdgeLeft"),
    yellowCross: say.say("learn.cube.algYellowCross"),
    sune: say.say("learn.cube.algSune"),
    cornerCycle: say.say("learn.cube.algCornerCycle"),
    edgeCycle: say.say("learn.cube.algEdgeCycle"),
  };
}

/** The stages in the order they are done, for each size the method is written for. */
export const CUBE_STAGES_BY_SIZE: Record<2 | 3, readonly SolveStage[]> = {
  2: ["hold", "whiteLayer", "yellowFace", "yellowCorners"],
  3: ["hold", "whiteCross", "whiteCorners", "middleLayer", "yellowCross", "yellowFace", "yellowCorners", "yellowEdges"],
};

/** The guide's own words (`/learn/cube`), in the reader's language. */
export function cubeGuideCopy(say: Speaker) {
  return {
    title: say.say("learn.cubePageTitle"),
    kanji: "解法",
    lead: say.say("learn.cube.guideLead"),
    notationHeading: say.say("learn.cube.notationHeading"),
    notation: [say.say("learn.cube.notationA"), say.say("learn.cube.notationB"), say.say("learn.cube.notationC")],
    sizeLabel: say.say("learn.cube.sizeLabel"),
    sizes: { 3: "3×3", 2: "2×2" } as Record<2 | 3, string>,
    twoByTwo: say.say("learn.cube.twoByTwo"),
    practise: say.say("learn.cube.practise"),
    practising: say.say("learn.cube.practising"),
    lineUp: say.say("learn.cube.lineUp"),
    showTurns: say.say("learn.cube.showTurns"),
    turnFor: say.say("learn.cube.turnFor"),
    another: say.say("learn.cube.another"),
    again: say.say("learn.cube.again"),
    done: say.say("learn.cube.done"),
    playHeading: say.say("learn.cube.playHeading"),
    play: say.say("learn.cube.play"),
  };
}
