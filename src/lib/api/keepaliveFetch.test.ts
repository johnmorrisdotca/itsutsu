import { afterEach, describe, expect, it, vi } from "vitest";

import { fitsKeepalive, keepaliveFetch, KEEPALIVE_MAX_BYTES } from "./keepaliveFetch";

/**
 * A write that outlives the page that made it — within what a browser will carry.
 * See `keepaliveFetch.ts`: a keepalive body over the browser's cap is refused
 * outright, so a large one must go as an ordinary request rather than not at all.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("keepaliveFetch", () => {
  it("sends a small write keepalive, as JSON, to the address and method asked", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await keepaliveFetch("/api/games/abc/moves", "POST", { row: 7, col: 7 });

    expect(fetchMock).toHaveBeenCalledWith("/api/games/abc/moves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row: 7, col: 7 }),
      keepalive: true,
    });
  });

  it("sends a write too big for the browser's cap as an ordinary request, rather than not at all", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const moves = Array.from({ length: 2_000 }, (_, index) => ({ row: index % 19, col: index % 17, stone: "black" }));

    await keepaliveFetch("/api/games", "POST", { moves });

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.keepalive).toBe(false);
    expect(init.body).toBe(JSON.stringify({ moves }));
  });
});

describe("fitsKeepalive", () => {
  it("counts bytes, not characters, since the cap is in bytes", () => {
    // Three bytes a character in UTF-8: a string short in characters can be long in bytes.
    const kanji = "対".repeat(Math.floor(KEEPALIVE_MAX_BYTES / 3) + 1);
    expect(kanji.length).toBeLessThan(KEEPALIVE_MAX_BYTES);
    expect(fitsKeepalive(kanji)).toBe(false);
    expect(fitsKeepalive("a".repeat(KEEPALIVE_MAX_BYTES))).toBe(true);
    expect(fitsKeepalive("a".repeat(KEEPALIVE_MAX_BYTES + 1))).toBe(false);
  });
});
