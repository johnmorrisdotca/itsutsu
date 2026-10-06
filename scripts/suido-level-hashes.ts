/**
 * Writes src/lib/puzzles/suido/levelBoards.data.ts: the hash of every board of every Suido size, in level order, with the
 * shortest run of leading characters that no two of a size's boards share. That is all the server reads of the levels
 * (`suido/boardHash.ts`): the levels themselves are 1 MB of data a function would carry, and are the browser's.
 * Run it after the package's levels change:
 *
 *     node scripts/suido-level-hashes.ts
 *
 * `levelBoards.test.ts` holds the file to the package's own data, so a package that changes a level without this being run fails the build.
 */
import { writeFileSync } from "node:fs";

import { SUIDO_10X10 } from "@johnmorrisdotca/suido/levels-10x10";
import { SUIDO_11X11 } from "@johnmorrisdotca/suido/levels-11x11";
import { SUIDO_12X12 } from "@johnmorrisdotca/suido/levels-12x12";
import { SUIDO_13X13 } from "@johnmorrisdotca/suido/levels-13x13";
import { SUIDO_14X14 } from "@johnmorrisdotca/suido/levels-14x14";
import { SUIDO_20X20 } from "@johnmorrisdotca/suido/levels-20x20";
import { SUIDO_20X50 } from "@johnmorrisdotca/suido/levels-20x50";
import { SUIDO_28X28 } from "@johnmorrisdotca/suido/levels-28x28";
import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
import { SUIDO_5X7 } from "@johnmorrisdotca/suido/levels-5x7";
import { SUIDO_6X10 } from "@johnmorrisdotca/suido/levels-6x10";
import { SUIDO_6X6 } from "@johnmorrisdotca/suido/levels-6x6";
import { SUIDO_7X7 } from "@johnmorrisdotca/suido/levels-7x7";
import { SUIDO_8X14 } from "@johnmorrisdotca/suido/levels-8x14";
import { SUIDO_8X8 } from "@johnmorrisdotca/suido/levels-8x8";
import { SUIDO_9X9 } from "@johnmorrisdotca/suido/levels-9x9";

import { PREFIX_FLOOR, suidoBoardHash } from "../src/lib/puzzles/suido/boardHash.ts";

type Rows = readonly (readonly [string, string, string])[];

/** By the size the site keeps (`sizes.ts`): a square's side, and a long board's width and height in two digits each. */
const sizes: Record<number, Rows> = {
  5: SUIDO_5X5,
  6: SUIDO_6X6,
  7: SUIDO_7X7,
  8: SUIDO_8X8,
  9: SUIDO_9X9,
  10: SUIDO_10X10,
  11: SUIDO_11X11,
  12: SUIDO_12X12,
  13: SUIDO_13X13,
  14: SUIDO_14X14,
  20: SUIDO_20X20,
  28: SUIDO_28X28,
  507: SUIDO_5X7,
  610: SUIDO_6X10,
  814: SUIDO_8X14,
  2050: SUIDO_20X50,
};

const rows = Object.entries(sizes).map(([size, levels]) => {
  const boards = levels.map(([board]) => board);
  let length = PREFIX_FLOOR;
  while (new Set(boards.map((board) => board.slice(0, length))).size !== boards.length) length += 1;
  if (boards.some((board) => board.length < length)) throw new Error(`A ${size} board is shorter than its prefix.`);
  const prefixes = boards.map((board) => board.slice(0, length)).join("");
  const hashes = boards.map((board) => suidoBoardHash(board)).join("");
  return `  ${size}: { prefixLength: ${length}, prefixes: "${prefixes}", hashes: "${hashes}" },`;
});
writeFileSync(
  new URL("../src/lib/puzzles/suido/levelBoards.data.ts", import.meta.url),
  `import type { SuidoLevelBoards } from "./levelBoards.types";

/**
 * WHAT A SERVER KNOWS OF EVERY SUIDO LEVEL: for each size (\`sizes.ts\`: a square's side, 507 for the 5×7, 2050 for the 20×50), the
 * sixteen-hex-digit hash of every level's board, run together in level order, and the first \`prefixLength\` characters of every
 * board the same way, as many as it takes for no two levels of the size to share them. The hash says which level a board is; the
 * prefix finds a level's solves in the database without the board (\`boardHash.ts\`). Written by \`node scripts/suido-level-hashes.ts\`,
 * never by hand, and held to the package's levels by \`levelBoards.test.ts\`: a level that changes fails the build until it is run again.
 * This is the browser's copy; a server reads the same boards from a packed file (\`levelBoards.ts\`), which \`pnpm data:pack\` writes from it.
 */
export const SUIDO_LEVEL_BOARDS: SuidoLevelBoards = {
${rows.join("\n")}
};
`,
);
console.log("src/lib/puzzles/suido/levelBoards.data.ts written; run `pnpm data:pack` for the file a server reads");
