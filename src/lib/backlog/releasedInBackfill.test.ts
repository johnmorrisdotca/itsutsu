import { describe, expect, it } from "vitest";

import { looksLikeTestLitter, planBackfill, tallyPlan } from "./releasedInBackfill";
import type { BackfillRow, ReleaseMoment } from "./releasedInBackfill.types";
import { bestSharedRun, rowWords, singular, words, wordWeights } from "./releasedInBackfill.words";

/**
 * A changelog small enough to reason about and shaped like the real one in the
 * two ways that decide anything: a handful of words appear in nearly every
 * entry (`name`, `link`, `page`), and a handful appear in exactly one
 * (`halma`, `champion`, `hexagon`). Those two facts are what the rules read,
 * so a fake without both would prove nothing about the file it stands in for.
 */
const CHANGELOG: ReleaseMoment[] = [
  release("0.10.0", "2026-03-10T10:00:00Z", [
    "Halma ハルマ: the race game, with jump chains and shaded camps; the first game here that is not about lines",
  ]),
  release("0.9.0", "2026-03-09T10:00:00Z", [
    "Champions 名人: the best-rated player at every game on one page, and each game's own ladder beneath it",
  ]),
  release("0.8.0", "2026-03-08T10:00:00Z", [
    "Hexagon boards: a rhombus of hexagons, six neighbours to a cell",
    "A name in the directory links to its page",
  ]),
  release("0.7.0", "2026-03-07T10:00:00Z", ["Every name the site prints leads to the person, so no name is a dead end"]),
  release("0.6.0", "2026-03-06T10:00:00Z", ["A name in the here-now list links to its page, as the directory already did"]),
  release("0.5.0", "2026-03-05T10:00:00Z", ["Names in the record link out, and a game says when it ended"]),
  release("0.4.0", "2026-03-04T10:00:00Z", ["A name on the players page links to that member"]),
  release("0.3.0", "2026-03-03T10:00:00Z", ["Away days: mark a range on your profile, and deadlines in your games wait for it"]),
  release("0.2.0", "2026-03-02T10:00:00Z", ["A recurring weekly day off that deadlines honour, stepping over it every week"]),
  release("0.1.0", "2026-03-01T10:00:00Z", ["The board remembers a skin against the account rather than the browser"]),
];

function release(version: string, at: string, notes: string[]): ReleaseMoment {
  return { version, date: null, notes, at, instantFrom: "version-bump", commit: `c${version.replace(/\./g, "")}` };
}

function row(key: string, title: string, movedAt = "2026-03-20T10:00:00Z"): BackfillRow {
  return { key, title, status: "done", createdAt: "2026-02-01T10:00:00Z", movedAt, releasedIn: null };
}

/** The one mapping for a key, or a failure naming why it is not there. */
function mappingFor(plan: ReturnType<typeof planBackfill>, key: string) {
  const found = plan.mapped.find((item) => item.key === key);
  if (found === undefined) {
    const refused = plan.unmapped.find((item) => item.reason !== undefined && item.key === key);
    throw new Error(`${key} was not mapped: ${refused?.reason ?? "not in the plan at all"} — ${refused?.note ?? ""}`);
  }
  return found;
}

describe("words", () => {
  it("keeps a CJK run whole, because it is the most distinctive thing in a title", () => {
    expect(words("Grand Reversi 大リバーシ on ten by ten")).toContain("大リバーシ");
  });

  it("drops the site's own vocabulary, which is in nearly every release", () => {
    const found = words("Every game on one plain page for the player");
    expect(found).not.toContain("game");
    expect(found).not.toContain("page");
    expect(found).not.toContain("player");
    expect(found).toContain("plain");
  });

  it("folds a plural onto its singular so ladders and ladder are one word", () => {
    expect(singular("ladders")).toBe("ladder");
    expect(singular("diagrams")).toBe("diagram");
    expect(singular("stories")).toBe("story");
    expect(singular("glasses")).toBe("glass");
  });

  it("leaves a word that merely ends in s alone", () => {
    expect(singular("less")).toBe("less");
    expect(singular("bonus")).toBe("bonus");
    expect(singular("hex")).toBe("hex");
  });

  it("reads a row's key as words too, so a key and a title reinforce each other", () => {
    expect(rowWords({ key: "halma-the-first-race-game", title: "Halma, a game with no lines" })).toEqual(
      expect.arrayContaining(["halma", "race", "line"]),
    );
  });

  it("weighs a word used once far above one used in every entry", () => {
    const weights = wordWeights(CHANGELOG);
    expect(weights.get("halma")).toBeGreaterThan(weights.get("name")!);
    expect(weights.get("champion")).toBeGreaterThan(weights.get("link")!);
  });

  it("measures a quoted run rather than a scattered overlap", () => {
    const quoted = bestSharedRun("Every name the site prints leads to that player", [
      "Every name the site prints leads to the person, so no name is a dead end",
    ]);
    const scattered = bestSharedRun("Every name the site prints leads to that player", [
      "A player prints every name that the site leads",
    ]);
    expect(quoted).toBeGreaterThan(0.6);
    expect(scattered).toBeLessThan(quoted);
  });
});

