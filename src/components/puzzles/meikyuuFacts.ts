import type { MeikyuuMode, MeikyuuShape } from "@johnmorrisdotca/meikyuu";

/**
 * WHAT A RECIPE SAYS AT A GLANCE, read from its text and nothing else: `shape:size:algorithm:way:seed`, such
 * as `heart:25:prim:keys-3:7`. A page that wants to name a maze's shape and its way to play does not need
 * the package to build it. Null for text that is not shaped so.
 */
export function meikyuuFacts(code: string): { shape: MeikyuuShape; mode: MeikyuuMode; keys: number } | null {
  const [shape, , , way] = code.split(":");
  if (shape === undefined || way === undefined) return null;
  const mode = way.startsWith("keys-") ? "keys" : way;
  const keys = mode === "keys" ? Number(way.slice(5)) : 0;
  return { shape: shape as MeikyuuShape, mode: mode as MeikyuuMode, keys };
}
