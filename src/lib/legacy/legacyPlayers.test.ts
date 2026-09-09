import { describe, expect, it } from "vitest";

import {
  findLegacyPlayer,
  findLinkedLegacies,
  foldedInto,
  LEGACY_PLAYERS,
} from "./legacyPlayers.data";

describe("legacy records", () => {
  it("finds a record by its slug, folding case and whitespace", () => {
    expect(findLegacyPlayer("Chibi")?.name).toBe("Chibi");
    expect(findLegacyPlayer("  chibi  ")?.name).toBe("Chibi");
    expect(findLegacyPlayer("nobody")).toBeNull();
  });

  it("distinguishes remembered, honorary and elsewhere", () => {
    expect(findLegacyPlayer("chibi")?.kind).toBe("remembered");
    expect(findLegacyPlayer("kyokosan")?.kind).toBe("honorary");
    expect(findLegacyPlayer("jmorris")?.kind).toBe("elsewhere");
  });

  /**
   * A kept record has its own address, but the first place anybody looks for
   * somebody's history is that person's own page. Until linkedKey was set on
   * John's record it existed and appeared nowhere he would look.
   */
  it("shows a kept record on the live account it belongs to", () => {
    const linked = findLinkedLegacies("john morris");
    expect(linked.map((player) => player.slug)).toEqual(["jmorris"]);
    expect(linked[0].sources.map((source) => source.site)).toEqual([
      "ItsYourTurn.com",
      "GoldToken.com",
    ]);
  });

  it("links nothing to a name nobody kept a record under", () => {
    expect(findLinkedLegacies("nobody at all")).toEqual([]);
  });

  it("gives every elsewhere record a live account to sit beside", () => {
    // An elsewhere record is by definition a live member's earlier chapter.
    // One without a linkedKey is a chapter nobody can find.
    for (const player of LEGACY_PLAYERS) {
      if (player.kind !== "elsewhere") continue;
      expect(player.linkedKey, `${player.slug} belongs beside nobody`).toBeTruthy();
    }
  });

  /**
   * One person is one row, whatever they were called and however many sites
   * they played on. Two rows pointing at each other would be two pages a
   * visitor could land on for the same man, which is what the shape exists
   * to stop — so nobody may appear twice under any of their names.
   */
  it("keeps one row per person, however many sites they played on", () => {
    const chibi = findLegacyPlayer("chibi");
    expect(chibi?.sources.map((source) => source.site)).toEqual([
      "ItsYourTurn.com",
      "GoldToken.com",
    ]);

    // John was Incognito on one site and John Morris on the other.
    const john = findLegacyPlayer("jmorris");
    expect(john?.sources.map((source) => source.site)).toEqual([
      "ItsYourTurn.com",
      "GoldToken.com",
    ]);
    expect(john?.sources[0].handle).toBe("Incognito");

    // The old per-site slugs are gone rather than kept as second pages.
    expect(findLegacyPlayer("chibi-goldtoken")).toBeNull();
    expect(findLegacyPlayer("incognito")).toBeNull();
  });

  it("gives every record at least one source, and never the same site twice", () => {
    for (const player of LEGACY_PLAYERS) {
      expect(player.sources.length, player.slug).toBeGreaterThan(0);
      const sites = player.sources.map((source) => source.site);
      expect(sites, player.slug).toHaveLength(new Set(sites).size);
    }
  });

  it("every class's by-game detail sums to that class's own total, when it claims to be complete", () => {
    for (const player of LEGACY_PLAYERS) {
      for (const row of player.sources.flatMap((source) => source.summary)) {
        if (!row.detailComplete || row.detail === undefined) continue;
        const detailTotal = row.detail.reduce((sum, game) => sum + game.won + game.lost + game.drawn, 0);
        const classTotal = row.record.won + row.record.lost + row.record.drawn;
        expect(detailTotal, `${player.slug} / ${row.class}`).toBe(classTotal);
      }
    }
  });

  it("every per-game log sums to the row it belongs to", () => {
    for (const player of LEGACY_PLAYERS) {
      for (const row of player.sources.flatMap((source) => source.summary)) {
        for (const game of row.detail ?? []) {
          if (game.log === undefined) continue;
          const won = game.log.filter((g) => g.result === "won").length;
          const lost = game.log.filter((g) => g.result === "lost").length;
          const drawn = game.log.filter((g) => g.result === "drawn").length;
          expect([won, lost, drawn], `${player.slug} / ${game.game}`).toEqual([game.won, game.lost, game.drawn]);
        }
      }
    }
  });

  /**
   * A head-to-head is recorded from both sides — jmorris's record against
   * Chibi, and Chibi's record against jmorris — and the two must be the same
   * fourteen games with every result exactly flipped, not just eyeballed
   * into agreement when they were typed in twice.
   */
  it("a head-to-head between two kept records is an exact mirror of the other side", () => {
    const flip = { won: "lost", lost: "won", drawn: "drawn" } as const;
    for (const player of LEGACY_PLAYERS) {
      for (const entry of player.sources.flatMap((source) => source.headToHead ?? [])) {
        const other = findLegacyPlayer(entry.opponent);
        const otherEntry = other?.sources
          .flatMap((source) => source.headToHead ?? [])
          .find((e) => e.opponent === player.slug);
        expect(otherEntry, `${player.slug} has no matching headToHead back from ${entry.opponent}`).toBeDefined();
        expect(otherEntry!.games, `${player.slug} vs ${entry.opponent}`).toHaveLength(entry.games.length);
        for (let i = 0; i < entry.games.length; i += 1) {
          expect(otherEntry!.games[i].date, `game ${i}`).toBe(entry.games[i].date);
          expect(otherEntry!.games[i].game, `game ${i}`).toBe(entry.games[i].game);
          expect(otherEntry!.games[i].result, `game ${i}`).toBe(flip[entry.games[i].result]);
        }
      }
    }
  });
});

