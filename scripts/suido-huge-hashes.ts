/**
 * Writes src/lib/puzzles/suido/hugeLevels.data.ts: the hash of every board of the huge Suido sizes (20×20, 28×28, 20×50), in
 * level order, which is all the server reads of them (`suido/boardHash.ts`). Run it after the package's levels change:
 *
 *     node scripts/suido-huge-hashes.ts
 *
 * `hugeLevels.test.ts` holds the file to the package's own data, so a package that changes a huge level without this being run fails the build.
 */
import { writeFileSync } from "node:fs";

import { SUIDO_20X20 } from "@johnmorrisdotca/suido/levels-20x20";
import { SUIDO_20X50 } from "@johnmorrisdotca/suido/levels-20x50";
import { SUIDO_28X28 } from "@johnmorrisdotca/suido/levels-28x28";

import { PREFIX, suidoBoardHash } from "../src/lib/puzzles/suido/boardHash.ts";

const sizes: Record<number, readonly (readonly [string, string, string])[]> = { 20: SUIDO_20X20, 28: SUIDO_28X28, 2050: SUIDO_20X50 };
const rows = Object.entries(sizes).map(([size, levels]) => `  ${size}: [\n${levels.map(([board]) => `    { prefix: "${board.slice(0, PREFIX)}", hash: "${suidoBoardHash(board)}" },`).join("\n")}\n  ],`);
writeFileSync(
  new URL("../src/lib/puzzles/suido/hugeLevels.data.ts", import.meta.url),
  `/**
 * THE HASH AND THE FIRST CHARACTERS OF EVERY BOARD OF SUIDO'S HUGE SIZES, in level order, by size (\`sizes.ts\`: 20, 28 and 2050 for
 * the 20×50). Written by \`node scripts/suido-huge-hashes.ts\`, never by hand, and held to the package's levels by
 * \`hugeLevels.test.ts\`. It is what a server knows of these levels: the hash says which level a board is, and the prefix finds
 * a level's solves in the database without the board (\`boardHash.ts\`).
 */
export const SUIDO_HUGE_BOARDS: Readonly<Record<number, readonly { prefix: string; hash: string }[]>> = {
${rows.join("\n")}
};
`,
);
console.log("src/lib/puzzles/suido/hugeLevels.data.ts written");
