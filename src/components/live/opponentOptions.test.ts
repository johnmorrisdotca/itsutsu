import { describe, expect, it } from "vitest";

import { botsFor, gamesPlayedBy } from "@/lib/bots/bots.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { Opponent } from "@/lib/social/opponents";

import { ANYONE, idIn, opponentGroups, shownChoice, valueFor } from "./opponentOptions";
import { OPPONENT_GROUPS } from "./picker.constants";

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

  it("offers at every game exactly the programs that play it, with their grades", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const programs = opponentGroups({ variant, opponents: [], named: null }).find(
        (group) => group.kind === OPPONENT_GROUPS.computer,
      );
      const expected = botsFor(variant as RuleVariant);
      expect(programs?.tiles.map((tile) => tile.value), variant).toEqual(expected.map((bot) => `c:${bot.id}`));
      for (const tile of programs?.tiles ?? []) {
        expect(tile.computer).toBe(true);
        expect(tile.tier, `${variant} ${tile.value}`).not.toBeNull();
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
