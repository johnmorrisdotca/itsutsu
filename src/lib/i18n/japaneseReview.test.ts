import { describe, expect, it } from "vitest";

import type { DraftedPhrase } from "./dictionaries/ja.drafted.constants";
import { awaitsPerson, reviewCounts, reviewLabel, reviewState } from "./japaneseReview";

/**
 * The states a drafted phrase can be in, said once, by value. The gate in
 * `japanese.coverage.test.ts` holds the real dictionary to them; this holds
 * the rules themselves, so a change to one fails here and not only as a
 * confusing difference in the generated sheet.
 */

const text = { text: "遊ぶ", back: "Play." };
const agent = { by: "agent", on: "2026-10-06" } as const;
const person = { by: "person", on: "2026-10-07" } as const;

describe("who has read a phrase", () => {
  it("calls a phrase with no review drafted", () => {
    expect(reviewState(text)).toBe("drafted");
  });

  it("names the agent and the person that read it", () => {
    expect(reviewState({ ...text, review: agent })).toBe("agent");
    expect(reviewState({ ...text, review: person })).toBe("person");
  });
});

describe("what waits for a person", () => {
  it("is a question nobody has read", () => {
    expect(awaitsPerson({ ...text, ask: "Which word?" })).toBe(true);
  });

  it("is a phrase the agent passed but marked for a native read", () => {
    expect(awaitsPerson({ ...text, review: agent, ask: "A native read is wanted." })).toBe(true);
  });

  it("is nothing once a person has read it, whatever the note says", () => {
    expect(awaitsPerson({ ...text, review: person, ask: "left over" })).toBe(false);
  });

  it("is nothing for a phrase with no note, read or not", () => {
    expect(awaitsPerson(text)).toBe(false);
    expect(awaitsPerson({ ...text, review: agent })).toBe(false);
  });
});

describe("the Review column", () => {
  const cases: readonly [string, DraftedPhrase, string][] = [
    ["drafted", text, "Drafted, unread"],
    ["a question", { ...text, ask: "Which?" }, "Question, unread"],
    ["agent read", { ...text, review: agent }, "Agent 2026-10-06"],
    ["person read", { ...text, review: person }, "Person 2026-10-07"],
    ["agent read, native wanted", { ...text, review: agent, ask: "Read it." }, "Agent 2026-10-06, native read wanted"],
  ];

  it.each(cases)("says %s in words", (_name, row, label) => {
    expect(reviewLabel(row)).toBe(label);
  });
});

describe("the counts at the head of the sheet", () => {
  it("add up to every machine-written phrase", () => {
    const counts = reviewCounts();
    expect(counts.drafted + counts.agent + counts.person).toBe(counts.total);
    expect(counts.waiting).toBeLessThanOrEqual(counts.total);
  });
});
