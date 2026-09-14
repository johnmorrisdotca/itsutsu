import { describe, expect, it } from "vitest";

import { NO_HANDICAP, STONES } from "@/lib/gomoku/gomoku.constants";
import type { SetUpFork, SetUpOpponent } from "./setUp.types";
import { POST_FOR_ANYONE, recapWords } from "./setUpWords";

/**
 * The words the setup screen's own fields say in the line over Continue.
 *
 * The failure they exist to stop is a line that describes a different game from
 * the one the button would carry: "Post the seat for anyone" over a form that will
 * challenge somebody, or a handicap chosen and not mentioned.
 */
const them: SetUpOpponent = { id: "mem_them", name: "Bob Tester", computer: false };
/** The specialist, because a program is the case the fork wording was wrong for. */
const machine: SetUpOpponent = { id: "tamenoki", name: "Hidemasa Tamenoki", computer: true };
const fork: SetUpFork = { id: "g_old", move: 12, alone: false, colour: STONES.black };
const texts = (words: ReturnType<typeof recapWords>) => words.map((word) => word.text);

describe("what the set-up screen's own fields say", () => {
  it("names the opponent the press will actually bind, shortened as this site prints names", () => {
    expect(texts(recapWords({ opponent: them, fork: null, handicap: NO_HANDICAP }))).toEqual(["Against Bob T."]);
  });

  /*
   * A PROGRAM IS MARKED AS ONE, in the same words the doorstep uses a press
   * later. Somebody choosing an opponent and somebody confirming the game should
   * not be reading two different accounts of who is playing.
   */
  it("marks a computer player as one, as the doorstep does", () => {
    expect(texts(recapWords({ opponent: machine, fork: null, handicap: NO_HANDICAP }))).toEqual([
      "Against Hidemasa Tamenoki 機械",
    ]);
  });

  it("says the seat is posted where nobody is named, and does not shout about it", () => {
    const words = recapWords({ opponent: null, fork: null, handicap: NO_HANDICAP });
    expect(texts(words)).toEqual([POST_FOR_ANYONE]);
    // The ordinary answer: a line where every word shouts is a line where none does.
    expect(words[0].notable).toBe(false);
  });

  it("says a computer player is still to be drawn, rather than naming one or posting the seat", () => {
    const words = recapWords({ opponent: null, fork: null, handicap: NO_HANDICAP, random: true });
    expect(texts(words)).toEqual(["Against a random computer player"]);
    expect(words[0].notable).toBe(true);
  });

  /*
   * A FORK NAMES THE PLAYER WHO WAS IN THE POSITION. What the request carries (no
   * opponent, since the route reads the seats) is not what a line has to say, and
   * the screen is holding that player already.
   */
  it("names the player who was in the position a fork came out of", () => {
    expect(texts(recapWords({ opponent: them, fork, handicap: NO_HANDICAP }))).toEqual(["Against Bob T."]);
  });

  it("names a computer player a position was played against", () => {
    expect(texts(recapWords({ opponent: machine, fork, handicap: NO_HANDICAP }))).toEqual([
      "Against Hidemasa Tamenoki 機械",
    ]);
  });

  it("says a lone fork is against whoever the seat is handed to", () => {
    expect(texts(recapWords({ opponent: null, fork: { ...fork, alone: true }, handicap: NO_HANDICAP }))).toEqual([
      "Against whoever you hand the seat to",
    ]);
  });

  /*
   * And a fork with no opponent still says that rather than "post the seat for
   * anyone" or a random program: a fork is never posted, and never drawn.
   */
  it("never says a fork is posted for anyone, or drawn", () => {
    expect(texts(recapWords({ opponent: null, fork, handicap: NO_HANDICAP, random: true }))).toEqual([
      "Against whoever you hand the seat to",
    ]);
  });

  it("says a handicap after the opponent, in the order the fields appear", () => {
    const words = recapWords({
      opponent: them,
      fork: null,
      handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true },
    });
    expect(texts(words)).toEqual(["Against Bob T.", "Black handicap: no double three"]);
    expect(words[1].notable).toBe(true);
  });

  it("says nothing at all about a handicap where there is none", () => {
    expect(recapWords({ opponent: them, fork: null, handicap: NO_HANDICAP })).toHaveLength(1);
  });
});
