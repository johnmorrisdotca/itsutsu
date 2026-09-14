import { afterEach, describe, expect, it } from "vitest";

import { readerWhen, stableWhen } from "./when";

// Twenty-one past midnight UTC on the 14th: the 14th in Tokyo, still the 13th in Vancouver.
const AT = "2026-09-14T00:21:23.000Z";

const processZone = process.env.TZ;
afterEach(() => {
  if (processZone === undefined) delete process.env.TZ;
  else process.env.TZ = processZone;
});

describe("stableWhen — the form the server and the hydrating browser share", () => {
  it("prints the moment in UTC digits and says it is UTC", () => {
    expect(stableWhen(AT, "dateTime")).toBe("2026-09-14 00:21 UTC");
    expect(stableWhen(AT, "date")).toBe("2026-09-14 UTC");
    expect(stableWhen(AT, "time")).toBe("00:21 UTC");
  });

  it("does not move with the zone the process is running in", () => {
    process.env.TZ = "UTC";
    const inUtc = stableWhen(AT, "dateTime");
    const utcHour = new Date(AT).getHours();
    process.env.TZ = "Asia/Tokyo";
    // The zone really did change under it, or this case would prove nothing.
    expect(new Date(AT).getHours()).not.toBe(utcHour);
    expect(stableWhen(AT, "dateTime")).toBe(inUtc);
  });

  it("answers nothing for something that is not a moment", () => {
    expect(stableWhen("not a date", "dateTime")).toBeNull();
    expect(stableWhen("", "date")).toBeNull();
  });
});

describe("readerWhen — the form the browser switches to once it has the page", () => {
  it("says the time in the zone it is given, not the process's", () => {
    process.env.TZ = "UTC";
    expect(readerWhen(AT, "time", "en", "Asia/Tokyo")).toMatch(/^9:21\sAM$/u);
    expect(readerWhen(AT, "time", "en", "America/Vancouver")).toMatch(/^5:21\sPM$/u);
  });

  it("says the day the reader is on, which is not always the server's", () => {
    expect(readerWhen(AT, "date", "en", "Asia/Tokyo")).toBe("Sep 14, 2026");
    expect(readerWhen(AT, "date", "en", "America/Vancouver")).toBe("Sep 13, 2026");
  });

  it("speaks the site's language", () => {
    expect(readerWhen(AT, "date", "ja", "Asia/Tokyo")).toBe("2026/09/14");
  });

  it("answers nothing for something that is not a moment", () => {
    expect(readerWhen("not a date", "dateTime", "en", "UTC")).toBeNull();
  });
});
