import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CENTRED_TEXT_DROP, centredBaseline } from "./svgText";

/** Every source file under src/, but this gate and its helper, which name the attribute to explain it. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(tsx?|css)$/.test(name) && !/svgText(\.coverage\.test)?\.ts$/.test(name) ? [path] : [];
  });
}

describe("SVG text is centred by its baseline, not by dominant-baseline", () => {
  it("drops the baseline by a share of the font size", () => {
    expect(centredBaseline(2.5, 0.75)).toBeCloseTo(2.5 + 0.75 * CENTRED_TEXT_DROP);
  });

  it("uses dominant-baseline nowhere, since iPhone Safari ignores it", () => {
    const offenders = sources(join(process.cwd(), "src")).filter((path) =>
      /dominantBaseline|dominant-baseline/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
