import { describe, expect, it } from "vitest";

import { CARD_GAME_LIST, CARD_GAME_TABLES } from "./games/cardGames.constants.ts";
import { newGame, playComputers, rulesFor } from "./play.ts";

describe("starting and playing any game by name", () => {
  it.each(CARD_GAME_LIST)("%s starts at its usual table and deals the same cards from the same seed", (kind) => {
    const players = Array.from({ length: CARD_GAME_TABLES[kind].defaultPlayers }, (_, seat) => `P${seat}`);
    const rules = rulesFor(kind);
    const a = newGame(kind, { players, seed: 11 });
    const b = newGame(kind, { players, seed: 11 });
    expect(a).not.toBeNull();
    expect(rules.encode(a!)).toBe(rules.encode(b!));
  });

  it("refuses a table the game is not offered for", () => {
    expect(newGame("hearts", { players: ["Only", "Two"] })).toBeNull();
    expect(newGame("spades", { players: ["A", "B", "C", "D"], size: 7 })).toBeNull();
  });

  it.each(CARD_GAME_LIST)("%s: computers in every seat play the whole game through", (kind) => {
    const players = Array.from({ length: CARD_GAME_TABLES[kind].defaultPlayers }, (_, seat) => `P${seat}`);
    const start = newGame(kind, { players, seed: 3, computers: players.map(() => true) })!;
    const { game, moves } = playComputers(kind, start);
    const rules = rulesFor(kind);
    expect(rules.over(game)).toBe(true);
    expect(moves.length).toBeGreaterThan(0);
    expect(rules.winners(game).length).toBeGreaterThan(0);
  });

  it("stops at the first person to move", () => {
    const start = newGame("crazyEights", { players: ["You", "Ann", "Ben"], seed: 5, computers: [false, true, true] })!;
    const rules = rulesFor("crazyEights");
    const { game } = playComputers("crazyEights", start);
    const seat = rules.toPlay(game);
    expect(seat === null || rules.seats(game).computers[seat] === false).toBe(true);
  });
});
