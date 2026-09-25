import { describe, expect, it } from "vitest";

import { gamesGoing } from "./gamesGoing";
import { MY_GAME_GROUPS } from "./myGames.constants";
import type { MyGame, MyGames } from "./myGames.types";

const some = (n: number) => Array.from({ length: n }, () => ({}) as MyGame);

describe("gamesGoing", () => {
  it("counts every group but the finished one", () => {
    const groups = Object.fromEntries(MY_GAME_GROUPS.map((group) => [group, some(0)])) as unknown as MyGames;
    groups.yourMove = some(2);
    groups.theirMove = some(8);
    groups.offered = some(1);
    groups.finished = some(40);
    expect(gamesGoing(groups)).toBe(11);
  });

  it("is nought for a queue with nothing going, however much is finished", () => {
    const groups = Object.fromEntries(MY_GAME_GROUPS.map((group) => [group, some(0)])) as unknown as MyGames;
    groups.finished = some(3);
    expect(gamesGoing(groups)).toBe(0);
  });
});
