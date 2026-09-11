/**
 * The thumbnail a list shows beside a game's name.
 *
 *   public/art/games/<variant>.jpg          712×712, the board mid-game, from
 *                                           `pnpm screenshots:games`
 *   public/art/games/thumbs/<variant>.jpg    96×96, cut from it here
 *
 * John, on /play: "it's all just text. very ugly and hard to scan. no
 * icons or images." The boards exist — one per game, required by the New Game
 * Gate — and were simply not used in any list. A list cannot use the full
 * ones: forty boards at fifty kilobytes each is two megabytes to draw forty
 * squares forty pixels wide, on a site whose standing rule tonight is that
 * nothing may cost it extra money.
 *
 * CUT ONCE, HERE, INTO STATIC FILES — rather than handed to next/image. The
 * optimiser is a metered, revalidating step (its own docs say a longer
 * `minimumCacheTTL` will "potentially lower cost"), and the rules page already
 * serves these boards as a plain <img> for the same reason. A file in public/
 * is served like any other and costs the same as the one it was cut from.
 *
 * 96 pixels because the lists draw them at 40–48 and a phone shows two device
 * pixels for each: 96 is crisp at 48 on a retina screen, and a whole board
 * scaled down reads as a KIND of board — green cells, a star, a hex grid —
 * which is what makes a queue scannable. Between three and five kilobytes
 * each.
 *
 * sharp is reached through Next's own copy. It is not a dependency of this
 * project, and it does not need to be: Next depends on it for exactly this
 * kind of work, pnpm links it beside Next, and resolving from Next's package
 * finds it. `pnpm art:thumbs` runs this; `pnpm screenshots:games` runs it
 * after cutting new boards, so the two sets cannot drift.
 */
import { mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");

const IN = join("public", "art", "games");
const OUT = join(IN, "thumbs");
/** Kept in step with THUMB_SIZE in src/lib/gomoku/artwork.ts, which a script cannot import. */
const SIZE = 96;

mkdirSync(OUT, { recursive: true });
const boards = readdirSync(IN).filter((file) => file.endsWith(".jpg"));
let bytes = 0;
for (const file of boards) {
  const info = await sharp(join(IN, file))
    .resize(SIZE, SIZE, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, file));
  bytes += info.size;
  console.log(`${join(OUT, file).padEnd(44)} ${info.width}×${info.height} ${info.size} bytes`);
}
console.log(`${boards.length} thumbnails, ${bytes} bytes in all`);
