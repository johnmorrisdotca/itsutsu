import { describe, expect, it } from "vitest";

import { findLegacyPlayer, findLinkedLegacy, LEGACY_PLAYERS } from "./legacyPlayers.data";

describe("legacy records", () => {
  it("finds a record by its slug, folding case and whitespace", () => {
    expect(findLegacyPlayer("Chibi")?.name).toBe("Chibi");
    expect(findLegacyPlayer("  chibi  ")?.name).toBe("Chibi");
    expect(findLegacyPlayer("nobody")).toBeNull();
  });

  it("distinguishes remembered from elsewhere", () => {
    expect(findLegacyPlayer("chibi")?.kind).toBe("remembered");
    expect(findLegacyPlayer("incognito")?.kind).toBe("elsewhere");
  });

  it("an elsewhere record only links once a live key is set", () => {
    expect(findLinkedLegacy("incognito")).toBeNull();
  });

  it("every detail row sums to the summary it belongs under, when the detail claims to be complete", () => {
    for (const player of LEGACY_PLAYERS.filter((p) => p.detailComplete)) {
      const detailTotal = player.detail.reduce((sum, row) => sum + row.won + row.lost + row.drawn, 0);
      const summaryTotal = player.summary.reduce(
        (sum, row) => sum + row.record.won + row.record.lost + row.record.drawn,
        0,
      );
      expect(detailTotal).toBe(summaryTotal);
    }
  });
});
