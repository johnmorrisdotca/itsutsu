import { beforeEach, describe, expect, it, vi } from "vitest";

import { PRESENT_WITHIN_MS } from "@/components/live/live.constants";

const queryRaw = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: (...args: unknown[]) => queryRaw(...args) } }));

import { gameVersion, holdsVersion, versionTag } from "./gameVersion";

const nobody = { black: false, white: false };
const both = { black: true, white: true };

describe("versionTag", () => {
  it("is a quoted tag that changes with each of the three numbers", () => {
    const at = new Date("2026-09-23T12:00:00Z");
    const tag = versionTag(at, 10, 2, nobody);
    expect(tag).toMatch(/^"g[0-9a-z]+-10-2-n"$/);
    expect(versionTag(new Date(at.getTime() + 1), 10, 2, nobody)).not.toBe(tag);
    expect(versionTag(at, 11, 2, nobody)).not.toBe(tag);
    expect(versionTag(at, 10, 3, nobody)).not.toBe(tag);
  });

  it("changes when a seat's player arrives or leaves, and only then", () => {
    const at = new Date("2026-09-23T12:00:00Z");
    const tags = [nobody, { black: true, white: false }, { black: false, white: true }, both].map((here) =>
      versionTag(at, 10, 2, here),
    );
    expect(new Set(tags).size).toBe(4);
    expect(versionTag(at, 10, 2, { black: true, white: true })).toBe(tags[3]);
  });
});

describe("gameVersion", () => {
  const now = new Date("2026-09-26T09:00:00Z");
  const row = { updatedAt: new Date("2026-09-26T08:59:00Z"), moveCount: 7, remarks: 1 };

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("reads the game and who is here in ONE query, and puts presence in the tag", async () => {
    queryRaw.mockResolvedValueOnce([{ ...row, blackHere: true, whiteHere: false }]);
    const version = await gameVersion("k3m9-p2qx", now);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(version).toEqual({ tag: versionTag(row.updatedAt, 7, 1, { black: true, white: false }), here: { black: true, white: false } });
  });

  it("asks about the last two minutes, counted from the moment given", async () => {
    queryRaw.mockResolvedValueOnce([{ ...row, blackHere: false, whiteHere: false }]);
    await gameVersion("k3m9-p2qx", now);
    const values = queryRaw.mock.calls[0]!.slice(1);
    expect(values).toContainEqual(new Date(now.getTime() - PRESENT_WITHIN_MS));
    expect(values).toContain("k3m9-p2qx");
  });

  it("keeps the same tag while nobody comes or goes, and a new one when somebody does", async () => {
    queryRaw.mockResolvedValueOnce([{ ...row, blackHere: true, whiteHere: true }]);
    queryRaw.mockResolvedValueOnce([{ ...row, blackHere: true, whiteHere: true }]);
    queryRaw.mockResolvedValueOnce([{ ...row, blackHere: true, whiteHere: false }]);
    const first = await gameVersion("k3m9-p2qx", now);
    const same = await gameVersion("k3m9-p2qx", now);
    const left = await gameVersion("k3m9-p2qx", now);
    expect(same!.tag).toBe(first!.tag);
    expect(left!.tag).not.toBe(first!.tag);
    expect(holdsVersion(first!.tag, left!.tag)).toBe(false);
  });

  it("says no such game for an id that names none", async () => {
    queryRaw.mockResolvedValueOnce([]);
    expect(await gameVersion("nope-nope", now)).toBeNull();
  });
});

describe("holdsVersion", () => {
  const tag = versionTag(new Date("2026-09-23T12:00:00Z"), 4, 0, nobody);

  it("is true only for a request naming this version", () => {
    expect(holdsVersion(tag, tag)).toBe(true);
    expect(holdsVersion(versionTag(new Date("2026-09-23T12:00:01Z"), 4, 0, nobody), tag)).toBe(false);
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
