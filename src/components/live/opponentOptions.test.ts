import { describe, expect, it } from "vitest";

import { botsFor, gamesPlayedBy } from "@/lib/bots/bots.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { Opponent } from "@/lib/social/opponents";

import { ANYONE, RANDOM_COMPUTER, capTiles, idIn, opponentGroups, shownChoice, valueFor } from "./opponentOptions";
import { OPPONENT_GROUPS, PEOPLE_CAP } from "./picker.constants";

/**
 * Who the set-up screen offers a game to, and under which heading.
 *
 * These were optgroups in a select and are runs of tiles now. The rules did not
 * change, so what is tested is that they did not: the same people, the same
 * order, a named opponent never twice, a program only at a game it plays, and a
 * choice nothing holds still showing an answer.
 */

const here: Opponent = { id: "h1", email: "here@example.test", name: "Here One", here: true };
const known: Opponent = { id: "k1", email: "known@example.test", name: "Known One", here: false };

function kinds(groups: ReturnType<typeof opponentGroups>) {
  return groups.map((group) => group.kind);
}

describe("opponentGroups", () => {
  it("draws the runs in the select's order and leaves out the empty ones", () => {
    expect(kinds(opponentGroups({ variant: "freestyle", opponents: [here, known], named: null }))).toEqual([
      OPPONENT_GROUPS.here,
      OPPONENT_GROUPS.known,
      OPPONENT_GROUPS.computer,
    ]);
    // Signed out, or a member who knows nobody: the programs, and only them.
    expect(kinds(opponentGroups({ variant: "freestyle", opponents: [], named: null }))).toEqual([
      OPPONENT_GROUPS.computer,
    ]);
  });

  it("puts each person under the heading that is true of them", () => {
    const groups = opponentGroups({ variant: "freestyle", opponents: [known, here], named: null });
    expect(groups.find((group) => group.kind === OPPONENT_GROUPS.here)?.tiles.map((tile) => tile.value)).toEqual([
      "m:h1",
    ]);
    expect(groups.find((group) => group.kind === OPPONENT_GROUPS.known)?.tiles.map((tile) => tile.value)).toEqual([
      "m:k1",
    ]);
  });

  it("offers at every game exactly the programs that play it, with their grades, and a random one after them", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const programs = opponentGroups({ variant, opponents: [], named: null }).find(
        (group) => group.kind === OPPONENT_GROUPS.computer,
      );
      const expected = botsFor(variant as RuleVariant);
      // A draw needs more than one to draw from; a draw of one is that program under a vaguer name.
      const random = expected.length > 1 ? [RANDOM_COMPUTER] : [];
      expect(programs?.tiles.map((tile) => tile.value), variant).toEqual([
        ...expected.map((bot) => `c:${bot.id}`),
        ...random,
      ]);
      for (const tile of programs?.tiles ?? []) {
        expect(tile.computer).toBe(true);
        // Every program has its grade; the random tile has none, since nobody has been drawn.
        if (tile.value === RANDOM_COMPUTER) expect(tile.tier).toBeNull();
        else expect(tile.tier, `${variant} ${tile.value}`).not.toBeNull();
      }
    }
  });

  it("adds somebody the address named who is on no list, under Asked for", () => {
    const stranger = { id: "s1", name: "Stranger", computer: false };
    const groups = opponentGroups({ variant: "freestyle", opponents: [here], named: stranger });
    expect(groups[0]?.kind).toBe(OPPONENT_GROUPS.asked);
    expect(groups[0]?.tiles).toEqual([{ value: "m:s1", name: "Stranger", computer: false, tier: null }]);
  });

  it("never offers the same person twice", () => {
    const buddy = { id: known.id, name: known.name, computer: false };
    const groups = opponentGroups({ variant: "freestyle", opponents: [known], named: buddy });
    const values = groups.flatMap((group) => group.tiles.map((tile) => tile.value));
    expect(values.filter((value) => value === "m:k1")).toHaveLength(1);
    expect(kinds(groups)).not.toContain(OPPONENT_GROUPS.asked);
  });

  it("does not repeat a program under Asked for at a game it plays", () => {
    const [bot] = botsFor("freestyle");
    const groups = opponentGroups({
      variant: "freestyle",
      opponents: [],
      named: { id: bot.id, name: bot.name, computer: true },
    });
    expect(kinds(groups)).toEqual([OPPONENT_GROUPS.computer]);
  });

  it("keeps a named specialist under Asked for at a game it does not play, as the select did", () => {
    /*
     * The screen says the offer has lapsed and Start posts for anyone — both
     * decided in SetUpGame. This list only has to keep showing who was asked.
     */
    const specialist = ["tamenoki", "meritalu"].find(
      (id) => gamesPlayedBy(id).length > 0 && !gamesPlayedBy(id).includes("halma"),
    );
    expect(specialist, "a specialist that does not play Halma").toBeDefined();
    const groups = opponentGroups({
      variant: "halma",
      opponents: [],
      named: { id: specialist as string, name: "Specialist", computer: true },
    });
    expect(groups[0]).toEqual({
      kind: OPPONENT_GROUPS.asked,
      tiles: [{ value: `c:${specialist}`, name: "Specialist", computer: true, tier: null }],
    });
  });
});

