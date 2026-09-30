import { describe, expect, it } from "vitest";

import { TENKA_PHASES } from "./tenka.constants.ts";
import type { TenkaGame } from "./tenka.types.ts";
import { TENKA_TERRITORIES, TENKA_TERRITORY_COUNT } from "./tenkaMap.ts";
import { startTenka } from "./tenkaStart.ts";

import { NO_CHOICE, choiceNow, marksFor, tapTerritory } from "./tenkaTaps.ts";

/** What a tap on Tenka's map means in each part of a turn, and what it lights up. */

const at = (key: string) => TENKA_TERRITORIES.findIndex((territory) => territory.key === key);

function world(phase: TenkaGame["phase"], own: string[], armies: Record<string, number> = {}): TenkaGame {
  const base = startTenka(60, ["A", "B", "C"], 5)!;
  const owners = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);
  for (const key of own) owners[at(key)] = 0;
  const counts = new Array<number>(TENKA_TERRITORY_COUNT).fill(1);
  for (const [key, count] of Object.entries(armies)) counts[at(key)] = count;
  return { ...base, toPlay: 0, owners, armies: counts, phase, reserve: 4, hands: [[], [], []] };
}

describe("a tap on the map", () => {
  it("places one army on your own territory while placing, and nothing on somebody else's", () => {
    const game = world(TENKA_PHASES.reinforce, ["brazil"]);
    expect(tapTerritory(game, NO_CHOICE, at("brazil")).move).toEqual({ kind: "place", territory: at("brazil"), armies: 1 });
    expect(tapTerritory(game, NO_CHOICE, at("brazil")).choice.placedOn).toBe(at("brazil"));
    expect(tapTerritory(game, NO_CHOICE, at("andes")).move).toBeNull();
  });

  it("chooses where to attack from, lights up the neighbours it may attack, then the target", () => {
    const game = world(TENKA_PHASES.attack, ["brazil", "colombia"], { brazil: 5 });
    const from = tapTerritory(game, NO_CHOICE, at("brazil"));
    expect(from.choice.from).toBe(at("brazil"));
    expect(from.move).toBeNull();
    const marks = marksFor(game, from.choice);
    expect(marks.chosen).toBe(at("brazil"));
    // Colombia is theirs: not lit. The Andes, the Southern Cone and West Africa across the sea are.
    expect([...marks.reach].sort()).toEqual([at("andes"), at("southernCone"), at("westAfrica")].sort());
    const target = tapTerritory(game, from.choice, at("westAfrica"));
    expect(target.choice.to).toBe(at("westAfrica"));
    // A territory with one army cannot attack; tapping the chosen one again puts it down.
    expect(tapTerritory(game, NO_CHOICE, at("colombia")).choice.from).toBeNull();
    expect(tapTerritory(game, from.choice, at("brazil")).choice).toEqual(NO_CHOICE);
  });

  it("fortifies to your own territories joined by your own land, with all but one moving unless told otherwise", () => {
    const game = world(TENKA_PHASES.fortify, ["brazil", "colombia", "mexico"], { brazil: 6 });
    const from = tapTerritory(game, NO_CHOICE, at("brazil"));
    expect([...marksFor(game, from.choice).reach].sort()).toEqual([at("colombia"), at("mexico")].sort());
    const to = tapTerritory(game, from.choice, at("mexico"));
    expect(to.choice).toMatchObject({ from: at("brazil"), to: at("mexico"), armies: 5 });
    // Across somebody else's: not joined.
    expect(tapTerritory(game, from.choice, at("andes")).choice.to).toBeNull();
  });

  it("keeps a choice only while the map still allows it", () => {
    const game = world(TENKA_PHASES.attack, ["brazil"], { brazil: 5 });
    const chosen = { ...NO_CHOICE, from: at("brazil"), to: at("andes") };
    expect(choiceNow(game, chosen)).toEqual(chosen);
    // Brazil down to one army: nothing to attack with.
    expect(choiceNow({ ...game, armies: game.armies.map((count, territory) => (territory === at("brazil") ? 1 : count)) }, chosen)).toEqual(NO_CHOICE);
    // The Andes taken: no longer a target.
    expect(choiceNow({ ...game, owners: game.owners.map((owner, territory) => (territory === at("andes") ? 0 : owner)) }, chosen).to).toBeNull();
  });
});
