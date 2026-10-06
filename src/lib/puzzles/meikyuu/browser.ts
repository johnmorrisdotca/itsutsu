/**
 * MEIKYUU'S DRAWING AND ITS PLAYING, FETCHED IN A BROWSER. The rules and the making
 * (`@johnmorrisdotca/meikyuu`), the drawing (`/draw`) and the playable board
 * (`/play`) are three entries of the package, and a page that shows a maze
 * needs them only once it is in a browser: a set-up page is drawn on a server,
 * and a picture of a maze is not worth making there. Each is its own script,
 * fetched when first asked for and kept; asking on a server is a refusal, and
 * written so (`typeof window`) that the build leaves the imports out of the
 * server's copy, as `levels.ts` does for the list.
 */
export type MeikyuuPackage = {
  rules: typeof import("@johnmorrisdotca/meikyuu");
  draw: typeof import("@johnmorrisdotca/meikyuu/draw");
  play: typeof import("@johnmorrisdotca/meikyuu/play");
};

let loading: Promise<MeikyuuPackage> | null = null;

async function importPackage(): Promise<MeikyuuPackage> {
  if (typeof window === "undefined") throw new Error("Meikyuu is drawn and played in a browser.");
  const [rules, draw, play] = await Promise.all([import("@johnmorrisdotca/meikyuu"), import("@johnmorrisdotca/meikyuu/draw"), import("@johnmorrisdotca/meikyuu/play")]);
  return { rules, draw, play };
}

/** The package's three entries, fetched once. */
export function loadMeikyuuPackage(): Promise<MeikyuuPackage> {
  loading ??= importPackage();
  return loading;
}

/**
 * THE PAPER A MAZE IS DRAWN ON, in both themes. Every puzzle here is written on white paper inside the wood
 * (`PuzzleBoard`), light by day and by night, so a maze is too: the package's own `paper` board follows the
 * device's dark setting, and its dark walls on a dark paper would be the one puzzle that does. A board of
 * the package's, given as colours, wears the same in both.
 */
export const MEIKYUU_LOOK = { paper: "#fbf8f1", wall: "#1f2320", frame: "#a98954", dark: false, trail: "#2e8b57" } as const;

/**
 * THE SOLIDS' BOARD AND ITS RULES, FETCHED IN A BROWSER (`@johnmorrisdotca/meikyuu/3d/play` and `/3d`, package 2.2): a cube, a globe or a solid of triangles
 * with a maze over its surface. They are not part of the flat package above, so a page that shows no solid never fetches them; asking on a server is a
 * refusal, written as the flat package's is.
 */
export type SolidPackage = {
  rules: typeof import("@johnmorrisdotca/meikyuu/3d");
  play: typeof import("@johnmorrisdotca/meikyuu/3d/play");
};

let loadingSolids: Promise<SolidPackage> | null = null;

async function importSolids(): Promise<SolidPackage> {
  if (typeof window === "undefined") throw new Error("A maze over a solid is drawn and played in a browser.");
  const [rules, play] = await Promise.all([import("@johnmorrisdotca/meikyuu/3d"), import("@johnmorrisdotca/meikyuu/3d/play")]);
  return { rules, play };
}

/** The solids' two entries, fetched once. */
export function loadSolidPackage(): Promise<SolidPackage> {
  loadingSolids ??= importSolids();
  return loadingSolids;
}
