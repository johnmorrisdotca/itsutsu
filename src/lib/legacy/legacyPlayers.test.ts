import { describe, expect, it } from "vitest";

import { findLegacyPlayer, findLinkedLegacy, LEGACY_PLAYERS } from "./legacyPlayers.data";

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
  });

  it("an elsewhere record only links once a live key is set", () => {
    expect(findLinkedLegacy("incognito")).toBeNull();
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
});
