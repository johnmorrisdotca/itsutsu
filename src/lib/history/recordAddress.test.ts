import { describe, expect, it } from "vitest";

import { recordAddress, recordGameRedirect } from "./recordAddress";

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

  /*
   * ON /history THE QUERY'S OWN `?variant=` REACHES THE QUERY, and it used not
   * to: this function dropped the key whatever the address was, so /history
   * threw the filter away in silence while `/api/games?variant=` honoured it.
   *
   * The page redirects a variant that names a game before this runs, so what
   * arrives here is a value no game answers to — and a value that reaches the
   * schema is refused in words on the page, which is the point. Dropped, it
   * said nothing at all.
   */
  it("lets a ?variant= through where the address itself names no game", () => {
    const { query, flat } = recordAddress({ variant: "not-a-game-here", size: "9" });
    expect(query.variant).toBe("not-a-game-here");
    expect(flat.variant).toBe("not-a-game-here");
  });
});

describe("recordGameRedirect", () => {
  it("sends /history?variant=<slug> to that game's own record", () => {
    expect(recordGameRedirect({ variant: "misere-five" })).toBe("/games/misere-five/history");
  });

  /*
   * `GAME_VARIANT_FILTERS` is the list of variant KEYS, so /api/games accepts
   * either spelling and a redirect that only knew slugs would drop half of
   * them. The two differ for real: the key `freestyle` lives at /games/gomoku,
   * because a slug is chosen for how it reads in an address bar.
   */
  it("takes the variant KEY too, because the API's own filter does", () => {
    expect(recordGameRedirect({ variant: "freestyle" })).toBe("/games/gomoku/history");
    expect(recordGameRedirect({ variant: "misereFive" })).toBe("/games/misere-five/history");
  });

  it("carries the other filters across, so nothing a reader asked for is lost", () => {
    expect(recordGameRedirect({ variant: "misere-five", size: "9", outcome: "drawn" })).toBe(
      "/games/misere-five/history?size=9&outcome=drawn",
    );
  });

  it("leaves page and cursor behind — both are positions in the list it is leaving", () => {
    expect(
      recordGameRedirect({ variant: "misere-five", page: "4", cursor: "abc", size: "9" }),
    ).toBe("/games/misere-five/history?size=9");
  });

  it("redirects nowhere when no variant was asked for", () => {
    expect(recordGameRedirect({ size: "9" })).toBeNull();
    expect(recordGameRedirect({})).toBeNull();
  });

  /*
   * `all` is what this site calls the absence of a narrowing, and it names no
   * game — so there is nowhere to send it and the whole record is the answer.
   */
  it("redirects nowhere for all, or for a word no game answers to", () => {
    expect(recordGameRedirect({ variant: "all" })).toBeNull();
    expect(recordGameRedirect({ variant: "banana" })).toBeNull();
    expect(recordGameRedirect({ variant: ["freestyle", "renju"] })).toBeNull();
  });
});
