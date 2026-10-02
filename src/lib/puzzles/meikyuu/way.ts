import { buildMaze, parseRecipe, solutionOf, type Maze } from "@johnmorrisdotca/meikyuu";

import { encodeCells } from "./steps";

export { decodeWay, encodeCells, wayFits } from "./steps";

/** The maze a recipe makes, or null for text that is not a recipe (`parseRecipe` also refuses one too big to build). */
export function mazeOf(code: string): Maze | null {
  const recipe = parseRecipe(code);
  return recipe === null ? null : buildMaze(recipe);
}

/** The one way from the start to the goal of the maze a recipe makes, as steps (`steps.ts`); null if the recipe is no maze. */
export function encodeWay(recipe: string): string | null {
  const maze = mazeOf(recipe);
  return maze === null ? null : encodeCells(maze, solutionOf(maze));
}
