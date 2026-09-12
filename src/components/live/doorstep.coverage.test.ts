import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NO_HANDICAP, OBSTACLE_LAYOUTS, OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import { SET_UP_PARAMS } from "@/lib/gomoku/slugs";
import { draftParams } from "./setUpAddress";
import type { RulesDraft } from "./rulesDraft";

/**
 * THE DOORSTEP IS THE ONLY PLACE A GAME IS CREATED FROM A SETUP, AND THE ONLY
 * PLACE ANYTHING IS ASKED BEFORE ONE.
 *
 * John asked for this page four times. Each earlier answer improved the screen
 * where a game is CHOSEN and left the press that starts it going straight to a
 * board, because "settle the rules before the game exists" reads as one screen
 * and is two. That is a mistake you can make again, and nothing in the type
 * system would notice: a new button that posts to the creation route, or a
 * select quietly put back beside a board, would compile, pass every existing
 * test, and undo the whole thing.
 *
 * So the shape is a gate. Crude on purpose, in the manner of
 * `gameLinks.coverage.test.ts`: it reads the source and looks for the two moves
 * that would take this back. Anything cleverer would need the components
 * rendered, and this is a rule about what the source asks for.
 *
 * The exceptions are named with their reasons, which is the point of them — a
 * rule with unexplained holes rots, and a rule whose holes say why they are
 * holes can be argued with.
 */

const ROOTS = ["src/components/live", "src/components/mine", "src/app/games"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|coverage)\.tsx?$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({
  path,
  source: readFileSync(path, "utf8"),
}));

/**
 * The files allowed to ask the creation route for a game, and why each one is.
 *
 * `Doorstep.tsx` is the answer to the ticket: every way of asking for a game
 * reaches the setup screen, the setup screen reaches the doorstep, and the
 * doorstep is where the press that writes a row lives.
 *
 * `StartSharedGame.tsx` is NOT a setup and that is why it is here. It sits beside
 * a scratch board at /games/<game>/play, where somebody is already playing: it
 * turns the game in front of them into one two devices can share. There is
 * nothing to confirm that they are not looking at, and sending them to a page
 * describing the board they are sitting at would be a step with no content.
 */
const MAY_CREATE = new Map([
  ["Doorstep.tsx", "the doorstep — the one press that starts a game from a setup"],
  ["StartSharedGame.tsx", "sharing a board somebody is already playing at one screen"],
]);

describe("only the doorstep starts a game from a setup", () => {
  it("is the only component in this flow that posts to the creation route", () => {
    const creators = FILES.filter(({ source }) => source.includes('"/api/games/live"')).map(
      ({ path }) => path,
    );
    expect(creators.length, "nothing posts to the creation route at all").toBeGreaterThan(0);
    for (const path of creators) {
      const name = path.split("/").pop() ?? path;
      expect(
        MAY_CREATE.has(name),
        `${path} posts to /api/games/live. If that is right, name it in MAY_CREATE with its reason; if not, carry the draft to the doorstep instead — see beginLink.`,
      ).toBe(true);
    }
  });

  it("and the setup screen carries the draft there rather than writing anything", () => {
    const setUp = FILES.find(({ path }) => path.endsWith("SetUpGame.tsx"));
    expect(setUp, "SetUpGame.tsx has moved").toBeDefined();
    expect(setUp!.source).toContain("beginLink(");
    expect(
      setUp!.source.includes("/api/games/live"),
      "the setup screen is writing a game again; the press belongs on the doorstep",
    ).toBe(false);
  });

  it("and the doorstep itself offers no control that changes the game", () => {
    /*
     * The failure this catches is the quiet one: a doorstep that grows a select
     * is a second setup screen, and the reason there are two pages is that
     * choosing and confirming are different acts. A page that does both is the
     * page John has been given three times.
     */
    const doorstep = FILES.find(({ path }) => path.endsWith("live/Doorstep.tsx"));
    expect(doorstep, "Doorstep.tsx has moved").toBeDefined();
    for (const control of ["RulesForm", "<Select", "<Toggle", "GamePicker", "BoardPicker"]) {
      expect(
        doorstep!.source.includes(control),
        `Doorstep.tsx offers ${control}. It states a game; it does not ask about one.`,
      ).toBe(false);
    }
  });

  it("and the board beside a game offers none either", () => {
    /*
     * The other half of the same rule, and the half that had been half-fixed:
     * the rules were agreed on the doorstep, so a board does not re-offer them.
     * "We do not want to see that Game board with all the settings on the side."
     */
    const board = FILES.find(({ path }) => path.endsWith("live/SharedRules.tsx"));
    expect(board, "SharedRules.tsx has moved").toBeDefined();
    for (const control of ["RulesForm", "<Select", "<Toggle"]) {
      expect(
        board!.source.includes(control),
        `SharedRules.tsx offers ${control}. The rules were confirmed before the game; the board says what they are.`,
      ).toBe(false);
    }
  });
});

