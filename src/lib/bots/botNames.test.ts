import { describe, expect, it } from "vitest";

import { BOT_MEMBER_LIST } from "./bots.constants";
import { BOT_NAME_COUNTRIES, isBotName } from "./botNames";

describe("the programs as a name needs them", () => {
  it("lists exactly the computer players, each with its own country", () => {
    expect([...BOT_NAME_COUNTRIES.entries()].sort()).toEqual(BOT_MEMBER_LIST.map((bot) => [bot.id, bot.country]).sort());
  });

  it("knows a program by its id, and nobody else", () => {
    expect(isBotName("meijin")).toBe(true);
    expect(isBotName("somebody")).toBe(false);
    expect(isBotName(null)).toBe(false);
  });
});