describe("planBackfill", () => {
  it("places a row on the release whose entry quotes its title", () => {
    const plan = planBackfill([row("every-name-is-a-link", "Every name the site prints leads to that player")], CHANGELOG);
    const mapping = mappingFor(plan, "every-name-is-a-link");
    expect(mapping.releasedIn).toBe("0.7.0");
    expect(mapping.confidence).toBe("certain");
    expect(mapping.evidence.rule).toBe("title-in-notes");
    expect(mapping.releasedAt).toBe("2026-03-07T10:00:00Z");
  });

  it("places a row on the release that used its rare words", () => {
    const plan = planBackfill([row("halma-the-first-race-game", "Halma, a game with no lines in it")], CHANGELOG);
    const mapping = mappingFor(plan, "halma-the-first-race-game");
    expect(mapping.releasedIn).toBe("0.10.0");
    expect(mapping.confidence).toBe("certain");
    expect(mapping.evidence.rule).toBe("distinctive-words");
  });

  it("takes a key quoted verbatim in a note over everything else", () => {
    const changelog = [
      release("0.20.0", "2026-03-20T09:00:00Z", ["Closed the-plain-game-is-called-gomoku, among other chores"]),
      ...CHANGELOG,
    ];
    const plan = planBackfill([row("the-plain-game-is-called-gomoku", "Call the plain game Gomoku, not Freestyle")], changelog);
    const mapping = mappingFor(plan, "the-plain-game-is-called-gomoku");
    expect(mapping.releasedIn).toBe("0.20.0");
    expect(mapping.evidence.rule).toBe("key-in-notes");
    expect(mapping.confidence).toBe("certain");
  });

  /*
   * THE ONE THAT MATTERS MOST. This row reduces to `name` and `link` once the
   * site's vocabulary is dropped, both of which appear in five of ten entries
   * here, and it scores a flawless 1.000 against a release about something
   * else — the exact shape that reached `certain` on the real board before the
   * word-count and rarity rules existed. A perfect ratio over two common words
   * is the "plausible value for I do not know" AGENTS.md warns about.
   */
  it("refuses a perfect score earned on two words every release uses", () => {
    const plan = planBackfill(
      [row("every-game-name-on-the-about-page-links-to-its-game", "Every game name on the About page links to its game")],
      CHANGELOG,
    );
    expect(plan.mapped.find((item) => item.confidence === "certain")).toBeUndefined();
  });

  it("accepts two matched words when one of them is a fingerprint", () => {
    const plan = planBackfill([row("champions-page-per-game-ladders", "A champions page with a ladder for every game")], CHANGELOG);
    const mapping = mappingFor(plan, "champions-page-per-game-ladders");
    expect(mapping.releasedIn).toBe("0.9.0");
    expect(mapping.confidence).toBe("certain");
  });

  it("will not choose between two releases that fit the words as well as each other", () => {
    const changelog = [
      release("0.12.0", "2026-03-12T10:00:00Z", ["A rhombus of hexagons, six neighbours to a cell"]),
      release("0.11.0", "2026-03-11T10:00:00Z", ["A rhombus of hexagons, six neighbours to a cell"]),
    ];
    const plan = planBackfill([row("hex-on-a-hexagonal-board", "A rhombus of hexagons, six neighbours")], changelog);
    expect(plan.mapped).toHaveLength(0);
    expect(plan.unmapped[0]?.reason).toBe("more-than-one-release-fits");
  });

  /*
   * The timeline's whole contribution, and it is a refusal. On the real board
   * `Away days that hold a deadline open` tied 0.45.0 against 0.67.0 on
   * wording and was refused as ambiguous — when 0.67.0 went out nine hours
   * AFTER the row was closed and was never a candidate at all.
   */
  it("does not consider a release that went out after the row was closed", () => {
    const changelog = [
      release("0.30.0", "2026-03-25T10:00:00Z", ["Away days: mark a range on your profile, and deadlines in your games wait for it"]),
      ...CHANGELOG,
    ];
    const plan = planBackfill(
      [row("away-days-hold-deadlines", "Away days that hold a deadline open", "2026-03-20T10:00:00Z")],
      changelog,
    );
    const mapping = mappingFor(plan, "away-days-hold-deadlines");
    expect(mapping.releasedIn).toBe("0.3.0");
  });

  it("says so when every release it can date is later than the closing", () => {
    const plan = planBackfill([row("halma-the-first-race-game", "Halma, a game with no lines", "2026-01-01T00:00:00Z")], CHANGELOG);
    expect(plan.mapped).toHaveLength(0);
    expect(plan.unmapped[0]?.reason).toBe("no-release-before-the-closing");
  });

  it("refuses a row nothing is written about rather than reaching for the closest", () => {
    const plan = planBackfill([row("distraction-free-viewing-mode", "A distraction-free mode remembered between visits")], CHANGELOG);
    expect(plan.mapped).toHaveLength(0);
    expect(plan.unmapped[0]?.reason).toBe("no-release-names-it");
    expect(plan.unmapped[0]?.best?.version).toBeDefined();
  });

  it("keeps the version but not the certainty when only a changelog heading dates a release", () => {
    const changelog = [
      { ...release("0.10.0", "2026-03-10T10:00:00Z", CHANGELOG[0]!.notes as string[]), instantFrom: "changelog-heading" as const },
    ];
    const plan = planBackfill([row("halma-the-first-race-game", "Halma, a game with no lines in it")], changelog);
    const mapping = mappingFor(plan, "halma-the-first-race-game");
    expect(mapping.releasedIn).toBe("0.10.0");
    expect(mapping.confidence).toBe("likely");
    expect(mapping.heldBackBy).toMatch(/never bumped|WRITTEN/);
  });

  it("reads a row's key out of a commit message when no release entry is about it", () => {
    const plan = planBackfill(
      [row("a-quiet-chore-nobody-wrote-up", "A quiet chore nobody wrote up in the changelog")],
      CHANGELOG,
      { commits: [{ sha: "abc1234", at: "2026-03-05T09:00:00Z", message: "Fix a-quiet-chore-nobody-wrote-up at last" }] },
    );
    const mapping = mappingFor(plan, "a-quiet-chore-nobody-wrote-up");
    expect(mapping.evidence.rule).toBe("commit-names-key");
    expect(mapping.releasedIn).toBe("0.5.0");
    expect(mapping.confidence).toBe("certain");
  });

  it("leaves a row a browser test made alone, and says which it was", () => {
    const plan = planBackfill([row("a-test-request-that-walks-the-board-mtsqgd01", "A test request that walks the board mtsqgd01")], CHANGELOG);
    expect(plan.mapped).toHaveLength(0);
    expect(plan.unmapped[0]?.reason).toBe("test-litter");
    expect(plan.unmapped[0]?.note).toContain("cleanup-litter");
  });

  it("returns a row that is not an unstamped done row rather than dropping it", () => {
    const open = { ...row("still-open", "A row that is still open"), status: "open" };
    const stamped = { ...row("already-stamped", "A row already carrying its release"), releasedIn: "0.9.0" };
    const plan = planBackfill([open, stamped], CHANGELOG);
    expect(plan.mapped).toHaveLength(0);
    expect(plan.unmapped.map((item) => item.reason)).toEqual([
      "not-an-unstamped-done-row",
      "not-an-unstamped-done-row",
    ]);
  });

  it("changes neither the rows nor the releases it was given", () => {
    const rows = [row("halma-the-first-race-game", "Halma, a game with no lines in it")];
    const before = JSON.stringify({ rows, changelog: CHANGELOG });
    planBackfill(rows, CHANGELOG);
    expect(JSON.stringify({ rows, changelog: CHANGELOG })).toBe(before);
  });

  it("records enough evidence for a person to check the answer without re-running it", () => {
    const plan = planBackfill([row("halma-the-first-race-game", "Halma, a game with no lines in it")], CHANGELOG);
    const { evidence } = mappingFor(plan, "halma-the-first-race-game");
    expect(evidence.quote).toContain("Halma");
    expect(evidence.matchedWords).toBeGreaterThan(0);
    expect(evidence.rowWords).toBeGreaterThanOrEqual(evidence.matchedWords);
    expect(evidence.commit).toBe("c0100");
    expect(evidence.instantFrom).toBe("version-bump");
    expect(evidence.closedAt).toBe("2026-03-20T10:00:00Z");
  });
});

