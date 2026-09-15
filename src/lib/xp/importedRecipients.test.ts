import { describe, expect, it } from "vitest";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";

import { importedSitesFor, recipientsOf, totalsDisagreements, type ImportedCandidate } from "./importedRecipients";

const kept = (id: string, name: string): ImportedCandidate => ({ id, name, botTier: null, unclaimableBecause: UNCLAIMABLE_REASONS.keptRecord });
const live = (id: string, name: string): ImportedCandidate => ({ id, name, botTier: null, unclaimableBecause: null });

describe("which member a kept record pays", () => {
  it("pays Chibi and Kyokosan on their kept-record rows, and John on his live account", () => {
    const { recipients, refused } = recipientsOf([
      kept("chjb", "Chibi"),
      kept("kyqk", "Kyokosan"),
      live("john", "John Morris"),
      live("other", "Somebody Else"),
    ]);
    expect(refused).toEqual([]);
    expect(recipients.map((one) => [one.memberId, one.legacies.map((legacy) => legacy.slug)])).toEqual([
      ["chjb", ["chibi"]],
      ["kyqk", ["kyokosan"]],
      ["john", ["jmorris"]],
    ]);
  });

  it("pays nobody when two rows answer to one name, and says so", () => {
    const { recipients, refused } = recipientsOf([live("john-1", "John Morris"), live("john-2", "John Morris")]);
    expect(recipients).toEqual([]);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatchObject({ legacy: "jmorris", memberIds: ["john-1", "john-2"] });
  });

  it("refuses a record on the wrong kind of row, and never asks about a program", () => {
    const { recipients, refused } = recipientsOf([
      live("a-person-called-chibi", "Chibi"),
      kept("a-kept-john", "John Morris"),
      { id: "bot", name: "Kyokosan", botTier: "dan", unclaimableBecause: UNCLAIMABLE_REASONS.computer },
    ]);
    expect(recipients).toEqual([]);
    expect(refused.map((one) => one.legacy).sort()).toEqual(["chibi", "jmorris"]);
  });
});

describe("where a credit's play was, for a promotion it paid", () => {
  it("names the sites a kept record under the name was played on, as a sentence names them", () => {
    const sites = importedSitesFor("Chibi");
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) expect(site).not.toMatch(/\.com$/i);
  });

  it("names none for a name no kept record answers to, rather than inventing one", () => {
    expect(importedSitesFor("Somebody Nobody Kept")).toEqual([]);
  });
});

describe("the three-way check", () => {
  const row = { id: "m", name: "M", xp: 100, xpImported: 50, xpEverywhere: 150 };

  it("is silent when the totals agree with the ledger and each other", () => {
    expect(totalsDisagreements([row], new Map([["m", 100]]), new Map([["m", 50]]))).toEqual([]);
  });

  it("names each total that disagrees, and reads a member with no rows as nought", () => {
    expect(totalsDisagreements([{ ...row, xpEverywhere: 100 }], new Map([["m", 100]]), new Map([["m", 50]]))).toEqual([
      "M: xpEverywhere 100, xp + xpImported 150",
    ]);
    expect(totalsDisagreements([row], new Map(), new Map())).toEqual([
      "M: xp 100, Itsutsu ledger 0",
      "M: xpImported 50, imported ledger 0",
    ]);
  });
});
