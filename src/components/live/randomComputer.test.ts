import { describe, expect, it } from "vitest";

import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { variantFor } from "@/lib/gomoku/slugs";

import { ANYONE, RANDOM_COMPUTER, againstFromAddress, opponentGroups } from "./opponentOptions";
import { RANDOM_COMPUTER_WORDS } from "./picker.constants";
import { readSetUpAsked } from "./setUpAsked";
import { keptParams, silentFor } from "./setUpKept";
import { drawnCreation } from "./setUpStart";
import type { KeptBase } from "./setUp.types";

/**
 * A COMPUTER PLAYER DRAWN AT RANDOM.
 *
 * John: "or a Bot, a random Bot or whatever other options the site has." Three
 * promises, each tested here: it is a choice offered beside the programs it is
 * drawn from, never a default; it survives the address as "random" rather than
 * as whichever program a first draw happened to pick; and it is drawn once, as
 * the game is created, from the programs that play that game.
 */

const halma = variantFor("halma") as RuleVariant;
const base: KeptBase = {
  asPlayed: null,
  forked: false,
  defaults: { size: 15, moveTimeMs: null },
  pathVariant: null,
  silentOpponent: null,
};

describe("a computer player drawn at random", () => {
  it("is offered last among the programs, after every one it is drawn from", () => {
    const programs = opponentGroups({ variant: halma, opponents: [], named: null }).find(
      (group) => group.kind === "computer",
    );
    expect(programs?.tiles.at(-1)).toEqual({
      value: RANDOM_COMPUTER,
      name: RANDOM_COMPUTER_WORDS.name,
      computer: true,
      tier: null,
    });
    expect(programs?.tiles.slice(0, -1).map((tile) => tile.value)).toEqual(botsFor(halma).map((bot) => `c:${bot.id}`));
  });

  it("stays random through the address, rather than pinning a program", () => {
    const params = keptParams(base, {
      rules: silentFor(base, halma),
      boardChosen: null,
      against: RANDOM_COMPUTER,
      chooseGame: true,
    });
    expect(params).toContainEqual(["against", RANDOM_COMPUTER]);
    const asked = readSetUpAsked(Object.fromEntries(params));
    expect(
      againstFromAddress(asked.against, { computers: botsFor(halma), opponents: [], named: null, absent: ANYONE }),
    ).toBe(RANDOM_COMPUTER);
  });

  it("is drawn once, from the pool, as the game is created, and leaves the body it was given alone", () => {
    const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const body = { variant: halma, open: true };
    expect(drawnCreation(body, pool, 0)).toEqual({ variant: halma, open: false, challengeId: "a" });
    expect(drawnCreation(body, pool, 0.5).challengeId).toBe("b");
    expect(drawnCreation(body, pool, 0.9999999).challengeId).toBe("c");
    // A roll at the very top of the range lands on the last program, not past it.
    expect(drawnCreation(body, pool, 1).challengeId).toBe("c");
    expect(body.open).toBe(true);
  });

  it("does not guess a program when there is nobody to draw from", () => {
    expect(drawnCreation({ open: true }, [], 0.3)).toEqual({ open: true });
  });
});
