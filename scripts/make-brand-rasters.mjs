/**
 * Builds the raster brand files a site needs alongside its SVGs:
 *
 *   src/app/apple-icon.png        180×180  the home-screen icon on iOS
 *   src/app/opengraph-image.png   1200×630 the card a shared link unfurls to
 *   public/icon-192.png            192×192  web app manifest
 *   public/icon-512.png            512×512  web app manifest, maskable
 *   public/brand/app/icon-*.png             the rest of the manifest's icons
 *   public/brand/app/splash/*.png           iOS launch screens, light and dark
 *
 * Rendered with Chromium, like the favicon, so nothing draws the marks but
 * the browser that will show them. Run with `pnpm brand:rasters` after the
 * kit changes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const PAPER = "#f7f5f1";
const INK = "#22231f";
const MUTED = "#6f6a62";

const avatar = readFileSync("public/brand/itsutsu-avatar-charcoal.svg", "utf8");
const hero = readFileSync("public/brand/onpage/itsutsu-hero-light.svg", "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();

async function shoot(width, height, html, path, options = {}) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<html><body style="margin:0;width:${width}px;height:${height}px">${html}</body></html>`);
  writeFileSync(path, await page.screenshot({ type: "png", omitBackground: options.transparent === true }));
  console.log(`${path.padEnd(32)} ${width}×${height}`);
}

/*
 * Icons. The avatar is already a rounded square, but iOS and Android mask an
 * icon themselves — iOS rounds it, Android may cut a circle — so the icon
 * files are the avatar's face bled to the edge, with the mark held inside
 * the safe zone. The "maskable" 512 leaves the most room.
 */
function square(size, inset) {
  const mark = avatar
    .replace(/<svg /, `<svg width="${size - inset * 2}" height="${size - inset * 2}" `);
  return `<div style="width:${size}px;height:${size}px;background:${INK};display:flex;align-items:center;justify-content:center">${mark}</div>`;
}
await shoot(180, 180, square(180, 0), "src/app/apple-icon.png");
await shoot(192, 192, square(192, 0), "public/icon-192.png");
await shoot(512, 512, square(512, 64), "public/icon-512.png");
// The manifest's other two: a plain 512 for a launcher that draws the icon as
// it is, and a 192 to mask, held inside the safe zone as the 512 is.
await shoot(512, 512, square(512, 0), "public/brand/app/icon-512.png");
await shoot(192, 192, square(192, 24), "public/brand/app/icon-maskable-192.png");

/*
 * Launch screens. iOS draws no splash of its own for a home-screen app: with
 * no image for the device it shows a blank white screen until the first page
 * paints, which in dark mode is a white flash. One image per screen size and
 * theme, the page's own paper with the icon in the middle, so opening the app
 * looks like the page arriving rather than a browser starting.
 *
 * The sizes are `APPLE_LAUNCH_SCREENS` in src/lib/app/appleLaunch.ts, read
 * from its JSON twin here because a plain node script cannot import TypeScript;
 * `appleLaunch.test.ts` holds the two, and the files, in step.
 */
const screens = JSON.parse(readFileSync("src/lib/app/appleLaunch.data.json", "utf8"));
const ivoryAvatar = readFileSync("public/brand/itsutsu-avatar-ivory.svg", "utf8");
for (const { width, height, ratio } of screens) {
  const w = width * ratio;
  const h = height * ratio;
  const side = Math.round(Math.min(w, h) * 0.3);
  for (const [theme, background, mark] of [["light", PAPER, avatar], ["dark", INK, ivoryAvatar]]) {
    const sized = mark.replace(/<svg /, `<svg width="${side}" height="${side}" `);
    await shoot(
      w,
      h,
      `<div style="width:${w}px;height:${h}px;background:${background};display:flex;align-items:center;justify-content:center">${sized}</div>`,
      `public/brand/app/splash/${theme}-${w}x${h}.png`,
    );
  }
}

/*
 * The social card. The hero on paper, the line the site says about itself,
 * and nothing else — the card is seen at a thumbnail's size in a chat, where
 * one mark and one line is all that reads.
 */
const heroSized = hero.replace(/<svg /, '<svg width="960" height="262" ');
const card = `
  <div style="width:1200px;height:630px;background:${PAPER};
       background-image:radial-gradient(circle at 15% 10%, rgba(0,0,0,.035) 0%, transparent 45%),
                        radial-gradient(circle at 85% 90%, rgba(0,0,0,.03) 0%, transparent 40%);
       display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;
       font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:${INK}">
    ${heroSized}
    <p style="margin:0;font-size:30px;color:${MUTED};letter-spacing:.01em">Five in a row, and the games that grew from it.</p>
    <p style="position:absolute;right:56px;bottom:40px;margin:0;font-size:22px;color:${MUTED};letter-spacing:.06em">itsutsu.com</p>
  </div>`;
await shoot(1200, 630, card, "src/app/opengraph-image.png");

await browser.close();
