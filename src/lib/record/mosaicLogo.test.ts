import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MOSAIC_WORDMARK } from "./mosaicLogo.constants";

describe("the wordmark on the picture's bar", () => {
  it("is the brand kit's dark-ground wordmark, exactly", () => {
    const kit = readFileSync(join(process.cwd(), "public", "brand", "itsutsu-wordmark-dark.svg"), "utf8");
    expect(kit).toContain(`viewBox="0 0 ${MOSAIC_WORDMARK.width.toFixed(3)} ${MOSAIC_WORDMARK.height.toFixed(3)}"`);
    expect(kit.slice(kit.indexOf("</title>") + "</title>".length, kit.lastIndexOf("</svg>")).trim()).toBe(MOSAIC_WORDMARK.body);
  });
});
