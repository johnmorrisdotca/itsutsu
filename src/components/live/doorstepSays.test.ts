import { describe, expect, it } from "vitest";

import {
  NO_HANDICAP,
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  STONES,
} from "@/lib/gomoku/gomoku.constants";
import { RATING_REFUSALS, RATING_REFUSED_WORD } from "@/lib/rating/rateable.constants";
import { describeGameProse, describeSeating, type DoorstepWho } from "./doorstepSays";
import type { RulesDraft } from "./rulesDraft";

/**
 * WHAT THE DOORSTEP TELLS SOMEBODY BEFORE THEY COMMIT TO A GAME.
 *
 * Worth testing without a browser because the interesting part is not the
 * rendering: it is which facts can honestly be stated. Two of the cases below
 * are about the page DECLINING to say something, and those are the ones that
 * matter — a colour named under a swap opening would be a perfectly plausible
 * sentence that is wrong half the time, and this codebase has a section about
 * exactly that shape of bug.
 */

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

const who: DoorstepWho = {
  opponent: "Bob Tester",
  computer: false,
  mine: STONES.white,
  opener: STONES.black,
  screen: false,
};

describe("the game a doorstep is about, in sentences", () => {
  it("names the game, its kanji and the board it is on", () => {
    expect(describeGameProse(draft, null)).toContain("Gomoku 五目並べ on a 19×19 board.");
  });

  it("says an 8×8 board with the right article, because a person reads it aloud", () => {
    expect(describeGameProse({ ...draft, variant: "reversi", size: 8 }, null)).toContain("on an 8×8 board");
  });

  it("leaves a free opening unsaid, and says any other one", () => {
    expect(describeGameProse(draft, null)).not.toContain("opening");
    expect(describeGameProse({ ...draft, opening: OPENING_RULES.pro }, null)).toContain("Pro opening.");
  });

  it("says the clock, the ratings and resigning, in the words the setup screen used", () => {
    const said = describeGameProse({ ...draft, moveTimeMs: 300_000, rated: false, allowResign: false }, null);
    expect(said).toContain("No resigning.");
    expect(said).toContain("5 minutes a move.");
    expect(said).toContain("Friendly.");
  });

  it("says a handicap, whose colour and which restrictions", () => {
    const said = describeGameProse(
      { ...draft, handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true } },
      null,
    );
    expect(said).toContain("Black handicap: no double three.");
  });

  it("says the star points are blocked, where they are", () => {
    expect(describeGameProse({ ...draft, obstacles: OBSTACLE_LAYOUTS.hoshi }, null)).toContain(
      "with the star points blocked",
    );
  });

  it("describes the board the game will actually be drawn on", () => {
    /*
     * Reversi is 8×8 and nothing else, so a draft carrying 19 describes a board
     * nobody will ever see. The engine snaps it on the way in; this snaps it on the
     * way to the page, so the sentence and the board cannot disagree.
     */
    expect(describeGameProse({ ...draft, variant: "reversi", size: 19 }, null)).toContain("8×8");
  });

  /*
   * THE TWO SENTENCES ON THIS PAGE THAT MUST AGREE.
   *
   * A fork with nobody to hand the second seat to becomes a board at one
   * screen, and `describeSeating` has always said so — "Both seats are yours".
   * The settings paragraph beneath it read the draft's own flag, which a fork
   * of a rated game carries as true, so the page said both "both seats are
   * yours" and "Rated." about one game. The rating there is not the draft's to
   * claim: the write path reads the seats before the names and a hot-seat game
   * never reaches `recordResult` at all.
   */
  it("says a game at one screen will not count, rather than reading the draft's flag", () => {
    const said = describeGameProse({ ...draft, rated: true }, RATING_REFUSALS.hotSeat);
    expect(said).toContain(`${RATING_REFUSED_WORD}.`);
    expect(said).not.toContain("Rated.");
  });

  it("and does not contradict the seating sentence beside it", () => {
    const screen: DoorstepWho = { ...who, opponent: null, mine: null, screen: true };
    expect(describeSeating(draft, screen)).toContain("two people at one screen");
    // The doorstep hands both halves the same answer, read off the same `screen`.
    const refused = screen.screen ? RATING_REFUSALS.hotSeat : null;
    expect(describeGameProse({ ...draft, rated: true }, refused)).toContain(RATING_REFUSED_WORD);
  });

  it("leaves the rating to the draft for a fork against a person, which is an offer and counts", () => {
    // Since offers, a fork naming somebody binds one seat and offers the
    // other, so it is a game between two people like any other.
    expect(describeGameProse({ ...draft, rated: true }, null)).toContain("Rated.");
  });
});

