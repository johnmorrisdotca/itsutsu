import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * THE WORDS OF THE GUIDE TO SUIDO'S PIECES, by the piece's id in the package's guide (`SUIDO_PIECE_GUIDE`): its name and what it does, in the phrase table, so
 * the guide reads in English and Japanese beside the package's own drawing. `suidoGuide.coverage.test.ts` holds the English to the package's, word for word, and the
 * table to the package's list of pieces, so a piece the package adds fails the build until it has its words here.
 */
export const GUIDE_WORDS: Readonly<Record<string, { name: PhraseKey; text: PhraseKey }>> = {
  "ground": { name: "pmaze.guide.ground.name", text: "pmaze.guide.ground.text" },
  "end": { name: "pmaze.guide.end.name", text: "pmaze.guide.end.text" },
  "straight": { name: "pmaze.guide.straight.name", text: "pmaze.guide.straight.text" },
  "elbow": { name: "pmaze.guide.elbow.name", text: "pmaze.guide.elbow.text" },
  "tee": { name: "pmaze.guide.tee.name", text: "pmaze.guide.tee.text" },
  "cross": { name: "pmaze.guide.cross.name", text: "pmaze.guide.cross.text" },
  "pump": { name: "pmaze.guide.pump.name", text: "pmaze.guide.pump.text" },
  "drain": { name: "pmaze.guide.drain.name", text: "pmaze.guide.drain.text" },
  "pump-and-drain": { name: "pmaze.guide.pumpAndDrain.name", text: "pmaze.guide.pumpAndDrain.text" },
  "locked": { name: "pmaze.guide.locked.name", text: "pmaze.guide.locked.text" },
  "wall": { name: "pmaze.guide.wall.name", text: "pmaze.guide.wall.text" },
  "wrap": { name: "pmaze.guide.wrap.name", text: "pmaze.guide.wrap.text" },
  "big-snake": { name: "pmaze.guide.bigSnake.name", text: "pmaze.guide.bigSnake.text" },
  "big-hairpin": { name: "pmaze.guide.bigHairpin.name", text: "pmaze.guide.bigHairpin.text" },
  "big-two-straights": { name: "pmaze.guide.bigTwoStraights.name", text: "pmaze.guide.bigTwoStraights.text" },
  "big-two-elbows": { name: "pmaze.guide.bigTwoElbows.name", text: "pmaze.guide.bigTwoElbows.text" },
  "big-through-and-branch": { name: "pmaze.guide.bigThroughAndBranch.name", text: "pmaze.guide.bigThroughAndBranch.text" },
  "big-hairpin-over-straight": { name: "pmaze.guide.bigHairpinOverStraight.name", text: "pmaze.guide.bigHairpinOverStraight.text" },
  "big-branch-and-straight": { name: "pmaze.guide.bigBranchAndStraight.name", text: "pmaze.guide.bigBranchAndStraight.text" },
  "big-two-stubbed-pipes": { name: "pmaze.guide.bigTwoStubbedPipes.name", text: "pmaze.guide.bigTwoStubbedPipes.text" },
  "big-three-pipes": { name: "pmaze.guide.bigThreePipes.name", text: "pmaze.guide.bigThreePipes.text" },
  "big-three-pipes-two-openings": { name: "pmaze.guide.bigThreePipesTwoOpenings.name", text: "pmaze.guide.bigThreePipesTwoOpenings.text" },
  "big-crossing-and-stub": { name: "pmaze.guide.bigCrossingAndStub.name", text: "pmaze.guide.bigCrossingAndStub.text" },
  "big-grid": { name: "pmaze.guide.bigGrid.name", text: "pmaze.guide.bigGrid.text" },
  "big-two-tee-pipes": { name: "pmaze.guide.bigTwoTeePipes.name", text: "pmaze.guide.bigTwoTeePipes.text" },
  "block-turn": { name: "pmaze.guide.blockTurn.name", text: "pmaze.guide.blockTurn.text" },
};