describe("capTiles", () => {
  const people = (count: number) =>
    Array.from({ length: count }, (_, at) => ({ value: `m:p${at}`, name: `P${at}`, computer: false, tier: null }));
  const values = (run: ReturnType<typeof capTiles>) => run.visible.map((tile) => tile.value);

  it("draws a short run whole, with no press to fold it", () => {
    const run = capTiles(people(4), [ANYONE], false);
    expect(values(run)).toEqual(["m:p0", "m:p1", "m:p2", "m:p3"]);
    expect(run).toMatchObject({ total: 4, capped: false });
  });

  it("draws a run of exactly the cap whole, since there is nothing to fold", () => {
    const run = capTiles(people(PEOPLE_CAP), [ANYONE], false);
    expect(run.visible).toHaveLength(PEOPLE_CAP);
    expect(run).toMatchObject({ total: PEOPLE_CAP, capped: false });
  });

  it("folds a longer run to the first nine, in the list's order, and says how many there are", () => {
    const run = capTiles(people(12), [ANYONE], false);
    expect(values(run)).toEqual(people(9).map((tile) => tile.value));
    expect(run).toMatchObject({ total: 12, capped: true });
  });

  it("draws every tile once the run is opened, and still offers the way back", () => {
    const run = capTiles(people(12), [ANYONE], true);
    expect(run.visible).toHaveLength(12);
    expect(run).toMatchObject({ total: 12, capped: true });
  });

  it("keeps a chosen person past the cap on screen, in the last place, and still shows nine", () => {
    const run = capTiles(people(12), ["m:p10"], false);
    expect(values(run)).toEqual([...people(8).map((tile) => tile.value), "m:p10"]);
    expect(run).toMatchObject({ total: 12, capped: true });
  });

  it("leaves the first nine alone when the chosen person is already among them", () => {
    expect(values(capTiles(people(12), ["m:p3"], false))).toEqual(people(9).map((tile) => tile.value));
  });

  it("keeps the one chosen when the run was folded after a step to another, so the step can be taken back", () => {
    // Pre-filled with the eleventh, then an arrow up to the eighth: both stay, nine in all.
    const run = capTiles(people(12), ["m:p10", "m:p7"], false);
    expect(values(run)).toEqual([...people(8).map((tile) => tile.value), "m:p10"]);
  });

  it("never lets one kept tile push another off the screen", () => {
    expect(values(capTiles(people(12), ["m:p8", "m:p10"], false))).toEqual([
      ...people(7).map((tile) => tile.value),
      "m:p8",
      "m:p10",
    ]);
    expect(values(capTiles(people(12), ["m:p10", "m:p11"], false))).toEqual([
      ...people(7).map((tile) => tile.value),
      "m:p10",
      "m:p11",
    ]);
  });
});

describe("shownChoice", () => {
  const groups = opponentGroups({ variant: "freestyle", opponents: [here], named: null });

  it("shows the value that was chosen when a tile holds it", () => {
    expect(shownChoice("m:h1", groups)).toBe("m:h1");
    expect(shownChoice(ANYONE, groups)).toBe(ANYONE);
  });

  it("shows the posted seat for a value no tile holds, as the select showed its first option", () => {
    expect(shownChoice("m:gone", groups)).toBe(ANYONE);
  });
});

describe("the value a choice holds", () => {
  it("round-trips a person and a program", () => {
    expect(valueFor({ id: "p", name: "P", computer: false })).toBe("m:p");
    expect(valueFor({ id: "kyu", name: "Kyu", computer: true })).toBe("c:kyu");
    expect(idIn("m:p")).toBe("p");
    expect(idIn("c:kyu")).toBe("kyu");
  });

  it("names nobody for a posted seat", () => {
    expect(idIn(ANYONE)).toBeNull();
  });
});
