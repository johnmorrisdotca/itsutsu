/**
 * The faces of the computer players.
 *
 *   public/art/bots/<key>.png            the portrait as generated, square
 *   public/art/bots/faces/<key>.jpg      280×280, cut here — every size the site draws
 *
 * A person on this site has a Google avatar and a program has nothing, which
 * is why every computer player has shown as a blank beside its name. These are
 * their photographs.
 *
 * CUT ONCE, HERE, INTO STATIC FILES, for the same reason the game thumbnails
 * are: `next/image` is a metered, revalidating step, and a file in public/ is
 * served like any other and costs nothing beyond the bytes. Twenty portraits
 * at two megabytes each is forty megabytes to draw twenty circles twenty
 * pixels wide.
 *
 * **280 pixels, and one file rather than three.** The site draws a picture at
 * 20 (the directory), 35, 70 and 140 CSS pixels, and a phone shows two device
 * pixels for each — so 280 is the most any screen asks of these, and every
 * smaller use is the browser scaling one file it has already fetched. Three
 * files would be three requests to save bytes nobody is short of.
 *
 * **The crop is square and centred because the avatar is a circle.** The site
 * draws these in `rounded-full`, so the corners are thrown away; anything that
 * matters has to be inside the inscribed circle, which is why the prompts ask
 * for a centred head filling most of the frame. `fit: "cover"` on an already
 * square source is a straight resize, and a source that is NOT square is
 * centre-cropped — said out loud because a portrait delivered at 1408×768,
 * which is what one image tool returned when asked for a square, would
 * otherwise lose both ears and nobody would know why.
 *
 * sharp is reached through Next's own copy, exactly as make-game-thumbs.mjs
 * does, and for the same reason: Next depends on it for this kind of work and
 * pnpm links it beside Next, so this project need not depend on it at all.
 */
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, parse } from "node:path";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");

/**
 * One folder per style, the same filename in each.
 *
 * John keeps every style side by side under the same filenames — `src-photo`,
 * `src-oil`, `src-enamel` — so choosing the site's look is choosing a folder,
 * and the styles not chosen stay on disk rather than being regenerated if the
 * decision is revisited. `BOT_ART=src-oil pnpm art:faces` cuts another set over
 * the top; the faces are named for the bot and never for the style, so nothing
 * downstream knows or cares which was chosen.
 *
 * `src-photo` is the default: studio portraits on a flat seamless backdrop, a
 * different colour per character. Measured at the 20 pixels the directory
 * actually draws, those read as clearly as the paintings did — it was the FLAT
 * BACKGROUND doing the work all along, not the medium. The first attempt, a
 * photograph in a real place with a busy background, was a smudge at that size.
 */
const ROOT = join("public", "art", "bots");
const IN = join(ROOT, process.env.BOT_ART ?? "src-photo");
const OUT = join(ROOT, "faces");
/** Kept in step with the largest size the site draws a picture at, doubled for retina. */
const SIZE = 280;

mkdirSync(OUT, { recursive: true });

const portraits = readdirSync(IN).filter(
  (file) => /\.(png|jpe?g|webp)$/i.test(file) && statSync(join(IN, file)).isFile(),
);

if (portraits.length === 0) {
  console.log(`No portraits in ${IN}. Drop one square image per bot in there, named for its key.`);
  process.exit(0);
}

let bytes = 0;
for (const file of portraits) {
  const source = join(IN, file);
  const { width, height } = await sharp(source).metadata();
  const out = join(OUT, `${parse(file).name}.jpg`);
  const info = await sharp(source)
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  bytes += info.size;
  // A source that was not square was cropped, and the operator should know
  // which ones rather than discover it on a face with no ears.
  const shape = width === height ? "" : `  ← source was ${width}×${height}, centre-cropped`;
  console.log(`${out.padEnd(46)} ${info.width}×${info.height} ${info.size} bytes${shape}`);
}
console.log(`${portraits.length} face(s), ${bytes} bytes in all`);
