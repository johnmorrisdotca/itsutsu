import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { TenkaGame, TenkaShapes } from "@johnmorrisdotca/tenka";

import { unpackText } from "@/lib/packed/pack";

let shapes: { world: TenkaShapes; europe: TenkaShapes } | null = null;

/**
 * HOW A GAME'S MAP IS DRAWN, ON A SERVER: read from a file, never imported.
 *
 * The outlines are the package's (`tenkaShapes.browser.ts` names them, and is what
 * a browser build gets in place of this module: `next.config.ts` swaps it). This
 * keeps the address the map's components import, which a picture's fingerprint
 * names (`partyArtFingerprint.ts`), so that swapping it re-takes no picture.
 * Imported by the components that draw the map on the server for the first paint,
 * they were compiled into the pages' function three times over, 563 KB of source
 * (measured 2026-10-06). The server reads them from `tenkaShapes.json.br`
 * (`src/lib/packed/`, 46 KB) the first time a map is drawn and once for the life
 * of the process, by a path the build's tracer can follow, so keep it literal.
 * `pnpm data:pack` writes the file from the package, and
 * `packedData.coverage.test.ts` fails when the two come apart.
 */
export function tenkaShapesFor(game: Pick<TenkaGame, "map">): TenkaShapes {
  shapes ??= JSON.parse(unpackText(readFileSync(join(process.cwd(), "src/lib/packed", "tenkaShapes.json.br")))) as { world: TenkaShapes; europe: TenkaShapes };
  return game.map === "europe" ? shapes.europe : shapes.world;
}
