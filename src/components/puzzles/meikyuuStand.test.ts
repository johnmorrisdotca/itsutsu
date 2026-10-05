import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { frameAspect } from "./MeikyuuFrame";

/*
 * The stylesheet caps a tall maze's wood by the window's height (`[data-mk-slot]`, and the modal's width in Just the
 * board) using the wood's width over its height as plain numbers. They are `frameAspect`'s, and are held to it here, so
 * a change to the rim or the frame cannot leave the page sizing a shape the wood no longer is.
 */
describe("the stylesheet's tall wood is the wood's shape", () => {
  const css = readFileSync("src/app/globals.css", "utf8");

  it("names the upright shape's width over its height", () => {
    const upright = Number((1 / frameAspect("upright")).toFixed(4));
    expect(css).toContain(`(100dvh - 10rem) * ${upright} + 24rem`);
  });

  it("names the lying shape's width over its height", () => {
    const lying = Number((1 / frameAspect("lying")).toFixed(4));
    expect(css).toContain(`(100dvh - 10rem) * ${lying} + 24rem`);
  });
});
