import { describe, expect, it } from "vitest";

import { MEIKYUU_TALL_RATIO } from "./sizes";
import { isWayUp, lyingDown, MEIKYUU_RESERVE_PX, roomOf } from "./turn";

/*
 * WHICH WAY UP A TALL MAZE STANDS (`turn.ts`): upright on a phone held upright, lying down where that makes it bigger,
 * and the reader's own choice over both.
 */
describe("a tall maze's way up", () => {
  const ratio = MEIKYUU_TALL_RATIO;

  it("knows the room only once it has a column and a window", () => {
    expect(roomOf(0, 800)).toBeNull();
    expect(roomOf(300, 0)).toBeNull();
    expect(roomOf(300, 800)).toEqual({ width: 300, height: 800 - MEIKYUU_RESERVE_PX });
    // A short window keeps three fifths of itself for the board, however much the page holds.
    expect(roomOf(300, 300)).toEqual({ width: 300, height: 180 });
  });

  it("stays upright on a phone held upright, which is how it was made", () => {
    expect(lyingDown("auto", ratio, roomOf(341, 844))).toBe(false);
    expect(lyingDown("auto", ratio, roomOf(311, 740))).toBe(false);
  });

  it("lies down where the room is wide and short, which is a phone on its side and a wide column on a desk", () => {
    expect(lyingDown("auto", ratio, roomOf(800, 390))).toBe(true);
    expect(lyingDown("auto", ratio, roomOf(1100, 800))).toBe(true);
  });

  it("is left as it was made when lying down gains under a twelfth, and when the room is not known", () => {
    expect(lyingDown("auto", ratio, roomOf(576, 800))).toBe(false);
    expect(lyingDown("auto", ratio, null)).toBe(false);
  });

  it("does what the reader chose over what the room says", () => {
    expect(lyingDown("portrait", ratio, roomOf(1100, 800))).toBe(false);
    expect(lyingDown("landscape", ratio, roomOf(341, 844))).toBe(true);
    expect(lyingDown("landscape", ratio, null)).toBe(true);
  });

  it("reads only its three words from a store", () => {
    expect(isWayUp("auto") && isWayUp("portrait") && isWayUp("landscape")).toBe(true);
    expect(isWayUp("upright")).toBe(false);
    expect(isWayUp(null)).toBe(false);
  });
});
