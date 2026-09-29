import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { KUMIMOJI_SHOTS, KUMIMOJI_SHOT_ORDER } from "./shots.constants";

/**
 * KUMIMOJI'S PICTURES ARE MADE, NOT DRAWN. Every file the front door shows is
 * written by `e2e/kumimoji-shots.spec.ts` from real play, so it can be made
 * again the day the game's drawing changes. This fails the build when a file
 * named in `KUMIMOJI_SHOTS` is missing, is not the size the page keeps room
 * for, is heavy, has no words for a reader who cannot see it, or is one the
 * spec does not make.
 */
const SPEC = readFileSync(join("e2e", "kumimoji-shots.spec.ts"), "utf8");
/** A picture on a page anybody can open, on a phone: a few tens of kilobytes. */
const MOST_BYTES = 80_000;

/** A JPEG's width and height, from its frame header. */
function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let at = 2;
  while (at < bytes.length) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1]!;
    const length = bytes.readUInt16BE(at + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
    at += 2 + length;
  }
  return null;
}

describe("Kumimoji's pictures", () => {
  it.each(Object.entries(KUMIMOJI_SHOTS))("%s is on disk at the size the page keeps for it, and light", (_, shot) => {
    const path = join("public", shot.src);
    const bytes = readFileSync(path);
    expect(jpegSize(bytes)).toEqual({ width: shot.width, height: shot.height });
    expect(statSync(path).size).toBeLessThanOrEqual(MOST_BYTES);
  });

  it.each(Object.entries(KUMIMOJI_SHOTS))("%s is made by the capture spec and says what it shows", (key, shot) => {
    expect(SPEC, `e2e/kumimoji-shots.spec.ts never writes ${shot.src}`).toContain(`KUMIMOJI_SHOTS.${key}`);
    expect(shot.alt.length).toBeGreaterThan(40);
    expect(shot.caption.length).toBeGreaterThan(10);
    // Our own game, under our own name (`PUZZLE_DISPLAY.kumimoji`).
    expect(`${shot.alt} ${shot.caption} ${shot.src}`).not.toMatch(/banana|scrabble/i);
  });

  it("shows every picture it has, once", () => {
    expect([...KUMIMOJI_SHOT_ORDER].sort()).toEqual(Object.keys(KUMIMOJI_SHOTS).sort());
  });
});
