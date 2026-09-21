import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NO_HANDICAP, NO_HEAD_START, OBSTACLE_LAYOUTS, OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import { SET_UP_PARAMS } from "@/lib/gomoku/slugs";
import { draftParams } from "./setUpAddress";
import type { RulesDraft } from "./rulesDraft";

/**
 * A GAME IS STATED IN FULL BEFORE IT IS WRITTEN, AND NOTHING ASKS ABOUT ONE
 * AFTERWARDS.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * THIS GATE USED TO SAY "ONLY THE DOORSTEP MAY WRITE A GAME". READ WHY IT NO
 * LONGER DOES BEFORE CHANGING IT BACK.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * John asked for the doorstep four times. Each earlier answer improved the
 * screen where a game is CHOSEN and left the press that starts it going
 * straight to a board — "settle the rules before the game exists" reads as one
 * screen and is two — so this gate pinned the press to `Doorstep.tsx`.
 *
 * What it pinned was the LOCATION rather than the promise, and the location
 * turned out to cost a screen. John, 2026-09-21: "our game signup and starting
 * process seems to have one too many screens… too much repeat info on the
 * multi-screens… ideally, one viewport/screen should be all the info, when
 * collapsed." The two screens were stating the same rules a press apart: the
 * set-up screen's folded rows say every rule and the board picture sits above
 * them, and the doorstep then said all of it again and made the game.
 *
 * So the set-up screen states the game and writes it, and the promise is
 * unchanged: nothing is written until a deliberate press, and what that press
 * will make is on the screen above it in full. The doorstep did not go — it is
 * the screen for taking a seat SOMEBODY ELSE posted, where the rules being
 * agreed to are theirs and reading them first is the whole point.
 *
 * The mistake this still catches is the original one, and it is the one you can
 * make again: a press that writes a game nobody has been shown, or a board that
 * grows the settings back beside it. Nothing in the type system would notice
 * either.
 *
 * Crude on purpose, in the manner of `gameLinks.coverage.test.ts`: it reads the
 * source and looks for the moves that would take this back. The exceptions are
 * named with their reasons, which is the point of them — a rule with
 * unexplained holes rots, and a rule whose holes say why they are holes can be
 * argued with.
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
 * `beginGame.ts` is the ONE request, shared: the set-up screen presses it for
 * a game of your own and the doorstep presses it for a seat somebody posted,
 * so the two cannot drift into sending different bodies. It was inside
 * `Doorstep.tsx` while the doorstep was the only screen that could write.
 *
 * `StartSharedGame.tsx` is NOT a setup and that is why it is here. It sits beside
 * a scratch board at /games/<game>/play, where somebody is already playing: it
 * turns the game in front of them into one two devices can share. There is
 * nothing to confirm that they are not looking at, and sending them to a page
 * describing the board they are sitting at would be a step with no content.
 */
const MAY_CREATE = new Map([
  ["beginGame.ts", "the one request, pressed by the set-up screen and by the doorstep"],
  ["StartSharedGame.tsx", "sharing a board somebody is already playing at one screen"],
]);

describe("a game is stated before it is written", () => {
  it("goes through one request, and nothing else in this flow posts to the creation route", () => {
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

  it("and the setup screen says the whole game before its press writes one", () => {
    /*
     * THE PROMISE, NOW THAT THIS SCREEN IS THE ONE THAT WRITES. Three things
     * have to be on it, and each was on the doorstep before:
     *
     *  - every rule, on the rows that hold them (`foldedWords`) — a folded
     *    group that printed nothing would be the fold this site took out once
     *    already;
     *  - who sits where, in a sentence, which is the one fact the doorstep had
     *    that this screen did not;
     *  - a press that writes, and nothing that writes without one.
     *
     * A future edit that takes any of them off leaves a screen that makes a
     * game nobody was shown, which is the fault this whole gate is about.
     */
    const setUp = FILES.find(({ path }) => path.endsWith("live/SetUpGame.tsx"));
    const bar = FILES.find(({ path }) => path.endsWith("live/BeginBar.tsx"));
    expect(setUp, "SetUpGame.tsx has moved").toBeDefined();
    expect(bar, "BeginBar.tsx has moved").toBeDefined();
    /*
     * Read over the SCREEN rather than over one file. The statement and the
     * press sit in `BeginBar`, which `SetUpGame` renders — a split made when
     * that file passed the File Size Gate — and a rule that named one file
     * would have failed on the day the screen was tidied rather than on the
     * day the promise was broken. That the two are still one screen is the
     * first thing asserted.
     */
    expect(setUp!.source, "the set-up screen no longer renders its own press").toContain("<BeginBar");
    const screen = `${setUp!.source}\n${bar!.source}`;
    for (const said of ["foldedWords(", 'data-testid="set-up-seating"', "useSetUpPress("]) {
      expect(
        screen.includes(said),
        `the set-up screen no longer has ${said}: it writes a game without stating it in full first.`,
      ).toBe(true);
    }
    /*
     * And it still knows the way to the doorstep, because a seat somebody else
     * posted is read there before it is sat at.
     */
    expect(setUp!.source).toContain("beginLink(");
  });

  it("and the doorstep is still where somebody else's posted seat is read", () => {
    const waiting = FILES.find(({ path }) => path.endsWith("mine/waitingRoom.ts"));
    expect(waiting, "waitingRoom.ts has moved").toBeDefined();
    expect(
      waiting!.source.includes("beginLink("),
      "the waiting room no longer sends a posted seat to the doorstep; its rules are somebody else's to read first",
    ).toBe(true);
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
    headStart: NO_HEAD_START,
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
    headStart: SET_UP_PARAMS.headStart,
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
