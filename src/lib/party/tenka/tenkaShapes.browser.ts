// Tenka's rules are their own open-source package (github.com/johnmorrisdotca/tenka, installed as @johnmorrisdotca/tenka);
// a browser's build gets this module where the site imports `tenkaShapes.data.ts`, which on a server reads the same shapes from a packed file.
import { TENKA_EUROPE_SHAPES, TENKA_SHAPES } from "@johnmorrisdotca/tenka/shapes";
import type { TenkaGame, TenkaShapes } from "@johnmorrisdotca/tenka";

export { TENKA_EUROPE_SHAPES, TENKA_SHAPES };

/** How a game's map is drawn: the world's shapes, or Europe's for a game on Europe (Tenka 1.2). */
export function tenkaShapesFor(game: Pick<TenkaGame, "map">): TenkaShapes {
  return game.map === "europe" ? TENKA_EUROPE_SHAPES : TENKA_SHAPES;
}
