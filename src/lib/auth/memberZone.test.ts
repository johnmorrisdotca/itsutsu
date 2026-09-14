import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Whether the site still has to ask what day it is for somebody.
 *
 * The server's answer is what decides whether the browser is ever asked, so it
 * is the whole of "a zone the member chose is never overwritten": a member with
 * a zone makes this false, the sender is never mounted, and no write can happen.
 * Tested here rather than in the browser because that is where the rule lives.
 */

const memberRowFor =
  vi.fn<(key: string) => Promise<{ timeZone: string | null; country: string | null; preferences?: unknown } | null>>();

vi.mock("./members", () => ({ memberRowFor }));

const { dayZoneUnknown } = await import("./memberZone");

beforeEach(() => {
  memberRowFor.mockReset();
});

describe("do we know when this member's day ends", () => {
  it("yes, we do not: an empty column is every member who never opened their profile", async () => {
    memberRowFor.mockResolvedValue({ timeZone: "", country: "" });
    expect(await dayZoneUnknown("aki@example.com")).toBe(true);
  });

  it("no: a zone they chose is theirs and must never be written over", async () => {
    memberRowFor.mockResolvedValue({ timeZone: "America/Vancouver", country: "Canada" });
    expect(await dayZoneUnknown("aki@example.com")).toBe(false);
  });

  it("no: UTC they chose themselves is a choice, not the floor", async () => {
    /*
     * The distinction the whole fix rests on. Before `dayZoneFor` carried
     * `theirs`, this row and the empty one above produced the same day key — so
     * a member who had deliberately set UTC would have had the browser quietly
     * overwrite it on their next page load.
     */
    memberRowFor.mockResolvedValue({ timeZone: "UTC", country: "" });
    expect(await dayZoneUnknown("aki@example.com")).toBe(false);
  });

  it("yes: a zone that is only the country's guess may still be improved on", async () => {
    /* Rung 2 beats rung 3. This row holds exactly what we would have guessed
       from Canada, so it is indistinguishable from our own writing — and the
       browser, which measures, is allowed to replace it. */
    memberRowFor.mockResolvedValue({ timeZone: "America/Toronto", country: "Canada" });
    expect(await dayZoneUnknown("aki@example.com")).toBe(true);
  });

  it("no: the same zone with no country behind it was nobody's guess", async () => {
    /* Toronto on a row with no country cannot have come from the table, so it
       came from a person or a browser and is left alone. */
    memberRowFor.mockResolvedValue({ timeZone: "America/Toronto", country: "" });
    expect(await dayZoneUnknown("aki@example.com")).toBe(false);
  });

  it("yes: a zone this platform cannot read is no better than none", async () => {
    memberRowFor.mockResolvedValue({ timeZone: "Mars/Olympus", country: "" });
    expect(await dayZoneUnknown("aki@example.com")).toBe(true);
  });

  it("no: a zone they CHOSE is theirs even when it is exactly the country's guess", async () => {
    /* The case the comparison above cannot see, settled by the source the row
       records. Without it this member's browser was asked, and a trip moved them. */
    memberRowFor.mockResolvedValue({
      timeZone: "America/Toronto",
      country: "Canada",
      preferences: { timeZoneFrom: "chosen" },
    });
    expect(await dayZoneUnknown("aki@example.com")).toBe(false);
  });

  it("no: a zone their browser reported is not asked for again", async () => {
    memberRowFor.mockResolvedValue({ timeZone: "America/Toronto", country: "Canada", preferences: { timeZoneFrom: "device" } });
    expect(await dayZoneUnknown("aki@example.com")).toBe(false);
  });

  it("yes: a guess the row records as a guess may still be improved on", async () => {
    memberRowFor.mockResolvedValue({ timeZone: "America/Toronto", country: "Canada", preferences: { timeZoneFrom: "country" } });
    expect(await dayZoneUnknown("aki@example.com")).toBe(true);
  });

  it("asks nothing for a reader who is not signed in", async () => {
    expect(await dayZoneUnknown(null)).toBe(false);
    expect(memberRowFor).not.toHaveBeenCalled();
  });

  it("asks nothing for the operator, who has no member row to record one on", async () => {
    memberRowFor.mockResolvedValue(null);
    expect(await dayZoneUnknown("operator@example.com")).toBe(false);
  });
});
