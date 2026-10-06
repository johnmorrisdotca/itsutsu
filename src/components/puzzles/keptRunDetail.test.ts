import { describe, expect, it } from "vitest";

import { speaker } from "@/lib/i18n/i18n";

import { keptRunDetail } from "./keptRunDetail";

const EN = speaker("en");
const JA = speaker("ja");
const RUN = { size: 3, level: "easy", seed: 1234, checksAllowed: null, hintsAllowed: false, strict: false, elapsedMs: 83_000 };

describe("a kept run, named by what it is", () => {
  it("says the size, the level and the time so far", () => {
    expect(keptRunDetail("cube", RUN, EN)).toBe("3×3 · Easy · 1:23 so far");
  });

  it("tells a 3×3 from a 2×2, which is what a Continue beside a chosen 2×2 has to do", () => {
    expect(keptRunDetail("cube", { ...RUN, size: 2 }, EN)).toContain("2×2");
    expect(keptRunDetail("cube", RUN, EN)).not.toContain("2×2");
  });

  it("says it in the reader's language, as My games does", () => {
    const line = keptRunDetail("cube", RUN, JA);
    expect(line).toContain("3×3");
    expect(line).not.toContain("so far");
    expect(line).not.toContain("Easy");
  });

  it("adds the checks and hints it was asked with", () => {
    expect(keptRunDetail("numberPlace", { ...RUN, size: 9, checksAllowed: 3, hintsAllowed: true }, EN)).toContain("3 checks");
  });
});

describe("the note above a puzzle's set-up, in both languages", () => {
  it("counts the runs in each, and names the run in the Continue", () => {
    const en = speaker("en");
    const ja = speaker("ja");
    expect(en.count("live.kept", 1)).toBe("You have one in progress");
    expect(en.count("live.kept", 3)).toBe("You have 3 in progress");
    expect(ja.count("live.kept", 3)).toContain("3");
    expect(en.say("live.keptContinue", { run: "3×3 · Easy" })).toBe("Continue your 3×3 · Easy");
    expect(ja.say("live.keptContinue", { run: "3×3 · Easy" })).toContain("3×3 · Easy");
    expect(ja.say("live.keptContinue", { run: "3×3 · Easy" })).not.toContain("Continue");
  });
});