describe("who plays which colour, said on the doorstep", () => {
  it("names both colours and who moves first", () => {
    expect(describeSeating(draft, who)).toContain(
      "Against Bob T., who plays black; you are white and move second.",
    );
  });

  /*
   * AND THAT BEGIN MAKES AN OFFER RATHER THAN A GAME.
   *
   * The doorstep's whole job is that nothing is a surprise on the other side of
   * it, and "this person is now in a game with you" stopped being what Begin
   * does. Somebody who reads this page and presses the button should know they
   * are asking — otherwise the first surprise is a board that will not let them
   * move, and the second is finding out that the other person can say no.
   *
   * Appended to whatever the seating turns out to be, rather than written into
   * each of the four branches, because a branch is exactly where a sentence
   * gets forgotten — so it is asserted on the branches too.
   */
  it("says an opponent can accept or decline, and that refusing costs nothing", () => {
    const said = describeSeating(draft, who);
    expect(said).toContain("This is an offer");
    expect(said).toContain("Bob T. can accept or decline");
    expect(said).toContain("costs nobody anything");
  });

  it("says it under a swap opening too, where the colours are not settled", () => {
    const said = describeSeating({ opening: OPENING_RULES.swap }, who);
    expect(said).toContain("This is an offer");
  });

  /*
   * NOT FOR A PROGRAM, and this is the exception rather than an oversight: a
   * computer has nothing to accept with, never signs in, and its game starts at
   * once — which is the reason people pick one. Saying "it can decline" of a
   * program would be untrue of the one opponent that never does.
   */
  it("says nothing of the sort about a computer, which has nothing to accept with", () => {
    expect(describeSeating(draft, { ...who, computer: true })).not.toContain("an offer");
  });

  it("says nothing of the sort about two people at one screen, or a posted seat", () => {
    expect(describeSeating(draft, { ...who, screen: true })).not.toContain("an offer");
    expect(describeSeating(draft, { ...who, opponent: null })).not.toContain("an offer");
  });

  it("says you move first when the colour you hold is the one that opens", () => {
    expect(describeSeating(draft, { ...who, mine: STONES.black })).toContain(
      "you are black and move first",
    );
  });

  it("reads the opener rather than assuming black", () => {
    // A carried game may have been set the other way round, and then "move first"
    // belongs to white. Assuming black here would be a sentence nobody checked.
    expect(describeSeating(draft, { ...who, opener: STONES.white })).toContain(
      "you are white and move first",
    );
  });

  it("marks a computer player as one", () => {
    expect(describeSeating(draft, { ...who, opponent: "Kyu", computer: true })).toContain("Kyu 機械");
  });

  it("says a seat posted for anyone is posted, and where", () => {
    const said = describeSeating(draft, { ...who, opponent: null, mine: STONES.black });
    expect(said).toContain("You are black and move first");
    expect(said).toContain("posted on the games page");
  });

  /*
   * THE TWO CASES WHERE IT MUST NOT ANSWER. A rule that cannot measure must not
   * fire: a colour here would be in range, readable, and wrong.
   */
  it("declines to name a colour when a swap opening will decide it", () => {
    for (const opening of [OPENING_RULES.swap, OPENING_RULES.swap2, OPENING_RULES.rif]) {
      const said = describeSeating({ ...draft, opening }, who);
      expect(said, opening).toContain("decides who plays which colour");
      expect(said, opening).not.toContain("you are white");
      expect(said, opening).not.toContain("you are black");
    }
  });

  it("still names the opponent when the opening decides the colours", () => {
    // Declining one fact is not declining the paragraph: who it is against is
    // known, and dropping it would answer a question nobody asked.
    expect(describeSeating({ ...draft, opening: OPENING_RULES.swap2 }, who)).toContain("Bob T.");
  });

  it("says both seats are yours at one screen, rather than naming a colour", () => {
    const said = describeSeating(draft, { ...who, opponent: null, mine: null, screen: true });
    expect(said).toContain("Both seats are yours");
  });

  it("declines rather than guessing when nothing has settled a colour", () => {
    const said = describeSeating(draft, { ...who, mine: null });
    expect(said).toContain("settled when the game is made");
    expect(said).not.toContain("you are black");
  });
});
