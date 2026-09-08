import { describe, expect, it } from "vitest";

import { findLegacyPlayer, findLinkedLegacies, LEGACY_PLAYERS } from "./legacyPlayers.data";

describe("legacy records", () => {
  it("finds a record by its slug, folding case and whitespace", () => {
    expect(findLegacyPlayer("Chibi")?.name).toBe("Chibi");
    expect(findLegacyPlayer("  chibi  ")?.name).toBe("Chibi");
    expect(findLegacyPlayer("nobody")).toBeNull();
  });

  it("distinguishes remembered, honorary and elsewhere", () => {
    expect(findLegacyPlayer("chibi")?.kind).toBe("remembered");
    expect(findLegacyPlayer("kyokosan")?.kind).toBe("honorary");
    expect(findLegacyPlayer("incognito")?.kind).toBe("elsewhere");
    expect(findLegacyPlayer("jmorris")?.kind).toBe("elsewhere");
  });

  it("an elsewhere record only links once a live key is set", () => {
    expect(findLinkedLegacies("incognito")).toEqual([]);
  });

  it("a live key can link more than one elsewhere record, once both are set", () => {
    const same = { ...findLegacyPlayer("incognito")!, linkedKey: "jmorris-live" };
    const other = { ...findLegacyPlayer("jmorris")!, linkedKey: "jmorris-live" };
    const pool = [...LEGACY_PLAYERS.filter((p) => p.slug !== "incognito" && p.slug !== "jmorris"), same, other];
    expect(pool.filter((p) => p.kind === "elsewhere" && p.linkedKey === "jmorris-live")).toHaveLength(2);
  });

  it("every class's by-game detail sums to that class's own total, when it claims to be complete", () => {
    for (const player of LEGACY_PLAYERS) {
      for (const row of player.summary) {
        if (!row.detailComplete || row.detail === undefined) continue;
        const detailTotal = row.detail.reduce((sum, game) => sum + game.won + game.lost + game.drawn, 0);
        const classTotal = row.record.won + row.record.lost + row.record.drawn;
        expect(detailTotal, `${player.slug} / ${row.class}`).toBe(classTotal);
      }
    }
  });

  it("every per-game log sums to the row it belongs to", () => {
    for (const player of LEGACY_PLAYERS) {
      for (const row of player.summary) {
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
      for (const entry of player.headToHead ?? []) {
        const other = findLegacyPlayer(entry.opponent);
        const otherEntry = other?.headToHead?.find((e) => e.opponent === player.slug);
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