/**
 * Folding takes away an address, never a record.
 *
 * The site owner found two pages with his own name at the top and asked for
 * one of them gone. The half that is safe to do — one person, one page — is
 * done. The half that is not is guarded here: these rows are hand-transcribed
 * from sites that no longer exist, so a fold that left one unreachable would
 * not be tidying up, it would be the only copy going out with the address.
 */
describe("a folded record", () => {
  it("sends its old address to the live account, not to a second page", () => {
    const john = findLegacyPlayer("jmorris");
    if (john === null) throw new Error("jmorris is missing");
    expect(john.folded).toBeDefined();
    expect(foldedInto(john)).toBe("/players/john-morris");
  });

  it("still shows every source it ever had, on the page it folded into", () => {
    // The whole point: the address goes, the 2001-2007 record does not.
    const [john] = findLinkedLegacies("john morris");
    expect(john.sources.map((source) => source.site)).toEqual([
      "ItsYourTurn.com",
      "GoldToken.com",
    ]);
    expect(john.sources.flatMap((source) => source.summary ?? []).length).toBeGreaterThan(0);
  });

  it("is never folded without somewhere to fold into", () => {
    for (const player of LEGACY_PLAYERS) {
      if (player.folded === undefined) continue;
      /*
       * A folded row with no linkedKey would have no address and no host
       * page, which takes the record off the site entirely. If somebody ever
       * wants that, it should be a deletion they can see in a diff, not a
       * missing field nobody notices.
       */
      expect(player.kind, player.slug).toBe("elsewhere");
      expect(player.linkedKey, player.slug).toBeDefined();
      expect(foldedInto(player), player.slug).not.toBeNull();
      expect(player.folded.note.length, player.slug).toBeGreaterThan(20);
    }
  });

  it("leaves a record that was never folded with its own address", () => {
    for (const slug of ["chibi", "kyokosan"]) {
      const player = findLegacyPlayer(slug);
      if (player === null) throw new Error(`${slug} is missing`);
      expect(player.folded, slug).toBeUndefined();
      expect(foldedInto(player), slug).toBeNull();
    }
  });
});
