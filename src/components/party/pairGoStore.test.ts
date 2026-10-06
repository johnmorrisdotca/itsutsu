import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadSnapshot } from "@/components/game/gameStorage";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { decodePairGo, pairPass, pairPlay, pairPlayerToMove, startPairGo } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";

import { PAIR_GO_STORAGE_KEY } from "./pairGo.constants";
import { keepPairGo } from "./pairGoStore";
import { speaker } from "@/lib/i18n/i18n";

/** The English speaker: these tests read the rules' English words. */
const EN = speaker("en");

/** The practice board's own key (`gameStorage.ts`), which Pair Go must never write. */
const BOARD_FOR_TWO = "gomoku.session.v1";

/** A browser's storage, as much of one as the keeping asks for. */
function fakeStorage() {
  const held = new Map<string, string>();
  return {
    getItem: (key: string) => held.get(key) ?? null,
    setItem: (key: string, value: string) => void held.set(key, value),
    removeItem: (key: string) => void held.delete(key),
    held,
  };
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("window", { localStorage: storage, addEventListener: () => {}, removeEventListener: () => {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Pair Go kept in this browser", () => {
  it("is written under a key of its own, and a board for two kept beside it still opens", () => {
    // A game on the practice board, kept the way it always has been.
    const board = { version: 1, settings: { variant: "go", size: 9 }, opener: "black", moves: [{ row: 2, col: 2, stone: "black", kind: "place" }] };
    storage.setItem(BOARD_FOR_TWO, JSON.stringify(board));

    let game = startPairGo(9, { black: ["Aiko", "Ben"], white: ["Chloe", "Dev"] });
    game = pairPlay(game, { row: 4, col: 4 }) as PairGoGame;
    game = pairPass(game) as PairGoGame;
    keepPairGo(game);

    expect(storage.held.get(BOARD_FOR_TWO)).toBe(JSON.stringify(board));
    expect(loadSnapshot()?.moves).toHaveLength(1);

    const back = decodePairGo(storage.getItem(PAIR_GO_STORAGE_KEY)) as PairGoGame;
    expect(back.state.moves).toHaveLength(2);
    expect(pairPlayerToMove(back, EN)).toMatchObject({ name: "Ben", stone: STONES.black });
  });

  it("forgets only its own game when a new one is asked for", () => {
    storage.setItem(BOARD_FOR_TWO, "{}");
    keepPairGo(startPairGo(9, { black: ["", ""], white: ["", ""] }));
    keepPairGo(null);
    expect(storage.getItem(PAIR_GO_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(BOARD_FOR_TWO)).toBe("{}");
  });
});
