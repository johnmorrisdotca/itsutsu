import { describe, expect, it } from "vitest";

import { holdsVersion, versionTag } from "./gameVersion";

describe("versionTag", () => {
  it("is a quoted tag that changes with each of the three numbers", () => {
    const at = new Date("2026-09-23T12:00:00Z");
    const tag = versionTag(at, 10, 2);
    expect(tag).toMatch(/^"g[0-9a-z]+-10-2"$/);
    expect(versionTag(new Date(at.getTime() + 1), 10, 2)).not.toBe(tag);
    expect(versionTag(at, 11, 2)).not.toBe(tag);
    expect(versionTag(at, 10, 3)).not.toBe(tag);
  });
});

describe("holdsVersion", () => {
  const tag = versionTag(new Date("2026-09-23T12:00:00Z"), 4, 0);

  it("is true only for a request naming this version", () => {
    expect(holdsVersion(tag, tag)).toBe(true);
    expect(holdsVersion(versionTag(new Date("2026-09-23T12:00:01Z"), 4, 0), tag)).toBe(false);
  });

  it("is false for a request that names nothing, so a first ask always gets the game", () => {
    expect(holdsVersion(null, tag)).toBe(false);
    expect(holdsVersion("", tag)).toBe(false);
  });

  it("reads a list of tags, a weak tag and the wildcard as HTTP says a GET should", () => {
    expect(holdsVersion(`"other", ${tag}`, tag)).toBe(true);
    expect(holdsVersion(`W/${tag}`, tag)).toBe(true);
    expect(holdsVersion("*", tag)).toBe(true);
  });
});
