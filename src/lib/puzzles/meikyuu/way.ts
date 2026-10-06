import { buildMaze, parseRecipe, solutionOf, type MazeCore } from "@johnmorrisdotca/meikyuu";
import { buildSolidMaze, parseSolidRecipe } from "@johnmorrisdotca/meikyuu/3d";

import { encodeCells } from "./steps";

export { decodeWay, encodeCells, wayFits } from "./steps";

/**
 * The maze a recipe makes, or null for text that is not a recipe (`parseRecipe` also refuses one too big to build). A flat maze's recipe has five parts
 * (`square:12x9:wilson:to-goal:48213`) and a solid's four (`cube:7:prim:48213`, `parseSolidRecipe`); both are a `MazeCore`, which is all a line is walked on.
 */
export function mazeOf(code: string): MazeCore | null {
  if (code.split(":").length === 4) {
    const solid = parseSolidRecipe(code);
    return solid === null ? null : buildSolidMaze(solid);
  }
  const recipe = parseRecipe(code);
  return recipe === null ? null : buildMaze(recipe);
}

/** The one way from the start to the goal of the maze a recipe makes, as steps (`steps.ts`); null if the recipe is no maze. */
export function encodeWay(recipe: string): string | null {
  const maze = mazeOf(recipe);
  return maze === null ? null : encodeCells(maze, solutionOf(maze));
}