describe("looksLikeTestLitter", () => {
  it("knows the four titles the browser suite makes", () => {
    expect(looksLikeTestLitter("A test request that walks the board mtsqgd01")).toBe(true);
    expect(looksLikeTestLitter("Keyboard shortcut for the scrubber abc123")).toBe(true);
    expect(looksLikeTestLitter("A request the API will not finish zz9")).toBe(true);
    expect(looksLikeTestLitter("A request somebody has picked up q1w2")).toBe(true);
  });

  it("does not mistake a real request a person wrote for one", () => {
    expect(looksLikeTestLitter("Keyboard navigation on the move scrubber")).toBe(false);
    expect(looksLikeTestLitter("A test request that walks the board")).toBe(false);
  });
});

describe("tallyPlan", () => {
  it("counts every row exactly once, at its confidence or its reason", () => {
    const plan = planBackfill(
      [
        row("halma-the-first-race-game", "Halma, a game with no lines in it"),
        row("distraction-free-viewing-mode", "A distraction-free mode remembered between visits"),
        row("a-test-request-that-walks-the-board-mtsqgd01", "A test request that walks the board mtsqgd01"),
      ],
      CHANGELOG,
    );
    const tally = tallyPlan(plan);
    expect(tally.certain + tally.likely + tally.possible + tally.unmapped).toBe(3);
    expect(tally.certain).toBe(1);
    expect(tally.reasons["test-litter"]).toBe(1);
    expect(tally.reasons["no-release-names-it"]).toBe(1);
  });
});
