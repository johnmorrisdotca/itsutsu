import { describe, expect, it } from "vitest";

import { NO_HANDICAP, STONES } from "@/lib/gomoku/gomoku.constants";
import type { SetUpFork, SetUpOpponent } from "./setUp.types";
import { POST_FOR_ANYONE, foldedWords } from "./setUpWords";

/**
 * The two words the setup screen's own fields say while they are folded away.
 *
 * The failure they exist to stop is a disclosure that describes a different
 * game from the one the button would start: "Post the seat for anyone" over a
 * form that will challenge somebody, or a handicap chosen and not mentioned.
 * Five controls went behind that disclosure to keep Start above an iPad's
 * fold, and a summary that can be wrong costs more than the height did.
 */
const them: SetUpOpponent = { id: "mem_them", name: "Bob Tester", computer: false };
/** The specialist, because a program is the case the fork wording was wrong for. */
const machine: SetUpOpponent = { id: "tamenoki", name: "Hidemasa Tamenoki", computer: true };
const fork: SetUpFork = { id: "g_old", move: 12, alone: false, colour: STONES.black };
const texts = (words: ReturnType<typeof foldedWords>) => words.map((word) => word.text);

describe("what the folded fields say", () => {
  it("names the opponent the press will actually bind, shortened as this site prints names", () => {
    expect(texts(foldedWords({ opponent: them, fork: null, handicap: NO_HANDICAP }))).toEqual([
      "Against Bob T.",
    ]);
  });

  /*
   * A PROGRAM IS MARKED AS ONE, in the same words the doorstep uses a press
   * later. Somebody choosing an opponent and somebody confirming the game should
   * not be reading two different accounts of who is playing.
   */
  it("marks a computer player as one, as the doorstep does", () => {
    expect(texts(foldedWords({ opponent: machine, fork: null, handicap: NO_HANDICAP }))).toEqual([
      "Against Hidemasa Tamenoki 機械",
    ]);
  });

  it("says the seat is posted where nobody is named, and does not shout about it", () => {
    const words = foldedWords({ opponent: null, fork: null, handicap: NO_HANDICAP });
    expect(texts(words)).toEqual([POST_FOR_ANYONE]);
    // The ordinary answer: a line where every word shouts is a line where none does.
    expect(words[0].notable).toBe(false);
  });

  /*
   * A FORK NAMES THE PLAYER WHO WAS IN THE POSITION, and it used to say "the
   * same opponent" — vaguer than it needed to be, and the vagueness came from the
   * REQUEST rather than from what was knowable: a fork sends no opponent, because
   * the route finds the other player by reading the seats. What is sent is not
   * what a line has to say, and the screen is holding that player already.
   *
   * It mattered most for the case that was broken. A fork of a game against a
   * computer player became two people at one screen, and this line was the one
   * thing on the screen that could have said a program was about to take the
   * seat — and did not.
   */
  it("names the player who was in the position a fork came out of", () => {
    expect(texts(foldedWords({ opponent: them, fork, handicap: NO_HANDICAP }))).toEqual([
      "Against Bob T.",
    ]);
  });

  it("names a computer player a position was played against", () => {
    expect(texts(foldedWords({ opponent: machine, fork, handicap: NO_HANDICAP }))).toEqual([
      "Against Hidemasa Tamenoki 機械",
    ]);
  });

  /*
   * A fork of a game NOBODY ELSE was in — a hot-seat board, or one this reader
   * only watched — becomes a board at one screen, which is the case the rating
   * control is withheld for (`RulesForm`'s `refused`).
   */
  it("says a lone fork is against whoever the seat is handed to", () => {
    expect(
      texts(foldedWords({ opponent: null, fork: { ...fork, alone: true }, handicap: NO_HANDICAP })),
    ).toEqual(["Against whoever you hand the seat to"]);
  });

  /*
   * And a fork with no opponent still says that rather than "post the seat for
   * anyone": a fork is never posted, whatever the select behind it holds.
   */
  it("never says a fork is posted for anyone", () => {
    expect(texts(foldedWords({ opponent: null, fork, handicap: NO_HANDICAP }))).toEqual([
      "Against whoever you hand the seat to",
    ]);
  });

  it("says a handicap after the opponent, in the order the fields appear inside", () => {
    const words = foldedWords({
      opponent: them,
      fork: null,
      handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true },
    });
    expect(texts(words)).toEqual(["Against Bob T.", "Black handicap: no double three"]);
    expect(words[1].notable).toBe(true);
  });

  it("says nothing at all about a handicap where there is none", () => {
    // Not "no handicap": the line is what this game IS, and the ordinary
    // answer to a question nobody asked is not worth a word of it.
    expect(foldedWords({ opponent: them, fork: null, handicap: NO_HANDICAP })).toHaveLength(1);
  });
});
