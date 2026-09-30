import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { APPLE_LAUNCH_SCREENS, LAUNCH_THEMES, appleStartupImages, launchImagePath } from "@/lib/app/appleLaunch";
import { wouldBeOpen } from "@/proxy";

import manifest from "./manifest";

/**
 * The home-screen app's pictures. A manifest naming a file that is missing,
 * the wrong size or behind the invite gate installs with a blank icon, and
 * nothing in a browser on a desk would ever show it — so each one is read
 * off the disk and asked of the gate as a stranger's phone would ask.
 */

/** Width and height, from a PNG's header. */
function pngSize(publicPath: string): string {
  const bytes = readFileSync(join(process.cwd(), "public", publicPath));
  expect(bytes.subarray(1, 4).toString("latin1"), `${publicPath} is not a PNG`).toBe("PNG");
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

describe("the web app manifest", () => {
  const app = manifest();

  it("opens standalone on the games list, the whole site its scope", () => {
    expect(app.display).toBe("standalone");
    expect(app.start_url).toBe("/games");
    expect(app.scope).toBe("/");
    expect(app.id).toBe("/");
  });

  it("has a plain and a maskable icon at both sizes Android asks for", () => {
    const offered = (app.icons ?? []).map((icon) => `${icon.purpose} ${icon.sizes}`).sort();
    expect(offered).toEqual(["any 192x192", "any 512x512", "maskable 192x192", "maskable 512x512"]);
  });

  it.each(manifest().icons ?? [])("$src is a PNG of the size it claims, open to a stranger", (icon) => {
    expect(pngSize(icon.src)).toBe(icon.sizes);
    expect(wouldBeOpen(icon.src)).toBe(true);
  });
});

describe("the iOS launch screens", () => {
  it("has a picture for every screen, in both themes, of that screen's size", () => {
    for (const screen of APPLE_LAUNCH_SCREENS) {
      for (const theme of LAUNCH_THEMES) {
        const path = launchImagePath(screen, theme);
        expect(pngSize(path)).toBe(`${screen.width * screen.ratio}x${screen.height * screen.ratio}`);
        expect(wouldBeOpen(path)).toBe(true);
      }
    }
  });

  it("names each one once, for exactly one screen and theme", () => {
    const images = appleStartupImages();
    const urls = images.map((image) => image.url);
    expect(new Set(urls).size).toBe(APPLE_LAUNCH_SCREENS.length * LAUNCH_THEMES.length);
    const media = images.map((image) => image.media);
    expect(new Set(media).size).toBe(media.length);
  });
});
