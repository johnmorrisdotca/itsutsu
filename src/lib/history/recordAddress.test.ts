import { describe, expect, it } from "vitest";

import { recordAddress } from "./recordAddress";

describe("recordAddress", () => {
  it("carries a reader's own filters into both the query and the page's own address", () => {
    const { query, flat } = recordAddress({ size: "9", sort: "moves", page: "2" });
    expect(query).toEqual({ size: "9", sort: "moves", page: "2" });
    expect(flat).toEqual({ size: "9", sort: "moves", page: "2" });
  });

  it("keeps an explicit ?player= exactly as given — nobody is implying it", () => {
    const { query, flat } = recordAddress({ player: "Someone Else" });
    expect(query.player).toBe("Someone Else");
    expect(flat.player).toBe("Someone Else");
  });

  /*
   * This is the finding, made concrete: /games/<slug>/me applies a player
   * filter for the query only. Paging through the record must never put the
   * member's whole name where a reader could bookmark, share or log it — the
   * bug was `RecordPage.tsx` building `flat` from the very params that
   * carried the injected filter, so page 2's address carried it too.
   */
  it("puts an implied player into the query and never into the page's own address", () => {
    const { query, flat } = recordAddress(
      { size: "9", page: "2" },
      { impliedPlayer: { name: "Hanako Morris", memberId: "abc123" } },
    );
    expect(query.player).toBe("Hanako Morris");
    expect(flat.player).toBeUndefined();
    // And nothing else about the implied filter leaked in under another key.
    expect(flat).toEqual({ size: "9", page: "2" });
    expect(Object.values(flat)).not.toContain("Hanako Morris");
  });

  it("still folds an implied player in when the reader's own params are empty", () => {
    const { query, flat } = recordAddress({}, { impliedPlayer: { name: "Hanako Morris", memberId: null } });
    expect(query).toEqual({ player: "Hanako Morris" });
    expect(flat).toEqual({});
  });

  it("folds the variant into the query from the path, never from a stray param", () => {
    const { query, flat } = recordAddress(
      { variant: "ignored-because-the-path-decides" },
      { variant: "freestyle" },
    );
    expect(query.variant).toBe("freestyle");
    expect(flat.variant).toBeUndefined();
  });

  it("drops array-valued and undefined params rather than guessing at them", () => {
    const { query, flat } = recordAddress({ search: ["a", "b"], page: undefined, size: "9" });
    expect(query).toEqual({ size: "9" });
    expect(flat).toEqual({ size: "9" });
  });
});