/**
 * EVERY RULE OF A GAME TRAVELS IN THE ADDRESS.
 *
 * The doorstep renders from its own query and nothing else, and "change
 * something" is the same query pointed back at the setup screen. So a field
 * added to `RulesDraft` and not to `draftParams` is a choice that gets silently
 * reset on the way back — and silently is the whole trouble: the address looks
 * right and the game is not the one that was agreed.
 *
 * Keyed off the draft's own fields rather than a list written here, so the gate
 * notices a field nobody thought about. `readSetUpAsked` reading it back is
 * tested in `setUpAddress.test.ts`; this is the half that cannot be forgotten.
 */
describe("the address carries the whole of a settled game", () => {
  const draft: RulesDraft = {
    variant: "freestyle",
    size: 19,
    obstacles: OBSTACLE_LAYOUTS.none,
    opening: OPENING_RULES.free,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    clockMode: "move",
    rated: true,
    allowResign: true,
    open: false,
    handicap: NO_HANDICAP,
  };

  /**
   * Which parameter says each field, and the one field that has no parameter.
   *
   * `open` is deliberately absent: whether a seat is posted is not a rule of the
   * game, it is decided by whether anybody has been named to play it, and the
   * `against`, `rematch`, `from` and `sit` parameters already say that.
   * `creationFor` overrules anything the draft claims about it.
   */
  const CARRIED_BY: Record<keyof RulesDraft, string | null> = {
    variant: SET_UP_PARAMS.game,
    size: SET_UP_PARAMS.board,
    obstacles: SET_UP_PARAMS.blocks,
    opening: SET_UP_PARAMS.opening,
    moveTimeMs: SET_UP_PARAMS.pace,
    timeoutPenalty: SET_UP_PARAMS.penalty,
    clockMode: SET_UP_PARAMS.clock,
    rated: SET_UP_PARAMS.rated,
    allowResign: SET_UP_PARAMS.resign,
    handicap: SET_UP_PARAMS.handicap,
    open: null,
  };

  it("has a parameter for every field of the draft, or says why not", () => {
    const written = new Set(draftParams(draft).map(([name]) => name));
    for (const field of Object.keys(draft) as (keyof RulesDraft)[]) {
      const param = CARRIED_BY[field];
      expect(
        param,
        `RulesDraft.${field} is new. Add it to draftParams and to CARRIED_BY, or say here why an address need not carry it.`,
      ).not.toBeUndefined();
      if (param === null) continue;
      expect(written, `RulesDraft.${field} is not written into the address`).toContain(param);
    }
  });

  it("writes every one of them on every link, even the ordinary values", () => {
    /*
     * An absent parameter means "nobody said", and both screens answer silence by
     * falling back — to a member's usual clock, to the handicap a rematched game
     * carried. So an ordinary value left out is a choice reversed on the way back.
     */
    const written = draftParams(draft);
    for (const [name, value] of written) {
      expect(value, `${name} was written empty`).not.toBe("");
    }
    expect(written).toHaveLength(Object.values(CARRIED_BY).filter((one) => one !== null).length);
  });
});
