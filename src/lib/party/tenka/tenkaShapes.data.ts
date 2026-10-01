// Tenka's rules are their own open-source package (github.com/johnmorrisdotca/tenka, installed as @johnmorrisdotca/tenka);
// this module keeps its old address so the site and its browser specs import it unchanged.
import { TENKA_EUROPE_SHAPES, TENKA_SHAPES } from "@johnmorrisdotca/tenka/shapes";
import type { TenkaGame, TenkaShapes } from "@johnmorrisdotca/tenka";

export { TENKA_EUROPE_SHAPES, TENKA_SHAPES };

/** How a game's map is drawn: the world's shapes, or Europe's for a game on Europe (Tenka 1.2). */
export function tenkaShapesFor(game: Pick<TenkaGame, "map">): TenkaShapes {
  return game.map === "europe" ? TENKA_EUROPE_SHAPES : TENKA_SHAPES;
}
