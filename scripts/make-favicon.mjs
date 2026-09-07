/**
 * Builds `src/app/favicon.ico` from `src/app/icon.svg`.
 *
 * An ICO is a tiny container: a header, one directory entry per size, then the
 * images themselves. Modern ICO files may hold PNG data directly rather than
 * the old bitmap format, which is what this writes — so the whole thing is a
 * header plus the PNGs Chromium renders, and needs no image library.
 *
 * Run with `pnpm favicon` after changing the SVG.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const SIZES = [16, 32, 48, 64, 128, 256];
const SOURCE = "src/app/icon.svg";
const TARGET = "src/app/favicon.ico";

const svg = readFileSync(SOURCE, "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();

const pngs = [];
for (const size of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0">${svg.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" `,
    )}</body></html>`,
  );
  pngs.push({ size, data: await page.screenshot({ omitBackground: true }) });
}
await browser.close();

const HEADER_BYTES = 6;
const ENTRY_BYTES = 16;

const header = Buffer.alloc(HEADER_BYTES);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // 1 = icon
header.writeUInt16LE(pngs.length, 4);

let offset = HEADER_BYTES + ENTRY_BYTES * pngs.length;
const entries = pngs.map(({ size, data }) => {
  const entry = Buffer.alloc(ENTRY_BYTES);
  // 0 means 256 in this field, which is why 256 is the largest size allowed.
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette size, unused for PNG
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

writeFileSync(
  TARGET,
  Buffer.concat([header, ...entries, ...pngs.map((png) => png.data)]),
);

console.log(
  `favicon.ico written from ${SOURCE} — ${pngs.length} sizes (${SIZES.join(", ")}px)`,
);
