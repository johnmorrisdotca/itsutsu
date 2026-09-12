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
const fork: SetUpFork = { id: "g_old", move: 12, alone: false, colour: STONES.black };
const texts = (words: ReturnType<typeof foldedWords>) => words.map((word) => word.text);

describe("what the folded fields say", () => {
  it("names the opponent the press will actually bind, shortened as this site prints names", () => {
    expect(texts(foldedWords({ chosen: them, fork: null, handicap: NO_HANDICAP }))).toEqual([
      "Against Bob T.",
    ]);
  });

  it("says the seat is posted where nobody is named, and does not shout about it", () => {
    const words = foldedWords({ chosen: null, fork: null, handicap: NO_HANDICAP });
    expect(texts(words)).toEqual([POST_FOR_ANYONE]);
    // The ordinary answer: a line where every word shouts is a line where none does.
    expect(words[0].notable).toBe(false);
  });

  /*
   * A FORK NAMES NOBODY, and which of the two things it says depends on whether
   * there was anybody in the game it came from. The route finds the other
   * player by reading the seats, so this screen has no id to offer — and a
   * fork with nobody becomes a board at one screen, which is the case the
   * rating control is withheld for (`RulesForm`'s `refused`).
   */
  it("says a fork is against the same opponent, where the game it came from had one", () => {
    expect(texts(foldedWords({ chosen: null, fork, handicap: NO_HANDICAP }))).toEqual([
      "Against the same opponent",
    ]);
  });

  it("says a lone fork is against whoever the seat is handed to", () => {
    expect(texts(foldedWords({ chosen: null, fork: { ...fork, alone: true }, handicap: NO_HANDICAP }))).toEqual([
      "Against whoever you hand the seat to",
    ]);
  });

  it("lets the fork win over a chosen opponent, which is what the press does", () => {
    // `creationFor` sends `from` and never a challenge for a fork, so a select
    // left holding somebody is not who the new game is against.
    expect(texts(foldedWords({ chosen: them, fork, handicap: NO_HANDICAP }))).toEqual([
      "Against the same opponent",
    ]);
  });

  it("says a handicap after the opponent, in the order the fields appear inside", () => {
    const words = foldedWords({
      chosen: them,
      fork: null,
      handicap: { ...NO_HANDICAP, stone: STONES.black, doubleThree: true },
    });
    expect(texts(words)).toEqual(["Against Bob T.", "Black handicap: no double three"]);
    expect(words[1].notable).toBe(true);
  });

  it("says nothing at all about a handicap where there is none", () => {
    // Not "no handicap": the line is what this game IS, and the ordinary
    // answer to a question nobody asked is not worth a word of it.
    expect(foldedWords({ chosen: them, fork: null, handicap: NO_HANDICAP })).toHaveLength(1);
  });
});
